import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const WORKFLOW_ROOT = path.join(ROOT, "workflows");
const WORKFLOW_PACKAGE_KIND = "octastack.workflow.package";
const WORKFLOW_PACKAGE_VERSION = 1;
const NODE_FOOTPRINTS = {
  triggerNode: { width: 520, height: 380 },
  proxmoxConfigNode: { width: 320, height: 260 },
  provisionNode: { width: 640, height: 3000 },
  waitUntilUpNode: { width: 420, height: 700 },
  serverNode: { width: 680, height: 1250 },
  customNode: { width: 640, height: 900 },
  configCommandNode: { width: 320, height: 300 },
  endNode: { width: 220, height: 200 },
  default: { width: 420, height: 320 }
};

function walkJsonFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

function hasNumericPosition(node) {
  return Number.isFinite(node?.position?.x) && Number.isFinite(node?.position?.y);
}

function nodeFootprint(node) {
  return NODE_FOOTPRINTS[node.type] ?? NODE_FOOTPRINTS.default;
}

function nodeRect(node) {
  const footprint = nodeFootprint(node);
  return {
    left: node.position.x,
    top: node.position.y,
    right: node.position.x + footprint.width,
    bottom: node.position.y + footprint.height
  };
}

function rectanglesOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function validateNodeLayout(nodes, fileName) {
  const errors = [];
  const positioned = nodes.filter(hasNumericPosition);
  for (let i = 0; i < positioned.length; i += 1) {
    for (let j = i + 1; j < positioned.length; j += 1) {
      const a = positioned[i];
      const b = positioned[j];
      if (rectanglesOverlap(nodeRect(a), nodeRect(b))) {
        errors.push(`${fileName}: nodes ${a.id} and ${b.id} are too close at (${a.position.x}, ${a.position.y}) and (${b.position.x}, ${b.position.y})`);
      }
    }
  }
  return errors;
}

function validateWorkflow(workflow, fileName) {
  const errors = [];
  if (!workflow || typeof workflow !== "object") {
    return [`${fileName}: top-level value must be an object`];
  }
  if (!Array.isArray(workflow.nodes)) {
    errors.push(`${fileName}: nodes must be an array`);
  }
  if (!Array.isArray(workflow.edges)) {
    errors.push(`${fileName}: edges must be an array`);
  }
  if (errors.length) {
    return errors;
  }

  const nodeIds = new Set();
  const nodesById = new Map();
  for (const node of workflow.nodes) {
    if (!node.id || !node.type || !node.position || node.data === undefined) {
      errors.push(`${fileName}: node is missing id/type/position/data`);
    }
    if (node.position && !hasNumericPosition(node)) {
      errors.push(`${fileName}: node ${node.id} position must contain numeric x/y`);
    }
    if (nodeIds.has(node.id)) {
      errors.push(`${fileName}: duplicate node id ${node.id}`);
    }
    nodeIds.add(node.id);
    nodesById.set(node.id, node);
  }
  errors.push(...validateNodeLayout(workflow.nodes, fileName));

  if (![...nodesById.values()].some((node) => node.type === "triggerNode")) {
    errors.push(`${fileName}: missing triggerNode`);
  }
  if ([...nodesById.values()].some((node) => node.type === "startNode")) {
    errors.push(`${fileName}: startNode is legacy and must not be generated`);
  }

  const incoming = new Map([...nodeIds].map((id) => [id, []]));
  const outgoing = new Map([...nodeIds].map((id) => [id, []]));
  const edgeIds = new Set();

  for (const edge of workflow.edges) {
    if (!edge.id || !edge.source || !edge.target || !edge.type || !edge.mode) {
      errors.push(`${fileName}: edge is missing id/source/target/type/mode`);
    }
    if (edgeIds.has(edge.id)) {
      errors.push(`${fileName}: duplicate edge id ${edge.id}`);
    }
    edgeIds.add(edge.id);
    if (!nodeIds.has(edge.source)) {
      errors.push(`${fileName}: edge ${edge.id} source does not exist`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`${fileName}: edge ${edge.id} target does not exist`);
    }
    if (!["sequential", "parallel"].includes(edge.mode)) {
      errors.push(`${fileName}: edge ${edge.id} has invalid mode ${edge.mode}`);
    }
    if (edge.data?.mode && edge.data.mode !== edge.mode) {
      errors.push(`${fileName}: edge ${edge.id} data.mode does not match top-level mode`);
    }
    incoming.get(edge.target)?.push(edge);
    outgoing.get(edge.source)?.push(edge);
  }

  for (const node of nodesById.values()) {
    if (node.type === "triggerNode" && incoming.get(node.id)?.length) {
      errors.push(`${fileName}: triggerNode ${node.id} has incoming edge`);
    }
    if (node.type === "endNode" && outgoing.get(node.id)?.length) {
      errors.push(`${fileName}: endNode ${node.id} has outgoing edge`);
    }
  }

  for (const [source, edges] of outgoing.entries()) {
    const sequential = edges.filter((edge) => edge.mode === "sequential");
    const orders = new Set();
    for (const edge of sequential) {
      if (!Number.isInteger(edge.order) || edge.order <= 0) {
        errors.push(`${fileName}: sequential edge ${edge.id} has invalid order`);
      }
      if (orders.has(edge.order)) {
        errors.push(`${fileName}: source ${source} has duplicate sequential order ${edge.order}`);
      }
      orders.add(edge.order);
    }
  }

  function hasUpstream(startId, type) {
    const seen = new Set();
    const stack = [...(incoming.get(startId) ?? []).map((edge) => edge.source)];
    while (stack.length) {
      const current = stack.pop();
      if (seen.has(current)) {
        continue;
      }
      seen.add(current);
      if (nodesById.get(current)?.type === type) {
        return true;
      }
      stack.push(...(incoming.get(current) ?? []).map((edge) => edge.source));
    }
    return false;
  }

  function canReach(startId, predicate) {
    const seen = new Set();
    const stack = [...(outgoing.get(startId) ?? []).map((edge) => edge.target)];
    while (stack.length) {
      const current = stack.pop();
      if (seen.has(current)) {
        continue;
      }
      seen.add(current);
      if (predicate(nodesById.get(current))) {
        return true;
      }
      stack.push(...(outgoing.get(current) ?? []).map((edge) => edge.target));
    }
    return false;
  }

  for (const node of nodesById.values()) {
    if (node.type === "provisionNode" && !hasUpstream(node.id, "proxmoxConfigNode")) {
      errors.push(`${fileName}: provisionNode ${node.id} lacks upstream proxmoxConfigNode`);
    }
    if (node.type === "destroyNode" && !hasUpstream(node.id, "provisionNode")) {
      errors.push(`${fileName}: destroyNode ${node.id} lacks upstream provisionNode`);
    }
    if (node.type === "waitUntilUpNode" && !hasUpstream(node.id, "provisionNode") && !hasUpstream(node.id, "serverNode")) {
      errors.push(`${fileName}: waitUntilUpNode ${node.id} lacks upstream provisionNode/serverNode`);
    }
    if (["configureNode", "actionNode", "configCommandNode", "configFileNode", "configPackageNode", "configServiceNode"].includes(node.type)) {
      if (!hasUpstream(node.id, "provisionNode") && !hasUpstream(node.id, "serverNode")) {
        errors.push(`${fileName}: ${node.type} ${node.id} lacks upstream provisionNode/serverNode`);
      }
    }
    if (node.type === "conditionNode") {
      const handles = new Set((outgoing.get(node.id) ?? []).map((edge) => edge.sourceHandle));
      if (!handles.has("true") || !handles.has("false")) {
        errors.push(`${fileName}: conditionNode ${node.id} must have true and false branches`);
      }
    }
    if (node.type === "loopStartNode" && !canReach(node.id, (candidate) => candidate?.type === "loopEndNode")) {
      errors.push(`${fileName}: loopStartNode ${node.id} cannot reach loopEndNode`);
    }
  }

  return errors;
}

function validateWorkflowPackage(pkg, fileName) {
  const errors = [];
  if (!pkg || typeof pkg !== "object" || Array.isArray(pkg)) {
    return [`${fileName}: top-level value must be a workflow package object`];
  }
  if (pkg.kind !== WORKFLOW_PACKAGE_KIND) {
    errors.push(`${fileName}: kind must be ${JSON.stringify(WORKFLOW_PACKAGE_KIND)}`);
  }
  if (pkg.version !== WORKFLOW_PACKAGE_VERSION) {
    errors.push(`${fileName}: version must be ${WORKFLOW_PACKAGE_VERSION}`);
  }
  if (!pkg.workflow || typeof pkg.workflow !== "object" || Array.isArray(pkg.workflow)) {
    errors.push(`${fileName}: workflow must be an object`);
  }
  if (!pkg.dependencies || typeof pkg.dependencies !== "object" || Array.isArray(pkg.dependencies)) {
    errors.push(`${fileName}: dependencies must be an object`);
  } else {
    if (!Array.isArray(pkg.dependencies.templates)) {
      errors.push(`${fileName}: dependencies.templates must be an array`);
    }
    if (!Array.isArray(pkg.dependencies.customNodes)) {
      errors.push(`${fileName}: dependencies.customNodes must be an array`);
    }
  }
  if (errors.length) {
    return errors;
  }
  if (typeof pkg.workflow.name !== "string") {
    errors.push(`${fileName}: workflow.name must be a string`);
  }
  if (typeof pkg.workflow.description !== "string") {
    errors.push(`${fileName}: workflow.description must be a string`);
  }
  errors.push(...validateWorkflow(pkg.workflow.graphData, fileName));
  return errors;
}

const files = walkJsonFiles(WORKFLOW_ROOT);
const allErrors = [];

for (const file of files) {
  const relative = path.relative(ROOT, file);
  try {
    const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
    allErrors.push(...validateWorkflowPackage(pkg, relative));
  } catch (error) {
    allErrors.push(`${relative}: ${error.message}`);
  }
}

if (!files.length) {
  allErrors.push("No workflow JSON files found under workflows/");
}

if (allErrors.length) {
  console.error(allErrors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${files.length} workflow JSON files.`);
