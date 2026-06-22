import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const WORKFLOW_ROOT = path.join(ROOT, "workflows");
const TOPOLOGY_ROOT = path.join(ROOT, "topologies");

const WORKFLOW_PACKAGE_KIND = "octastack.workflow.package";
const WORKFLOW_PACKAGE_VERSION = 1;
const EXPORTED_AT = "2026-06-19T00:00:00Z";
const PROFILE_ID = "replace-with-proxmox-profile-id";
const TEMPLATE_ID = "9000";
const LAYOUT = {
  trigger: { x: 45, y: 75 },
  context: { x: 105, y: 465 },
  branchGapX: 705,
  branchStartX: 0,
  provisionBranchStartX: 855,
  commandInsetX: 180,
  singleProvisioned: {
    provision: { x: 855, y: 405 },
    wait: { x: 1545, y: 2985 },
    install: { x: 855, y: 4290 },
    health: { x: 1035, y: 5475 },
    end: { x: 1085, y: 5880 }
  },
  singleExisting: {
    server: { x: 0, y: 885 },
    wait: { x: 885, y: 885 },
    install: { x: 180, y: 2300 },
    health: { x: 180, y: 3600 },
    end: { x: 230, y: 4005 }
  },
  haProvisioned: {
    provisionY: 405,
    waitY: 3600,
    bootstrapY: 5000,
    healthY: 6200,
    endY: 6605
  },
  haExisting: {
    server: { x: 0, y: 885 },
    wait: { x: 0, y: 2300 },
    bootstrap: { x: 180, y: 3600 },
    health: { x: 180, y: 6200 },
    end: { x: 230, y: 6605 }
  },
  footprints: {
    triggerNode: { width: 520, height: 380 },
    proxmoxConfigNode: { width: 320, height: 260 },
    provisionNode: { width: 640, height: 3000 },
    waitUntilUpNode: { width: 420, height: 700 },
    serverNode: { width: 680, height: 1250 },
    customNode: { width: 640, height: 900 },
    configCommandNode: { width: 320, height: 300 },
    endNode: { width: 220, height: 200 },
    default: { width: 420, height: 320 }
  }
};

const ROOT_NETWORK_CIDR = "10.0.0.0/16";
const CATEGORY_IP_BLOCKS = [
  { category: "databases", cidr: "10.0.0.0/18", firstThirdOctet: 0, stackCapacity: 64 },
  { category: "cache", cidr: "10.0.64.0/20", firstThirdOctet: 64, stackCapacity: 16 },
  { category: "messaging", cidr: "10.0.80.0/20", firstThirdOctet: 80, stackCapacity: 16 },
  { category: "kubernetes", cidr: "10.0.96.0/20", firstThirdOctet: 96, stackCapacity: 16 },
  { category: "monitoring", cidr: "10.0.112.0/20", firstThirdOctet: 112, stackCapacity: 16 },
  { category: "search", cidr: "10.0.128.0/20", firstThirdOctet: 128, stackCapacity: 16 },
  { category: "storage", cidr: "10.0.144.0/20", firstThirdOctet: 144, stackCapacity: 16 },
  { category: "coordination", cidr: "10.0.160.0/20", firstThirdOctet: 160, stackCapacity: 16 },
  { category: "networking", cidr: "10.0.176.0/20", firstThirdOctet: 176, stackCapacity: 16 },
  { category: "observability", cidr: "10.0.192.0/20", firstThirdOctet: 192, stackCapacity: 16 },
  { category: "devops", cidr: "10.0.208.0/20", firstThirdOctet: 208, stackCapacity: 16 },
  { category: "identity", cidr: "10.0.224.0/22", firstThirdOctet: 224, stackCapacity: 4 },
  { category: "security", cidr: "10.0.228.0/22", firstThirdOctet: 228, stackCapacity: 4 },
  { category: "vector", cidr: "10.0.232.0/21", firstThirdOctet: 232, stackCapacity: 8 },
  { category: "web", cidr: "10.0.240.0/21", firstThirdOctet: 240, stackCapacity: 8 }
];

function text(value) {
  return value.trim().replace(/\n{3,}/g, "\n\n") + "\n";
}

function variable(id, key, source, value) {
  return { id, key, source, value };
}

function triggerData(label, variables = []) {
  return {
    label,
    triggerType: "manual",
    enabled: true,
    variables,
    webhookPath: "",
    secretRef: "",
    cronExpr: "",
    timezone: "UTC"
  };
}

function serverTarget(id, label, host) {
  return {
    id,
    source: "manual",
    host,
    label,
    ip: host,
    name: label.toLowerCase().replaceAll(" ", "-"),
    node: "",
    vmid: "",
    status: "existing",
    type: "manual"
  };
}

function serverData(label, host) {
  return {
    label,
    hostname: host,
    targets: [serverTarget("target-0", label, host)]
  };
}

function provisionData(target, stack) {
  const diskSize = target.diskGb ?? stack.defaultDiskGb ?? "40";
  const prefix = target.prefix ?? 24;
  return {
    label: `Provision ${target.label}`,
    node: target.proxmoxNode ?? "pve1",
    templateId: target.templateId ?? TEMPLATE_ID,
    instanceName: target.vmName,
    vmId: "",
    autoVmid: true,
    environment: stack.environment ?? "PROD",
    serverType: target.role.toUpperCase(),
    cores: String(target.cores ?? stack.defaultCores ?? 2),
    memory: String(target.memory ?? stack.defaultMemory ?? 4096),
    machine: "q35",
    ostype: "l26",
    bios: "seabios",
    onboot: true,
    agent: true,
    targetStorage: "local-lvm",
    cloudInitStorage: "local-lvm",
    cicustom: "",
    disks: [
      {
        id: "disk-0",
        slot: "scsi1",
        bus: "scsi",
        storage: "local-lvm",
        sizeGb: String(diskSize),
        cache: "",
        iothread: true,
        discard: true,
        ssd: true,
        backup: true
      }
    ],
    networks: [
      {
        id: "net-0",
        slot: "net0",
        model: "virtio",
        bridge: "vmbr0",
        vlanTag: stack.vlanTag ?? "",
        firewall: true,
        rateLimitMbps: "",
        macAddress: "",
        queues: "",
        ipAddress: `${target.ip}/${prefix}`,
        gw: stack.gateway,
        dns1: "1.1.1.1",
        dns2: "8.8.8.8",
        domain: stack.domain
      }
    ],
    ipAddress: `${target.ip}/${prefix}`,
    gw: stack.gateway,
    dns1: "1.1.1.1",
    dns2: "8.8.8.8",
    domain: stack.domain
  };
}

function waitData(label, probeLabel = "SSH reachability") {
  return {
    label,
    timeout: "20",
    interval: "10",
    probes: [
      {
        id: "probe-0",
        type: "ssh",
        host: "",
        port: "22",
        label: probeLabel
      }
    ]
  };
}

function node(id, type, x, y, data) {
  return { id, type, position: { x, y }, data };
}

function commandData(label, command, sudo = true) {
  return {
    label,
    command: text(command),
    sudo
  };
}

function appendCommandSteps(nodes, edges, fromId, steps, options) {
  const gap = options.gap ?? 405;
  let previousId = fromId;
  let firstId = "";
  for (const [index, step] of steps.entries()) {
    const id = `${options.idPrefix}_${index + 1}`;
    const x = step.x ?? options.x;
    const y = step.y ?? options.y + index * gap;
    nodes.push(node(id, "configCommandNode", x, y, commandData(step.label, step.command, step.sudo ?? true)));
    if (!firstId) {
      firstId = id;
    }
    if (previousId) {
      edges.push(edge(`${options.edgePrefix}_${index + 1}`, previousId, id));
    }
    previousId = id;
  }
  return {
    firstId,
    lastId: previousId,
    nextY: options.y + steps.length * gap
  };
}

function edge(id, source, target, options = {}) {
  const mode = options.mode ?? "sequential";
  const out = {
    id,
    source,
    target,
    type: "workflowEdge",
    mode,
    order: options.order ?? 1,
    data: {
      mode,
      order: options.order ?? 1
    }
  };
  if (options.sourceHandle) {
    out.sourceHandle = options.sourceHandle;
  }
  return out;
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function inventory(nodes) {
  return nodes.map((target) => `${target.ip} role=${target.role} name=${target.label}`).join("\n");
}

function branchX(index, startX = LAYOUT.branchStartX) {
  return startX + index * LAYOUT.branchGapX;
}

function branchCenterX(count, startX = LAYOUT.branchStartX) {
  return Math.round(startX + ((count - 1) * LAYOUT.branchGapX) / 2);
}

function stackHaVariants(stack) {
  return stack.haVariants ?? (stack.ha ? [stack.ha] : []);
}

function topLevelCategory(category) {
  return category.split("/")[0];
}

function categoryIpBlock(category) {
  const topLevel = topLevelCategory(category);
  const block = CATEGORY_IP_BLOCKS.find((entry) => entry.category === topLevel);
  if (!block) {
    throw new Error(`Missing IP block for category ${topLevel}`);
  }
  return block;
}

function replaceIpReferences(value, replacements) {
  let result = value;
  for (const [oldIp, newIp] of replacements.entries()) {
    result = result.replaceAll(oldIp, newIp);
  }
  return result;
}

function replaceOwnStringProperties(target, replacements) {
  for (const key of Object.keys(target)) {
    const descriptor = Object.getOwnPropertyDescriptor(target, key);
    if (descriptor?.value && typeof descriptor.value === "string") {
      target[key] = replaceIpReferences(descriptor.value, replacements);
    }
  }
}

function applyNetworkPlan(stacksToPlan) {
  const categoryUsage = new Map();
  for (const stack of stacksToPlan) {
    const block = categoryIpBlock(stack.category);
    const used = categoryUsage.get(block.category) ?? 0;
    if (used >= block.stackCapacity) {
      throw new Error(`${block.category} exceeds ${block.cidr} stack capacity`);
    }
    categoryUsage.set(block.category, used + 1);

    const thirdOctet = block.firstThirdOctet + used;
    const gateway = `10.0.${thirdOctet}.1`;
    const stackCidr = `10.0.${thirdOctet}.0/24`;
    const replacements = new Map();
    const replaceIp = (oldIp, newIp) => {
      if (oldIp && oldIp !== newIp) {
        replacements.set(oldIp, newIp);
      }
      return newIp;
    };

    stack.gateway = replaceIp(stack.gateway, gateway);
    stack.network = {
      rootCidr: ROOT_NETWORK_CIDR,
      category: block.category,
      categoryCidr: block.cidr,
      stackCidr,
      gateway
    };

    stack.single.target.ip = replaceIp(stack.single.target.ip, `10.0.${thirdOctet}.50`);
    stack.single.target.prefix = 24;
    stack.single.existingHost = replaceIp(stack.single.existingHost, stack.single.target.ip);

    for (const ha of stackHaVariants(stack)) {
      const roleOffsets = new Map();
      const roleCounts = new Map();
      for (const target of ha.nodes) {
        if (!roleOffsets.has(target.role)) {
          roleOffsets.set(target.role, 10 + roleOffsets.size * 10);
        }
        const count = (roleCounts.get(target.role) ?? 0) + 1;
        roleCounts.set(target.role, count);
        target.ip = replaceIp(target.ip, `10.0.${thirdOctet}.${roleOffsets.get(target.role) + count}`);
        target.prefix = 24;
      }
    }

    replaceOwnStringProperties(stack, replacements);
    replaceOwnStringProperties(stack.single, replacements);
    replaceOwnStringProperties(stack.single.target, replacements);
    for (const ha of stackHaVariants(stack)) {
      replaceOwnStringProperties(ha, replacements);
      for (const target of ha.nodes) {
        replaceOwnStringProperties(target, replacements);
      }
    }
  }
}

function nodeDetectionScript(title, nodes) {
  const expectedIps = nodes.map((target) => target.ip).join(" ");
  const cases = nodes
    .map((target, index) => `  ${target.ip}) NODE_NAME='${shellQuote(target.label)}'; NODE_ROLE='${shellQuote(target.role)}'; NODE_INDEX=${index + 1} ;;`)
    .join("\n");
  return `
log() { printf '[${title}] %s\\n' "$*"; }
detect_current_ip() {
  for candidate in $(hostname -I 2>/dev/null); do
    case " ${expectedIps} " in
      *" $candidate "*) printf '%s' "$candidate"; return 0 ;;
    esac
  done
  ip -o -4 addr show scope global 2>/dev/null | awk '{split($4,a,"/"); print a[1]; exit}'
}
CURRENT_IP="\${OCTASTACK_NODE_IP:-$(detect_current_ip)}"
NODE_NAME="$(hostname -s)"
NODE_ROLE="unknown"
NODE_INDEX=0
case "$CURRENT_IP" in
${cases}
esac
if [ "$NODE_ROLE" = "unknown" ]; then
  log "unable to match current host IP ($CURRENT_IP) to the generated topology"
  exit 1
fi
log "running on $NODE_NAME ($CURRENT_IP, role=$NODE_ROLE)"
`;
}

function waitForTcpScript() {
  return `
wait_for_tcp() {
  host="$1"
  port="$2"
  timeout="\${3:-180}"
  start="$(date +%s)"
  while ! timeout 2 bash -c "cat < /dev/null > /dev/tcp/$host/$port" >/dev/null 2>&1; do
    now="$(date +%s)"
    if [ "$((now - start))" -ge "$timeout" ]; then
      log "timeout waiting for $host:$port"
      return 1
    fi
    sleep 5
  done
}
`;
}

function createSingleProvisionedWorkflow(stack) {
  const target = stack.single.target;
  const nodes = [
    node("node_trigger", "triggerNode", LAYOUT.trigger.x, LAYOUT.trigger.y, triggerData(`${stack.displayName} single-node provisioned`, stack.variables)),
    node("node_context", "proxmoxConfigNode", LAYOUT.context.x, LAYOUT.context.y, {
      label: "Cluster Context",
      profileId: PROFILE_ID
    }),
    node("node_provision", "provisionNode", LAYOUT.singleProvisioned.provision.x, LAYOUT.singleProvisioned.provision.y, provisionData(target, stack)),
    node("node_wait", "waitUntilUpNode", LAYOUT.singleProvisioned.wait.x, LAYOUT.singleProvisioned.wait.y, waitData("Wait for provisioned host"))
  ];
  const edges = [
    edge("edge_trigger_context", "node_trigger", "node_context"),
    edge("edge_context_provision", "node_context", "node_provision"),
    edge("edge_provision_wait", "node_provision", "node_wait")
  ];
  let previousId = "node_wait";
  let healthY = LAYOUT.singleProvisioned.health.y;
  let endY = LAYOUT.singleProvisioned.end.y;

  if (stack.single.steps?.length) {
    const stepResult = appendCommandSteps(nodes, edges, "node_wait", stack.single.steps, {
      idPrefix: "node_step",
      edgePrefix: "edge_step",
      x: LAYOUT.singleProvisioned.install.x + LAYOUT.commandInsetX,
      y: LAYOUT.singleProvisioned.install.y
    });
    previousId = stepResult.lastId;
    healthY = Math.max(healthY, stepResult.nextY);
    endY = healthY + 405;
  } else {
    nodes.push(node("node_install", "customNode", LAYOUT.singleProvisioned.install.x, LAYOUT.singleProvisioned.install.y, {
      label: `Install ${stack.displayName}`,
      customNodeId: "",
      scriptType: "shell",
      scriptContent: stack.single.install,
      sudo: true,
      method: "GET",
      path: "",
      body: "{}"
    }));
    edges.push(edge("edge_wait_install", "node_wait", "node_install"));
    previousId = "node_install";
  }

  nodes.push(node("node_health", "configCommandNode", LAYOUT.singleProvisioned.health.x, healthY, {
    label: `${stack.displayName} health check`,
    command: stack.single.health,
    sudo: false
  }));
  nodes.push(node("node_end", "endNode", LAYOUT.singleProvisioned.end.x, endY, { label: "End" }));
  edges.push(edge("edge_install_health", previousId, "node_health"));
  edges.push(edge("edge_health_end", "node_health", "node_end"));
  return { nodes, edges };
}

function createSingleExistingWorkflow(stack) {
  const target = stack.single.target;
  const nodes = [
    node("node_trigger", "triggerNode", LAYOUT.trigger.x, LAYOUT.trigger.y, triggerData(`${stack.displayName} single-node existing`, stack.variables)),
    node("node_server", "serverNode", LAYOUT.singleExisting.server.x, LAYOUT.singleExisting.server.y, serverData(`${stack.displayName} Host`, stack.single.existingHost ?? target.ip)),
    node("node_wait", "waitUntilUpNode", LAYOUT.singleExisting.wait.x, LAYOUT.singleExisting.wait.y, waitData("Wait for existing host"))
  ];
  const edges = [
    edge("edge_trigger_server", "node_trigger", "node_server"),
    edge("edge_server_wait", "node_server", "node_wait")
  ];
  let previousId = "node_wait";
  let healthY = LAYOUT.singleExisting.health.y;
  let endY = LAYOUT.singleExisting.end.y;

  if (stack.single.steps?.length) {
    const stepResult = appendCommandSteps(nodes, edges, "node_wait", stack.single.steps, {
      idPrefix: "node_step",
      edgePrefix: "edge_step",
      x: LAYOUT.singleExisting.install.x,
      y: LAYOUT.singleExisting.install.y
    });
    previousId = stepResult.lastId;
    healthY = Math.max(healthY, stepResult.nextY);
    endY = healthY + 405;
  } else {
    nodes.push(node("node_install", "customNode", LAYOUT.singleExisting.install.x, LAYOUT.singleExisting.install.y, {
      label: `Install ${stack.displayName}`,
      customNodeId: "",
      scriptType: "shell",
      scriptContent: stack.single.install,
      sudo: true,
      method: "GET",
      path: "",
      body: "{}"
    }));
    edges.push(edge("edge_wait_install", "node_wait", "node_install"));
    previousId = "node_install";
  }

  nodes.push(node("node_health", "configCommandNode", LAYOUT.singleExisting.health.x, healthY, {
    label: `${stack.displayName} health check`,
    command: stack.single.health,
    sudo: false
  }));
  nodes.push(node("node_end", "endNode", LAYOUT.singleExisting.end.x, endY, { label: "End" }));
  edges.push(edge("edge_install_health", previousId, "node_health"));
  edges.push(edge("edge_health_end", "node_health", "node_end"));
  return { nodes, edges };
}

function createHaProvisionedWorkflow(stack, ha) {
  const nodes = [
    node("node_trigger", "triggerNode", LAYOUT.trigger.x, LAYOUT.trigger.y, triggerData(`${ha.title} provisioned`, stack.variables)),
    node("node_context", "proxmoxConfigNode", LAYOUT.context.x, LAYOUT.context.y, {
      label: "Cluster Context",
      profileId: PROFILE_ID
    })
  ];
  const edges = [edge("edge_trigger_context", "node_trigger", "node_context")];
  ha.nodes.forEach((target, index) => {
    const x = branchX(index, LAYOUT.provisionBranchStartX);
    const provisionId = `node_provision_${slug(target.label)}`;
    const waitId = `node_wait_${slug(target.label)}`;
    nodes.push(node(provisionId, "provisionNode", x, LAYOUT.haProvisioned.provisionY, provisionData(target, stack)));
    nodes.push(node(waitId, "waitUntilUpNode", x, LAYOUT.haProvisioned.waitY, waitData(`Wait ${target.label}`)));
    edges.push(edge(`edge_context_${slug(target.label)}`, "node_context", provisionId, {
      mode: "parallel",
      order: index + 1
    }));
    edges.push(edge(`edge_${slug(target.label)}_wait`, provisionId, waitId));
  });
  const centerX = branchCenterX(ha.nodes.length, LAYOUT.provisionBranchStartX);
  let previousId = "node_bootstrap";
  let firstBootstrapId = "node_bootstrap";
  let healthY = LAYOUT.haProvisioned.healthY;
  let endY = LAYOUT.haProvisioned.endY;

  if (ha.steps?.length) {
    const stepResult = appendCommandSteps(nodes, edges, "", ha.steps, {
      idPrefix: "node_step",
      edgePrefix: "edge_step",
      x: centerX + LAYOUT.commandInsetX,
      y: LAYOUT.haProvisioned.bootstrapY
    });
    firstBootstrapId = stepResult.firstId;
    previousId = stepResult.lastId;
    healthY = Math.max(healthY, stepResult.nextY);
    endY = healthY + 405;
  } else {
    nodes.push(node("node_bootstrap", "customNode", centerX, LAYOUT.haProvisioned.bootstrapY, {
      label: `Bootstrap ${ha.title}`,
      customNodeId: "",
      scriptType: "shell",
      scriptContent: ha.install,
      sudo: true,
      method: "GET",
      path: "",
      body: "{}"
    }));
  }

  for (const target of ha.nodes) {
    edges.push(edge(`edge_${slug(target.label)}_bootstrap`, `node_wait_${slug(target.label)}`, firstBootstrapId));
  }
  nodes.push(node("node_health", "configCommandNode", centerX + LAYOUT.commandInsetX, healthY, {
    label: `${ha.title} health check`,
    command: ha.health,
    sudo: false
  }));
  nodes.push(node("node_end", "endNode", centerX + LAYOUT.commandInsetX + 50, endY, { label: "End" }));
  edges.push(edge("edge_bootstrap_health", previousId, "node_health"));
  edges.push(edge("edge_health_end", "node_health", "node_end"));
  return { nodes, edges };
}

function createHaExistingWorkflow(stack, ha) {
  const nodes = [
    node("node_trigger", "triggerNode", LAYOUT.trigger.x, LAYOUT.trigger.y, triggerData(`${ha.title} existing`, stack.variables))
  ];
  const edges = [];
  ha.nodes.forEach((target, index) => {
    const x = branchX(index);
    const serverId = `node_server_${slug(target.label)}`;
    const waitId = `node_wait_${slug(target.label)}`;
    nodes.push(node(serverId, "serverNode", x, LAYOUT.haExisting.server.y, serverData(target.label, target.ip)));
    nodes.push(node(waitId, "waitUntilUpNode", x, LAYOUT.haExisting.wait.y, waitData(`Wait ${target.label}`)));
    edges.push(edge(`edge_trigger_${slug(target.label)}`, "node_trigger", serverId, {
      mode: "parallel",
      order: index + 1
    }));
    edges.push(edge(`edge_${slug(target.label)}_wait`, serverId, waitId));
  });
  const centerX = branchCenterX(ha.nodes.length);
  let previousId = "node_bootstrap";
  let firstBootstrapId = "node_bootstrap";
  let healthY = LAYOUT.haExisting.health.y;
  let endY = LAYOUT.haExisting.end.y;

  if (ha.steps?.length) {
    const stepResult = appendCommandSteps(nodes, edges, "", ha.steps, {
      idPrefix: "node_step",
      edgePrefix: "edge_step",
      x: centerX + LAYOUT.commandInsetX,
      y: LAYOUT.haExisting.bootstrap.y
    });
    firstBootstrapId = stepResult.firstId;
    previousId = stepResult.lastId;
    healthY = Math.max(healthY, stepResult.nextY);
    endY = healthY + 405;
  } else {
    nodes.push(node("node_bootstrap", "customNode", centerX, LAYOUT.haExisting.bootstrap.y, {
      label: `Bootstrap ${ha.title}`,
      customNodeId: "",
      scriptType: "shell",
      scriptContent: ha.install,
      sudo: true,
      method: "GET",
      path: "",
      body: "{}"
    }));
  }
  for (const target of ha.nodes) {
    edges.push(edge(`edge_${slug(target.label)}_bootstrap`, `node_wait_${slug(target.label)}`, firstBootstrapId));
  }

  nodes.push(node("node_health", "configCommandNode", centerX + LAYOUT.commandInsetX, healthY, {
    label: `${ha.title} health check`,
    command: ha.health,
    sudo: false
  }));
  nodes.push(node("node_end", "endNode", centerX + LAYOUT.commandInsetX + 50, endY, { label: "End" }));
  edges.push(edge("edge_bootstrap_health", previousId, "node_health"));
  edges.push(edge("edge_health_end", "node_health", "node_end"));
  return { nodes, edges };
}

function hasNumericPosition(node) {
  return Number.isFinite(node?.position?.x) && Number.isFinite(node?.position?.y);
}

function nodeFootprint(node) {
  return LAYOUT.footprints[node.type] ?? LAYOUT.footprints.default;
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

function pgSingleInstall() {
  return text(`
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
sudo sed -i "s/^#listen_addresses.*/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf
sudo tee -a /etc/postgresql/*/main/pg_hba.conf >/dev/null <<'EOF'
host all all 10.0.0.0/16 scram-sha-256
EOF
sudo systemctl enable --now postgresql
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='app_user'" | grep -q 1 || sudo -u postgres psql -c "CREATE ROLE app_user LOGIN PASSWORD 'change-me';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='app_db'" | grep -q 1 || sudo -u postgres createdb app_db -O app_user
`);
}

function pgHaInstall(nodes) {
  const etcdHosts = nodes.filter((n) => n.role === "etcd");
  const postgresHosts = nodes.filter((n) => n.role === "postgres");
  const loadBalancers = nodes.filter((n) => n.role === "load_balancer");
  const etcdEndpoints = etcdHosts.map((n) => `${n.ip}:2379`).join(",");
  const haproxyServers = postgresHosts.map((n) => `  server ${n.label} ${n.ip}:5432 check port 8008`).join("\n");
  return text(`
set -euo pipefail
${nodeDetectionScript("postgresql-ha", nodes)}
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y curl jq chrony
systemctl enable --now chrony

if [ "$NODE_ROLE" = "etcd" ]; then
  log "configuring etcd member"
  DEBIAN_FRONTEND=noninteractive apt-get install -y etcd
  cat >/etc/default/etcd <<EOF
ETCD_NAME="$NODE_NAME"
ETCD_LISTEN_CLIENT_URLS="http://0.0.0.0:2379"
ETCD_ADVERTISE_CLIENT_URLS="http://$CURRENT_IP:2379"
EOF
  systemctl restart etcd
  systemctl enable etcd
elif [ "$NODE_ROLE" = "postgres" ]; then
  log "configuring Patroni PostgreSQL member"
  DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib python3-pip patroni
  cat >/etc/patroni.yml <<EOF
scope: octastack-postgres
namespace: /service/
name: "$NODE_NAME"
restapi:
  listen: 0.0.0.0:8008
  connect_address: "$CURRENT_IP:8008"
etcd3:
  hosts: ${etcdEndpoints}
bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 1048576
    postgresql:
      use_pg_rewind: true
  initdb:
    - encoding: UTF8
    - data-checksums
postgresql:
  listen: 0.0.0.0:5432
  connect_address: "$CURRENT_IP:5432"
  data_dir: /var/lib/postgresql/patroni
  authentication:
    superuser:
      username: postgres
      password: change-me
    replication:
      username: replicator
      password: change-me
EOF
  systemctl restart patroni
  systemctl enable patroni
elif [ "$NODE_ROLE" = "load_balancer" ]; then
  log "configuring HAProxy PostgreSQL frontend"
  DEBIAN_FRONTEND=noninteractive apt-get install -y haproxy keepalived
  cat >/etc/haproxy/haproxy.cfg <<'EOF'
global
  daemon
  maxconn 4096
defaults
  mode tcp
  timeout connect 5s
  timeout client 30s
  timeout server 30s
listen postgres_rw
  bind *:5432
  option httpchk GET /primary
${haproxyServers}
EOF
  systemctl restart haproxy
  systemctl enable haproxy
else
  log "no PostgreSQL HA action for role $NODE_ROLE"
fi
`);
}

function redisSingleInstall() {
  return text(`
set -euo pipefail
sudo apt-get update
sudo apt-get install -y redis-server
sudo sed -i "s/^bind .*/bind 0.0.0.0 ::1/" /etc/redis/redis.conf
sudo sed -i "s/^supervised .*/supervised systemd/" /etc/redis/redis.conf
sudo systemctl enable --now redis-server
`);
}

function redisHaInstall(nodes) {
  const redisHosts = nodes.filter((n) => n.role === "redis");
  const primary = redisHosts[0];
  return text(`
set -euo pipefail
${nodeDetectionScript("redis-ha", redisHosts)}
${waitForTcpScript()}
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y redis-server
cat >/etc/redis/redis.conf <<EOF
bind 0.0.0.0
protected-mode no
port 6379
appendonly yes
dir /var/lib/redis
EOF
if [ "$CURRENT_IP" != "${primary.ip}" ]; then
  log "waiting for primary ${primary.ip}:6379"
  wait_for_tcp "${primary.ip}" 6379 180
  echo "replicaof ${primary.ip} 6379" >>/etc/redis/redis.conf
fi
cat >/etc/redis/sentinel.conf <<EOF
port 26379
sentinel monitor redis-ha ${primary.ip} 6379 2
sentinel down-after-milliseconds redis-ha 5000
sentinel failover-timeout redis-ha 60000
sentinel parallel-syncs redis-ha 1
EOF
systemctl restart redis-server
systemctl enable redis-server
pkill -f 'redis-server .*sentinel.conf' || true
install -d -m 0755 /var/log/redis
nohup redis-server /etc/redis/sentinel.conf --sentinel >/var/log/redis/sentinel.log 2>&1 &
log "redis and sentinel started"
`);
}

function redisClusterInstall(nodes) {
  const redisHosts = nodes.filter((n) => n.role === "redis");
  return text(`
set -euo pipefail
${nodeDetectionScript("redis-cluster-ha", redisHosts)}
${waitForTcpScript()}
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y redis-server
cat >/etc/redis/redis.conf <<EOF
bind 0.0.0.0
protected-mode no
port 6379
appendonly yes
dir /var/lib/redis
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
cluster-announce-ip $CURRENT_IP
EOF
systemctl restart redis-server
systemctl enable redis-server
if [ "$NODE_INDEX" = "1" ]; then
  for peer in ${redisHosts.map((node) => node.ip).join(" ")}; do
    wait_for_tcp "$peer" 6379 240
  done
  yes yes | redis-cli --cluster create ${redisHosts.map((node) => `${node.ip}:6379`).join(" ")} --cluster-replicas 1 || true
  redis-cli cluster nodes
fi
`);
}

function kafkaSingleInstall() {
  return text(`
set -euo pipefail
sudo apt-get update
sudo apt-get install -y openjdk-17-jre-headless curl tar
sudo useradd -r -m -U -d /opt/kafka kafka || true
curl -fsSL https://archive.apache.org/dist/kafka/3.7.0/kafka_2.13-3.7.0.tgz -o /tmp/kafka.tgz
sudo tar -xzf /tmp/kafka.tgz --strip-components=1 -C /opt/kafka
sudo chown -R kafka:kafka /opt/kafka
KAFKA_CLUSTER_ID="$(sudo -u kafka /opt/kafka/bin/kafka-storage.sh random-uuid)"
sudo -u kafka /opt/kafka/bin/kafka-storage.sh format -t "$KAFKA_CLUSTER_ID" -c /opt/kafka/config/kraft/server.properties --ignore-formatted
sudo tee /etc/systemd/system/kafka.service >/dev/null <<'EOF'
[Unit]
Description=Apache Kafka KRaft
After=network-online.target
[Service]
User=kafka
ExecStart=/opt/kafka/bin/kafka-server-start.sh /opt/kafka/config/kraft/server.properties
Restart=always
[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable --now kafka
`);
}

function kafkaHaInstall(nodes) {
  const brokers = nodes.filter((n) => n.role === "broker");
  const controllers = brokers.map((n, i) => `${i + 1}@${n.ip}:9093`).join(",");
  return text(`
set -euo pipefail
${nodeDetectionScript("kafka-ha", brokers)}
KAFKA_VERSION="3.7.0"
KAFKA_CLUSTER_ID="MkU3OEVBNTcwNTJENDM2Qk"
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y openjdk-17-jre-headless curl tar
useradd -r -m -U -d /opt/kafka kafka || true
curl -fsSL "https://archive.apache.org/dist/kafka/$KAFKA_VERSION/kafka_2.13-$KAFKA_VERSION.tgz" -o /tmp/kafka.tgz
tar -xzf /tmp/kafka.tgz --strip-components=1 -C /opt/kafka
chown -R kafka:kafka /opt/kafka
install -d -o kafka -g kafka -m 0750 /var/lib/kafka
cat >/opt/kafka/config/kraft/server.properties <<EOF
process.roles=broker,controller
node.id=$NODE_INDEX
controller.quorum.voters=${controllers}
listeners=PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
advertised.listeners=PLAINTEXT://$CURRENT_IP:9092
controller.listener.names=CONTROLLER
listener.security.protocol.map=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
log.dirs=/var/lib/kafka
offsets.topic.replication.factor=3
transaction.state.log.replication.factor=3
transaction.state.log.min.isr=2
min.insync.replicas=2
EOF
chown kafka:kafka /opt/kafka/config/kraft/server.properties
sudo -u kafka /opt/kafka/bin/kafka-storage.sh format -t "$KAFKA_CLUSTER_ID" -c /opt/kafka/config/kraft/server.properties --ignore-formatted
cat >/etc/systemd/system/kafka.service <<'EOF'
[Unit]
Description=Apache Kafka KRaft
After=network-online.target
[Service]
User=kafka
ExecStart=/opt/kafka/bin/kafka-server-start.sh /opt/kafka/config/kraft/server.properties
Restart=always
[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl restart kafka
systemctl enable kafka
log "kafka broker/controller started"
`);
}

function rabbitSingleInstall() {
  return text(`
set -euo pipefail
sudo apt-get update
sudo apt-get install -y rabbitmq-server
sudo systemctl enable --now rabbitmq-server
sudo rabbitmq-plugins enable rabbitmq_management
sudo rabbitmqctl add_user app_user change-me || true
sudo rabbitmqctl set_permissions -p / app_user ".*" ".*" ".*"
`);
}

function rabbitHaInstall(nodes) {
  const members = nodes.filter((n) => n.role === "rabbitmq");
  const primary = members[0];
  return text(`
set -euo pipefail
${nodeDetectionScript("rabbitmq-ha", members)}
${waitForTcpScript()}
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y rabbitmq-server
printf '%s' 'OCTASTACKRABBITMQCOOKIE' >/var/lib/rabbitmq/.erlang.cookie
chown rabbitmq:rabbitmq /var/lib/rabbitmq/.erlang.cookie
chmod 0400 /var/lib/rabbitmq/.erlang.cookie
systemctl restart rabbitmq-server
systemctl enable rabbitmq-server
rabbitmq-plugins enable rabbitmq_management
if [ "$CURRENT_IP" != "${primary.ip}" ]; then
  log "waiting for primary RabbitMQ ${primary.ip}:5672"
  wait_for_tcp "${primary.ip}" 5672 180
  rabbitmqctl stop_app
  rabbitmqctl reset
  rabbitmqctl join_cluster rabbit@${primary.ip}
  rabbitmqctl start_app
else
  rabbitmqctl set_policy ha-quorum "^ha\\." '{"queue-type":"quorum"}' --apply-to queues
  rabbitmqctl add_user app_user change-me || true
  rabbitmqctl set_permissions -p / app_user ".*" ".*" ".*"
fi
log "rabbitmq member configured"
`);
}

function vanillaSingleInstall() {
  return text(`
set -euo pipefail
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl gpg
sudo swapoff -a
sudo modprobe br_netfilter
sudo sysctl -w net.bridge.bridge-nf-call-iptables=1
sudo apt-get install -y containerd
sudo systemctl enable --now containerd
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.30/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.30/deb/ /" | sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo kubeadm init --pod-network-cidr=192.168.0.0/16
mkdir -p "$HOME/.kube"
sudo cp /etc/kubernetes/admin.conf "$HOME/.kube/config"
sudo chown "$(id -u):$(id -g)" "$HOME/.kube/config"
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.27.3/manifests/calico.yaml
`);
}

function vanillaHaInstall(nodes) {
  const controlPlanes = nodes.filter((n) => n.role === "control_plane");
  const workers = nodes.filter((n) => n.role === "worker");
  const primary = controlPlanes[0];
  return text(`
set -euo pipefail
${nodeDetectionScript("vanilla-k8s-ha", [...controlPlanes, ...workers])}
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y apt-transport-https ca-certificates curl gpg containerd
swapoff -a
modprobe br_netfilter
sysctl -w net.bridge.bridge-nf-call-iptables=1
systemctl enable --now containerd
mkdir -p /etc/apt/keyrings
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.30/deb/Release.key | gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.30/deb/ /" >/etc/apt/sources.list.d/kubernetes.list
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y kubelet kubeadm kubectl
if [ "$CURRENT_IP" = "${primary.ip}" ]; then
  log "initializing first control plane"
  kubeadm init --control-plane-endpoint "${primary.ip}:6443" --upload-certs --pod-network-cidr=192.168.0.0/16
  kubectl --kubeconfig /etc/kubernetes/admin.conf apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.27.3/manifests/calico.yaml
elif [ "$NODE_ROLE" = "control_plane" ]; then
  log "join this control plane with the kubeadm join command printed by ${primary.label}"
else
  log "join this worker with the kubeadm join command printed by ${primary.label}"
fi
`);
}

function rke2SingleInstall() {
  return text(`
set -euo pipefail
curl -sfL https://get.rke2.io | sudo INSTALL_RKE2_TYPE=server sh -
sudo systemctl enable --now rke2-server
mkdir -p "$HOME/.kube"
sudo cp /etc/rancher/rke2/rke2.yaml "$HOME/.kube/config"
sudo chown "$(id -u):$(id -g)" "$HOME/.kube/config"
export KUBECONFIG="$HOME/.kube/config"
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
kubectl create namespace cattle-system --dry-run=client -o yaml | kubectl apply -f -
helm repo add jetstack https://charts.jetstack.io
helm repo add rancher-latest https://releases.rancher.com/server-charts/latest
helm repo update
helm upgrade --install cert-manager jetstack/cert-manager --namespace cert-manager --create-namespace --set crds.enabled=true
helm upgrade --install rancher rancher-latest/rancher --namespace cattle-system --set hostname=rancher.example.internal --set bootstrapPassword=change-me
`);
}

function rke2HaInstall(nodes) {
  const servers = nodes.filter((n) => n.role === "rke2_server");
  const agents = nodes.filter((n) => n.role === "rke2_agent");
  const primary = servers[0];
  return text(`
set -euo pipefail
${nodeDetectionScript("rke2-ha", [...servers, ...agents])}
${waitForTcpScript()}
if [ "$CURRENT_IP" = "${primary.ip}" ]; then
  log "installing first RKE2 server"
  curl -sfL https://get.rke2.io | INSTALL_RKE2_TYPE=server sh -
  systemctl enable --now rke2-server
  export KUBECONFIG=/etc/rancher/rke2/rke2.yaml
  curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
  kubectl create namespace cattle-system --dry-run=client -o yaml | kubectl apply -f -
  helm repo add jetstack https://charts.jetstack.io
  helm repo add rancher-latest https://releases.rancher.com/server-charts/latest
  helm repo update
  helm upgrade --install cert-manager jetstack/cert-manager --namespace cert-manager --create-namespace --set crds.enabled=true
  helm upgrade --install rancher rancher-latest/rancher --namespace cattle-system --set hostname=rancher.example.internal --set bootstrapPassword=change-me
elif [ "$NODE_ROLE" = "rke2_server" ]; then
  log "joining RKE2 server to ${primary.ip}"
  wait_for_tcp "${primary.ip}" 9345 300
  mkdir -p /etc/rancher/rke2
  {
    echo "server: https://${primary.ip}:9345"
    echo "token: replace-with-rke2-token"
  } >/etc/rancher/rke2/config.yaml
  curl -sfL https://get.rke2.io | INSTALL_RKE2_TYPE=server sh -
  systemctl enable --now rke2-server
else
  log "joining RKE2 agent to ${primary.ip}"
  wait_for_tcp "${primary.ip}" 9345 300
  mkdir -p /etc/rancher/rke2
  {
    echo "server: https://${primary.ip}:9345"
    echo "token: replace-with-rke2-token"
  } >/etc/rancher/rke2/config.yaml
  curl -sfL https://get.rke2.io | INSTALL_RKE2_TYPE=agent sh -
  systemctl enable --now rke2-agent
fi
`);
}

function monitoringSingleInstall() {
  return text(`
set -euo pipefail
sudo apt-get update
sudo apt-get install -y prometheus prometheus-node-exporter grafana
sudo systemctl enable --now prometheus prometheus-node-exporter grafana-server
sudo tee /etc/prometheus/rules/octastack.rules.yml >/dev/null <<'EOF'
groups:
  - name: octastack-base
    rules:
      - alert: InstanceDown
        expr: up == 0
        for: 2m
        labels:
          severity: critical
EOF
sudo systemctl restart prometheus
`);
}

function monitoringHaInstall(nodes) {
  const prometheus = nodes.filter((n) => n.role === "prometheus");
  const alertmanagers = nodes.filter((n) => n.role === "alertmanager");
  const grafanas = nodes.filter((n) => n.role === "grafana");
  return text(`
set -euo pipefail
${nodeDetectionScript("monitoring-ha", [...prometheus, ...alertmanagers, ...grafanas])}
apt-get update
if [ "$NODE_ROLE" = "prometheus" ]; then
  log "installing Prometheus node"
  DEBIAN_FRONTEND=noninteractive apt-get install -y prometheus prometheus-node-exporter
  systemctl restart prometheus prometheus-node-exporter
  systemctl enable prometheus prometheus-node-exporter
elif [ "$NODE_ROLE" = "alertmanager" ]; then
  log "installing Alertmanager node"
  DEBIAN_FRONTEND=noninteractive apt-get install -y prometheus-alertmanager
  install -d -m 0755 /etc/prometheus
  cat >/etc/prometheus/alertmanager.yml <<'EOF'
global:
  resolve_timeout: 5m
route:
  receiver: default
receivers:
  - name: default
EOF
  systemctl restart prometheus-alertmanager
  systemctl enable prometheus-alertmanager
elif [ "$NODE_ROLE" = "grafana" ]; then
  log "installing Grafana node"
  DEBIAN_FRONTEND=noninteractive apt-get install -y grafana
  systemctl restart grafana-server
  systemctl enable grafana-server
else
  log "no monitoring action for role $NODE_ROLE"
fi
`);
}

function shellQuote(value) {
  return String(value).replaceAll("'", "'\"'\"'");
}

function legacyScriptSteps(displayName, script) {
  const serviceSlug = slug(displayName);
  const scriptPath = `/opt/octastack/${serviceSlug}/install.sh`;
  return [
    {
      label: `Render ${displayName} installer`,
      command: `
set -euo pipefail
install -d -m 0750 /opt/octastack/${serviceSlug}
cat >${scriptPath} <<'OCTASTACK_INSTALLER'
${text(script)}
OCTASTACK_INSTALLER
chmod 0750 ${scriptPath}
`
    },
    {
      label: `Review ${displayName} installer`,
      command: `
set -euo pipefail
bash -n ${scriptPath}
wc -l ${scriptPath}
sed -n '1,120p' ${scriptPath}
`
    },
    {
      label: `Execute ${displayName} installer`,
      command: `
set -euo pipefail
${scriptPath}
`
    },
    {
      label: `Collect ${displayName} runtime status`,
      command: `
set -euo pipefail
systemctl --failed --no-pager || true
if command -v docker >/dev/null 2>&1; then docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}' || true; fi
if command -v kubectl >/dev/null 2>&1; then kubectl get nodes -o wide || true; kubectl get pods -A || true; fi
`
    }
  ];
}

function composePorts(ports = []) {
  return ports.map((port) => `      - "${port}"`).join("\n");
}

function composeEnvironment(env = {}) {
  const entries = Object.entries(env);
  if (!entries.length) {
    return "";
  }
  return [
    "    environment:",
    ...entries.map(([key, value]) => `      ${key}: "${String(value).replaceAll('"', '\\"')}"`)
  ].join("\n");
}

function composeVolumes(volumes = ["data:/data"]) {
  return volumes.map((volume) => `      - ${volume}`).join("\n");
}

function composeCommand(command) {
  if (!command) {
    return "";
  }
  return `    command: ${JSON.stringify(command)}`;
}

function composeManifest(def) {
  const parts = [
    "services:",
    `  ${def.serviceName}:`,
    `    image: ${def.image}`,
    `    container_name: octastack-${def.serviceName}`,
    "    restart: unless-stopped"
  ];
  if (def.command) {
    parts.push(composeCommand(def.command));
  }
  const env = composeEnvironment(def.env);
  if (env) {
    parts.push(env);
  }
  if (def.ports?.length) {
    parts.push("    ports:");
    parts.push(composePorts(def.ports));
  }
  if (def.volumes?.length) {
    parts.push("    volumes:");
    parts.push(composeVolumes(def.volumes));
  }
  parts.push("volumes:");
  parts.push("  data: {}");
  return parts.join("\n");
}

function containerRuntimeInstallCommand() {
  return `
set -euo pipefail
log() { printf '[container-runtime] %s\\n' "$*"; }
if command -v docker >/dev/null 2>&1; then
  log "docker is already installed"
  docker --version
  exit 0
fi
if command -v apt-get >/dev/null 2>&1; then
  log "installing docker with apt"
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io docker-compose-plugin
elif command -v dnf >/dev/null 2>&1; then
  log "installing docker with dnf"
  dnf install -y docker docker-compose-plugin
elif command -v yum >/dev/null 2>&1; then
  log "installing docker with yum"
  yum install -y docker docker-compose-plugin
else
  echo "Unsupported package manager. Install Docker manually." >&2
  exit 1
fi
systemctl enable --now docker
docker version
`;
}

function containerSingleSteps(def) {
  const serviceSlug = slug(def.displayName);
  const manifest = composeManifest(def);
  const envText = Object.entries(def.env ?? {}).map(([key, value]) => `${key}=${value}`).join("\n") || `OCTASTACK_SERVICE=${def.displayName}`;
  const steps = [
    {
      label: `Prepare ${def.displayName} runtime`,
      command: containerRuntimeInstallCommand()
    },
    {
      label: `Create ${def.displayName} directories`,
      command: `
set -euo pipefail
install -d -m 0750 /opt/octastack/${serviceSlug}
install -d -m 0750 /var/lib/octastack/${serviceSlug}
cat >/opt/octastack/${serviceSlug}/.env <<'EOF'
${envText}
EOF
chmod 0600 /opt/octastack/${serviceSlug}/.env
`
    },
    {
      label: `Render ${def.displayName} compose`,
      command: `
set -euo pipefail
cat >/opt/octastack/${serviceSlug}/compose.yml <<'COMPOSE'
${manifest}
COMPOSE
`
    },
    {
      label: `Deploy ${def.displayName}`,
      command: `
set -euo pipefail
docker compose -f /opt/octastack/${serviceSlug}/compose.yml pull
docker compose -f /opt/octastack/${serviceSlug}/compose.yml up -d
docker compose -f /opt/octastack/${serviceSlug}/compose.yml ps
`
    },
    {
      label: `Inspect ${def.displayName}`,
      command: `
set -euo pipefail
docker ps --filter name=octastack-${def.serviceName}
docker logs octastack-${def.serviceName} --tail=80 || true
`
    }
  ];
  if (def.initCommand) {
    steps.splice(4, 0, {
      label: `Initialize ${def.displayName}`,
      command: def.initCommand
    });
  }
  return steps;
}

function containerHaSteps(def, nodes) {
  const serviceSlug = slug(def.displayName);
  const manifest = composeManifest(def);
  const envText = Object.entries(def.env ?? {}).map(([key, value]) => `${key}=${value}`).join("\n") || `OCTASTACK_SERVICE=${def.displayName}`;
  return [
    {
      label: `Prepare ${def.displayName} node runtime`,
      command: containerRuntimeInstallCommand()
    },
    {
      label: `Create ${def.displayName} node directories`,
      command: `
set -euo pipefail
log() { printf '[${serviceSlug}] %s\\n' "$*"; }
install -d -m 0750 /opt/octastack/${serviceSlug}
install -d -m 0750 /var/lib/octastack/${serviceSlug}
cat >/opt/octastack/${serviceSlug}/.env <<'EOF'
${envText}
EOF
chmod 0600 /opt/octastack/${serviceSlug}/.env
log "directories and environment file prepared"
`
    },
    {
      label: `Render ${def.displayName} node compose`,
      command: `
set -euo pipefail
log() { printf '[${serviceSlug}] %s\\n' "$*"; }
cat >/opt/octastack/${serviceSlug}/compose.yml <<'COMPOSE'
${manifest}
COMPOSE
log "compose manifest rendered"
`
    },
    {
      label: `Deploy ${def.displayName} node`,
      command: `
set -euo pipefail
log() { printf '[${serviceSlug}] %s\\n' "$*"; }
docker compose -f /opt/octastack/${serviceSlug}/compose.yml pull
docker compose -f /opt/octastack/${serviceSlug}/compose.yml up -d
docker compose -f /opt/octastack/${serviceSlug}/compose.yml ps
log "container deployed"
`
    },
    {
      label: `Document ${def.displayName} topology`,
      command: `
set -euo pipefail
cat >/tmp/${serviceSlug}-topology.md <<'EOF'
# ${def.displayName} HA topology

Members:
${nodes.map((n) => `- ${n.label}: ${n.ip} (${n.role})`).join("\n")}

This example deploys one ${def.displayName} container per member host. Replace the placeholder commands with vendor-supported clustering, TLS, backup, and failover automation before production use.
EOF
cat /tmp/${serviceSlug}-topology.md
`
    },
    {
      label: `Validate ${def.displayName} cluster`,
      command: def.haValidateCommand ?? `
set -euo pipefail
log() { printf '[${serviceSlug}] %s\\n' "$*"; }
docker ps --filter name=octastack-${def.serviceName} --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'
docker logs octastack-${def.serviceName} --tail=80 || true
log "local node validation complete"
`
    }
  ];
}

function topologyDocumentCommand(title, serviceSlug, nodes, summary) {
  return `
set -euo pipefail
cat >/tmp/${serviceSlug}-topology.md <<'EOF'
# ${title}

Members:
${nodes.map((n) => `- ${n.label}: ${n.ip} (${n.role})`).join("\n")}

${summary}
EOF
cat /tmp/${serviceSlug}-topology.md
`;
}

function clusteredComposeHaSteps(def, nodes, variant) {
  const serviceSlug = slug(variant.title ?? def.displayName);
  const renderCommand = variant.renderCommand(def, nodes, variant, serviceSlug);
  const steps = [
    {
      label: `Prepare ${variant.title} node runtime`,
      command: containerRuntimeInstallCommand()
    },
    {
      label: `Render ${variant.title} node configuration`,
      command: renderCommand
    },
    {
      label: `Deploy ${variant.title} node`,
      command: `
set -euo pipefail
log() { printf '[${serviceSlug}] %s\\n' "$*"; }
docker compose -f /opt/octastack/${serviceSlug}/compose.yml pull
docker compose -f /opt/octastack/${serviceSlug}/compose.yml up -d
docker compose -f /opt/octastack/${serviceSlug}/compose.yml ps
      log "node deployment complete"
`
    }
  ];
  if (variant.postDeployCommand) {
    steps.push({
      label: `Initialize ${variant.title} node`,
      command: variant.postDeployCommand(def, nodes, variant, serviceSlug)
    });
  }
  steps.push(
    {
      label: `Document ${variant.title} topology`,
      command: topologyDocumentCommand(variant.title, serviceSlug, nodes, variant.summary ?? "Enterprise HA topology generated for this technology.")
    },
    {
      label: `Validate ${variant.title} node`,
      command: variant.validateCommand ?? `
set -euo pipefail
log() { printf '[${serviceSlug}] %s\\n' "$*"; }
docker ps --filter name=octastack-${def.serviceName} --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'
docker logs octastack-${def.serviceName} --tail=80 || true
log "local validation complete"
`
    }
  );
  return steps;
}

function renderClusterComposeCommand(def, nodes, variant, serviceSlug, composeBody) {
  const baseEnv = variant.includeDefEnv === false ? {} : def.env ?? {};
  const envText = Object.entries(baseEnv).map(([key, value]) => `${key}=${value}`).join("\n") || `OCTASTACK_SERVICE=${def.displayName}`;
  const firstNode = nodes[0];
  const clusterPeers = nodes.map((node) => node.ip).join(",");
  const seedIps = nodes.slice(0, Math.min(nodes.length, 3)).map((node) => node.ip).join(",");
  const extraEnvText = typeof variant.extraEnvText === "function" ? variant.extraEnvText(def, nodes, variant) : variant.extraEnvText ?? "";
  const preComposeShell = typeof variant.preComposeShell === "function" ? variant.preComposeShell(def, nodes, variant, serviceSlug) : variant.preComposeShell ?? "";
  const preComposeFiles = typeof variant.preComposeFiles === "function" ? variant.preComposeFiles(def, nodes, variant, serviceSlug) : variant.preComposeFiles ?? "";
  return `
set -euo pipefail
${nodeDetectionScript(serviceSlug, nodes)}
${preComposeShell}
install -d -m 0750 /opt/octastack/${serviceSlug}
install -d -m 0750 /var/lib/octastack/${serviceSlug}
cat >/opt/octastack/${serviceSlug}/.env <<EOF
${envText}
OCTASTACK_NODE_NAME=$NODE_NAME
OCTASTACK_NODE_ROLE=$NODE_ROLE
OCTASTACK_NODE_INDEX=$NODE_INDEX
CURRENT_IP=$CURRENT_IP
FIRST_NODE_IP=${firstNode.ip}
CLUSTER_PEERS=${clusterPeers}
SEED_IPS=${seedIps}
${extraEnvText}
EOF
chmod 0600 /opt/octastack/${serviceSlug}/.env
${preComposeFiles}
cat >/opt/octastack/${serviceSlug}/compose.yml <<'COMPOSE'
${composeBody}
COMPOSE
log "configuration rendered"
`;
}

function clusterComposeVariant(options) {
  return {
    title: options.title,
    filePrefix: options.filePrefix,
    nodeGroups: options.nodeGroups,
    haCount: options.haCount,
    haCores: options.haCores,
    haMemory: options.haMemory,
    haDiskGb: options.haDiskGb,
    summary: options.summary,
    supportNote: options.summary,
    extraEnvText: options.extraEnvText,
    preComposeShell: options.preComposeShell,
    preComposeFiles: options.preComposeFiles,
    postDeployCommand: options.postDeployCommand,
    validateCommand: options.validateCommand,
    health: options.health,
    includeDefEnv: options.includeDefEnv,
    steps: clusteredComposeHaSteps,
    renderCommand(def, nodes, variant, serviceSlug) {
      return renderClusterComposeCommand(def, nodes, variant, serviceSlug, options.composeBody(def, nodes, variant, serviceSlug));
    }
  };
}

function indentLines(text, spaces) {
  const prefix = " ".repeat(spaces);
  return String(text).trim().split("\n").map((line) => `${prefix}${line}`).join("\n");
}

function composeCommandBlock(command) {
  if (!command) {
    return "";
  }
  return ["    command: >", indentLines(command, 6)].join("\n");
}

function composeEnvironmentBlock(environment = {}) {
  const entries = Object.entries(environment);
  if (!entries.length) {
    return "";
  }
  return [
    "    environment:",
    ...entries.map(([key, value]) => `      ${key}: "${String(value).replaceAll('"', '\\"')}"`)
  ].join("\n");
}

function composeVolumeBlock(volumes = []) {
  if (!volumes.length) {
    return "";
  }
  return ["    volumes:", ...volumes.map((volume) => `      - ${volume}`)].join("\n");
}

function composePortBlock(ports = []) {
  if (!ports.length) {
    return "";
  }
  return ["    ports:", ...ports.map((port) => `      - "${port}"`)].join("\n");
}

function composeNamedVolumes(volumes = []) {
  const namedVolumes = [...new Set(volumes.map((volume) => volume.split(":")[0]).filter((name) => name && !name.startsWith("/") && !name.startsWith(".")))];
  if (!namedVolumes.length) {
    return "";
  }
  return ["volumes:", ...namedVolumes.map((name) => `  ${name}: {}`)].join("\n");
}

function haComposeService(def, options = {}) {
  const serviceName = options.serviceName ?? def.serviceName;
  const image = options.image ?? def.image;
  const volumes = options.volumes ?? def.volumes ?? [];
  const serviceLines = [
    "services:",
    `  ${serviceName}:`,
    `    image: ${image}`,
    `    container_name: octastack-${serviceName}`,
    "    restart: unless-stopped"
  ];
  if (options.networkModeHost ?? true) {
    serviceLines.push("    network_mode: host");
  } else if (options.ports?.length ?? def.ports?.length) {
    serviceLines.push(composePortBlock(options.ports ?? def.ports));
  }
  if (options.privileged) {
    serviceLines.push("    privileged: true");
  }
  if (options.capAdd?.length) {
    serviceLines.push("    cap_add:");
    serviceLines.push(...options.capAdd.map((capability) => `      - ${capability}`));
  }
  if (options.ulimits) {
    serviceLines.push("    ulimits:");
    for (const [key, value] of Object.entries(options.ulimits)) {
      serviceLines.push(`      ${key}: ${value}`);
    }
  }
  if (options.envFile ?? true) {
    serviceLines.push("    env_file:");
    serviceLines.push("      - .env");
  }
  const environmentBlock = composeEnvironmentBlock(options.environment ?? {});
  if (environmentBlock) {
    serviceLines.push(environmentBlock);
  }
  const commandBlock = composeCommandBlock(options.command);
  if (commandBlock) {
    serviceLines.push(commandBlock);
  }
  const volumeBlock = composeVolumeBlock(volumes);
  if (volumeBlock) {
    serviceLines.push(volumeBlock);
  }
  if (options.extraServiceLines?.length) {
    serviceLines.push(...options.extraServiceLines);
  }
  const namedVolumes = composeNamedVolumes(volumes);
  if (namedVolumes) {
    serviceLines.push(namedVolumes);
  }
  return serviceLines.filter(Boolean).join("\n");
}

function singleRoleClusterVariant(options) {
  return clusterComposeVariant({
    ...options,
    composeBody(def, nodes, variant) {
      const resolve = (value) => (typeof value === "function" ? value(def, nodes, variant) : value);
      return haComposeService(def, {
        image: resolve(options.image),
        command: resolve(options.command),
        environment: resolve(options.environment),
        volumes: resolve(options.volumes) ?? def.volumes,
        ports: resolve(options.ports),
        networkModeHost: resolve(options.networkModeHost),
        privileged: resolve(options.privileged),
        capAdd: resolve(options.capAdd),
        ulimits: resolve(options.ulimits),
        extraServiceLines: resolve(options.extraServiceLines)
      });
    }
  });
}

function roleBasedClusterVariant(options) {
  return clusterComposeVariant({
    ...options,
    preComposeShell(def, nodes, variant, serviceSlug) {
      const roleCases = Object.entries(options.roles).map(([role, profile]) => {
        const command = typeof profile.command === "function" ? profile.command(def, nodes, variant, serviceSlug) : profile.command;
        const quotedCommand = String(command).replaceAll("\\", "\\\\").replaceAll('"', '\\"');
        return `${role}) ROLE_IMAGE="${profile.image}"; ROLE_COMMAND="${quotedCommand}" ;;`;
      }).join("\n  ");
      const extraShell = typeof options.preComposeShell === "function" ? options.preComposeShell(def, nodes, variant, serviceSlug) : options.preComposeShell ?? "";
      return `
${extraShell}
ROLE_IMAGE=""
ROLE_COMMAND=""
case "$NODE_ROLE" in
  ${roleCases}
  *) log "unsupported role $NODE_ROLE"; exit 1 ;;
esac
`;
    },
    extraEnvText(def, nodes, variant) {
      const extra = typeof options.extraEnvText === "function" ? options.extraEnvText(def, nodes, variant) : options.extraEnvText ?? "";
      return `ROLE_IMAGE=$ROLE_IMAGE\nROLE_COMMAND=$ROLE_COMMAND\n${extra}`;
    },
    composeBody(def) {
      return haComposeService(def, {
        image: "${ROLE_IMAGE}",
        command: "${ROLE_COMMAND}",
        volumes: options.volumes ?? def.volumes,
        environment: options.environment,
        capAdd: options.capAdd,
        privileged: options.privileged
      });
    }
  });
}

function firstNodeOnlyScript(serviceSlug, body) {
  if (!body) {
    return "";
  }
  return `
set -euo pipefail
if [ "$NODE_INDEX" != "1" ]; then
  log "cluster initialization is handled by the first member"
  exit 0
fi
${body}
`;
}

function waitForContainerCommand(containerName, probeCommand) {
  return `
container_ready=0
for attempt in $(seq 1 60); do
  if docker exec ${containerName} sh -lc ${JSON.stringify(probeCommand)} >/dev/null 2>&1; then
    container_ready=1
    break
  fi
  sleep 5
done
if [ "$container_ready" = "1" ]; then
  log "container ${containerName} is ready"
else
docker logs ${containerName} --tail=120 || true
echo "container ${containerName} did not become ready" >&2
exit 1
fi
`;
}

function mysqlGroupReplicationVariant() {
  return singleRoleClusterVariant({
    title: "MySQL Group Replication HA",
    filePrefix: "group-replication-ha",
    summary: "Three MySQL members run native Group Replication with GTID, row-based binary logging, and a deterministic primary bootstrap.",
    haCount: 3,
    command: `
mysqld
--server-id=\${OCTASTACK_NODE_INDEX}
--report-host=\${CURRENT_IP}
--gtid-mode=ON
--enforce-gtid-consistency=ON
--binlog-checksum=NONE
--log-bin=mysql-bin
--log-slave-updates=ON
--binlog-format=ROW
--transaction-write-set-extraction=XXHASH64
--loose-group-replication-group-name=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
--loose-group-replication-start-on-boot=OFF
--loose-group-replication-local-address=\${CURRENT_IP}:33061
--loose-group-replication-group-seeds=\${MYSQL_GROUP_SEEDS}
--loose-group-replication-ip-allowlist=10.0.0.0/16
`,
    extraEnvText: (_def, nodes) => `MYSQL_GROUP_SEEDS=${nodes.map((node) => `${node.ip}:33061`).join(",")}`,
    postDeployCommand: (_def, nodes) => `
set -euo pipefail
${nodeDetectionScript("mysql-group-replication-ha", nodes)}
${waitForContainerCommand("octastack-mysql", "mysqladmin ping -uroot -pchange-me")}
if [ "$NODE_INDEX" = "1" ]; then
  docker exec octastack-mysql mysql -uroot -pchange-me <<'SQL'
SET SQL_LOG_BIN=0;
CREATE USER IF NOT EXISTS 'repl'@'%' IDENTIFIED BY 'change-me';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';
GRANT CONNECTION_ADMIN, BACKUP_ADMIN, GROUP_REPLICATION_STREAM ON *.* TO 'repl'@'%';
FLUSH PRIVILEGES;
SET SQL_LOG_BIN=1;
INSTALL PLUGIN group_replication SONAME 'group_replication.so';
SET GLOBAL group_replication_bootstrap_group=ON;
START GROUP_REPLICATION USER='repl', PASSWORD='change-me';
SET GLOBAL group_replication_bootstrap_group=OFF;
SQL
else
  sleep 20
  docker exec octastack-mysql mysql -uroot -pchange-me <<'SQL'
INSTALL PLUGIN group_replication SONAME 'group_replication.so';
START GROUP_REPLICATION USER='repl', PASSWORD='change-me';
SQL
fi
`,
    validateCommand: `
set -euo pipefail
docker exec octastack-mysql mysql -uroot -pchange-me -e "SELECT MEMBER_HOST, MEMBER_STATE, MEMBER_ROLE FROM performance_schema.replication_group_members;"
`,
    health: "docker exec octastack-mysql mysqladmin ping -uroot -pchange-me"
  });
}

function mariadbGaleraVariant() {
  return singleRoleClusterVariant({
    title: "MariaDB Galera HA",
    filePrefix: "galera-ha",
    summary: "Three MariaDB members form a synchronous Galera cluster with one deterministic bootstrap member and two joining members.",
    haCount: 3,
    preComposeShell: `
if [ "$NODE_INDEX" = "1" ]; then
  GALERA_BOOTSTRAP="--wsrep-new-cluster"
else
  GALERA_BOOTSTRAP=""
fi
`,
    extraEnvText: (_def, nodes) => `GALERA_BOOTSTRAP=$GALERA_BOOTSTRAP\nGALERA_CLUSTER_ADDRESS=gcomm://${nodes.map((node) => node.ip).join(",")}`,
    command: `
mariadbd
--bind-address=0.0.0.0
--binlog-format=ROW
--default-storage-engine=InnoDB
--innodb-autoinc-lock-mode=2
--wsrep-on=ON
--wsrep-provider=/usr/lib/galera/libgalera_smm.so
--wsrep-cluster-name=octastack-mariadb
--wsrep-cluster-address=\${GALERA_CLUSTER_ADDRESS}
--wsrep-node-address=\${CURRENT_IP}
--wsrep-node-name=\${OCTASTACK_NODE_NAME}
\${GALERA_BOOTSTRAP}
`,
    validateCommand: `
set -euo pipefail
docker exec octastack-mariadb mariadb -uroot -pchange-me -e "SHOW STATUS LIKE 'wsrep_cluster_size'; SHOW STATUS LIKE 'wsrep_local_state_comment';"
`,
    health: "docker exec octastack-mariadb mariadb-admin ping -uroot -pchange-me"
  });
}

function mongodbReplicaSetVariant() {
  return singleRoleClusterVariant({
    title: "MongoDB Replica Set HA",
    filePrefix: "replica-set-ha",
    summary: "Three MongoDB members form a replica set with a shared keyfile, deterministic member list, and first-member initiation.",
    haCount: 3,
    volumes: ["data:/data/db", "/opt/octastack/mongodb_replica_set_ha/keyfile:/etc/mongo-keyfile:ro"],
    preComposeFiles: `
install -m 0400 /dev/stdin /opt/octastack/mongodb_replica_set_ha/keyfile <<'KEY'
octastack-mongodb-replica-set-shared-key-change-me
KEY
`,
    command: "mongod --replSet rs0 --bind_ip_all --keyFile /etc/mongo-keyfile",
    postDeployCommand: (_def, nodes) => `
set -euo pipefail
${nodeDetectionScript("mongodb-replica-set-ha", nodes)}
${waitForContainerCommand("octastack-mongodb", "mongosh --quiet --eval 'db.adminCommand({ ping: 1 })'")}
if [ "$NODE_INDEX" != "1" ]; then
  log "replica set initiation is handled by the first member"
  exit 0
fi
docker exec octastack-mongodb mongosh -u root -p change-me --authenticationDatabase admin <<'JS'
rs.initiate({
  _id: "rs0",
  members: [
${nodes.map((node, index) => `    { _id: ${index}, host: "${node.ip}:27017" }`).join(",\n")}
  ]
});
JS
`,
    validateCommand: "docker exec octastack-mongodb mongosh -u root -p change-me --authenticationDatabase admin --quiet --eval 'rs.status().members.map(m => `${m.name} ${m.stateStr}`).join(\"\\n\")'",
    health: "docker exec octastack-mongodb mongosh -u root -p change-me --authenticationDatabase admin --quiet --eval 'db.adminCommand({ ping: 1 })'"
  });
}

function cassandraRingVariant() {
  return singleRoleClusterVariant({
    title: "Cassandra Native Ring HA",
    filePrefix: "native-ring-ha",
    summary: "Three Cassandra members form a native gossip ring using generated seed nodes and rack/datacenter settings.",
    haCount: 3,
    environment: {
      CASSANDRA_CLUSTER_NAME: "octastack-cassandra",
      CASSANDRA_SEEDS: "${SEED_IPS}",
      CASSANDRA_LISTEN_ADDRESS: "${CURRENT_IP}",
      CASSANDRA_BROADCAST_ADDRESS: "${CURRENT_IP}",
      CASSANDRA_RPC_ADDRESS: "0.0.0.0",
      CASSANDRA_BROADCAST_RPC_ADDRESS: "${CURRENT_IP}",
      CASSANDRA_ENDPOINT_SNITCH: "GossipingPropertyFileSnitch",
      CASSANDRA_DC: "dc1",
      CASSANDRA_RACK: "rack1"
    },
    validateCommand: "docker exec octastack-cassandra nodetool status",
    health: "docker exec octastack-cassandra nodetool status"
  });
}

function scyllaRingVariant() {
  return singleRoleClusterVariant({
    title: "ScyllaDB Native Ring HA",
    filePrefix: "native-ring-ha",
    summary: "Three ScyllaDB members form a native ring with generated seeds and per-node broadcast addresses.",
    haCount: 3,
    command: "--smp 2 --memory 4G --overprovisioned 1 --seeds=\${SEED_IPS} --listen-address=\${CURRENT_IP} --rpc-address=0.0.0.0 --broadcast-address=\${CURRENT_IP} --broadcast-rpc-address=\${CURRENT_IP}",
    validateCommand: "docker exec octastack-scylladb nodetool status",
    health: "docker exec octastack-scylladb nodetool status"
  });
}

function clickHouseKeeperVariant() {
  return singleRoleClusterVariant({
    title: "ClickHouse Replicated Keeper HA",
    filePrefix: "replicated-keeper-ha",
    summary: "Three ClickHouse members run replicated MergeTree-ready cluster configuration with embedded ClickHouse Keeper quorum.",
    haCount: 3,
    preComposeFiles: (_def, nodes) => `
cat >/opt/octastack/clickhouse_replicated_keeper_ha/cluster.xml <<EOF
<clickhouse>
  <keeper_server>
    <tcp_port>9181</tcp_port>
    <server_id>\${NODE_INDEX}</server_id>
    <log_storage_path>/var/lib/clickhouse/coordination/log</log_storage_path>
    <snapshot_storage_path>/var/lib/clickhouse/coordination/snapshots</snapshot_storage_path>
    <coordination_settings>
      <operation_timeout_ms>10000</operation_timeout_ms>
      <session_timeout_ms>30000</session_timeout_ms>
      <raft_logs_level>warning</raft_logs_level>
    </coordination_settings>
    <raft_configuration>
${nodes.map((node, index) => `      <server><id>${index + 1}</id><hostname>${node.ip}</hostname><port>9234</port></server>`).join("\n")}
    </raft_configuration>
  </keeper_server>
  <zookeeper>
${nodes.map((node) => `    <node><host>${node.ip}</host><port>9181</port></node>`).join("\n")}
  </zookeeper>
  <remote_servers>
    <octastack_cluster>
${nodes.map((node) => `      <shard><replica><host>${node.ip}</host><port>9000</port></replica></shard>`).join("\n")}
    </octastack_cluster>
  </remote_servers>
  <macros>
    <cluster>octastack_cluster</cluster>
    <shard>\${NODE_INDEX}</shard>
    <replica>\${OCTASTACK_NODE_NAME}</replica>
  </macros>
  <listen_host>0.0.0.0</listen_host>
</clickhouse>
EOF
`,
    volumes: ["data:/var/lib/clickhouse", "/opt/octastack/clickhouse_replicated_keeper_ha/cluster.xml:/etc/clickhouse-server/config.d/cluster.xml:ro"],
    validateCommand: "curl -fsS 'http://127.0.0.1:8123/ping' && docker exec octastack-clickhouse clickhouse-client --query=\"SELECT * FROM system.clusters WHERE cluster = 'octastack_cluster'\"",
    health: "curl -fsS 'http://127.0.0.1:8123/ping'"
  });
}

function cockroachClusterVariant() {
  return singleRoleClusterVariant({
    title: "CockroachDB Native Cluster HA",
    filePrefix: "native-cluster-ha",
    summary: "Three CockroachDB members run a native replicated SQL cluster with deterministic join addresses and first-member initialization.",
    haCount: 3,
    command: "start --insecure --advertise-addr=\${CURRENT_IP} --listen-addr=0.0.0.0:26257 --http-addr=0.0.0.0:8080 --join=\${CLUSTER_PEERS} --store=/cockroach/cockroach-data",
    postDeployCommand: (_def, nodes) => `
set -euo pipefail
${nodeDetectionScript("cockroachdb-native-cluster-ha", nodes)}
if [ "$NODE_INDEX" = "1" ]; then
  sleep 15
  docker exec octastack-cockroachdb cockroach init --insecure --host=127.0.0.1:26257 || true
fi
`,
    validateCommand: "docker exec octastack-cockroachdb cockroach node status --insecure --host=127.0.0.1:26257",
    health: "docker exec octastack-cockroachdb cockroach sql --insecure --execute='select 1'"
  });
}

function yugabyteClusterVariant() {
  return singleRoleClusterVariant({
    title: "YugabyteDB RF3 Cluster HA",
    filePrefix: "rf3-cluster-ha",
    summary: "Three YugabyteDB members run a replication-factor-three cluster with generated advertise and join addresses.",
    haCount: 3,
    command: "bin/yugabyted start --foreground --base_dir=/root/var --advertise_address=\${CURRENT_IP} --join=\${FIRST_NODE_IP}",
    validateCommand: "docker exec octastack-yugabytedb bin/yugabyted status || true",
    health: "docker exec octastack-yugabytedb bin/ysqlsh -h 127.0.0.1 -c 'select 1;'"
  });
}

function rethinkdbClusterVariant() {
  return singleRoleClusterVariant({
    title: "RethinkDB Native Cluster HA",
    filePrefix: "native-cluster-ha",
    summary: "Three RethinkDB members form a native cluster; non-primary members join the generated first member.",
    haCount: 3,
    preComposeShell: `
if [ "$NODE_INDEX" = "1" ]; then
  RETHINK_JOIN_ARG=""
else
  RETHINK_JOIN_ARG="--join \${FIRST_NODE_IP}:29015"
fi
`,
    extraEnvText: "RETHINK_JOIN_ARG=$RETHINK_JOIN_ARG",
    command: "rethinkdb --bind all --canonical-address \${CURRENT_IP} \${RETHINK_JOIN_ARG}",
    validateCommand: "curl -fsS http://127.0.0.1:8080/",
    health: "curl -fsS http://127.0.0.1:8080/"
  });
}

function etcdClusterVariant() {
  return singleRoleClusterVariant({
    title: "etcd Quorum Cluster HA",
    filePrefix: "quorum-cluster-ha",
    summary: "Three etcd members form an odd-number quorum with generated peer and client advertise URLs.",
    haCount: 3,
    extraEnvText: (_def, nodes) => `ETCD_INITIAL_CLUSTER=${nodes.map((node) => `${node.label}=http://${node.ip}:2380`).join(",")}`,
    command: `
etcd
--name=\${OCTASTACK_NODE_NAME}
--data-dir=/etcd-data
--listen-peer-urls=http://0.0.0.0:2380
--listen-client-urls=http://0.0.0.0:2379
--initial-advertise-peer-urls=http://\${CURRENT_IP}:2380
--advertise-client-urls=http://\${CURRENT_IP}:2379
--initial-cluster=\${ETCD_INITIAL_CLUSTER}
--initial-cluster-state=new
`,
    validateCommand: "docker exec octastack-etcd etcdctl endpoint status --cluster -w table",
    health: "docker exec octastack-etcd etcdctl endpoint health"
  });
}

function consulClusterVariant() {
  return singleRoleClusterVariant({
    title: "Consul Server Quorum HA",
    filePrefix: "server-quorum-ha",
    summary: "Three Consul server members form a Raft quorum and expose the UI/client API on every member.",
    haCount: 3,
    command: (_def, nodes) => `agent -server -bootstrap-expect=3 -node=\${OCTASTACK_NODE_NAME} -bind=\${CURRENT_IP} -client=0.0.0.0 ${nodes.map((node) => `-retry-join=${node.ip}`).join(" ")} -ui`,
    validateCommand: "docker exec octastack-consul consul operator raft list-peers || true",
    health: "curl -fsS http://127.0.0.1:8500/v1/status/leader"
  });
}

function natsJetStreamClusterVariant() {
  return singleRoleClusterVariant({
    title: "NATS JetStream Cluster HA",
    filePrefix: "jetstream-cluster-ha",
    summary: "Three NATS members form a JetStream-enabled cluster with generated route peers and persistent storage.",
    haCount: 3,
    preComposeFiles: (_def, nodes) => `
cat >/opt/octastack/nats_jetstream_cluster_ha/nats.conf <<NATS
server_name: \${OCTASTACK_NODE_NAME}
listen: 0.0.0.0:4222
http: 0.0.0.0:8222
jetstream {
  store_dir: /data/jetstream
}
cluster {
  name: octastack-nats
  listen: 0.0.0.0:6222
  routes: [
${nodes.map((node) => `    nats-route://${node.ip}:6222`).join(",\n")}
  ]
}
NATS
`,
    volumes: ["data:/data", "/opt/octastack/nats_jetstream_cluster_ha/nats.conf:/etc/nats/nats.conf:ro"],
    command: "-c /etc/nats/nats.conf",
    validateCommand: "curl -fsS http://127.0.0.1:8222/healthz",
    health: "curl -fsS http://127.0.0.1:8222/healthz"
  });
}

function redpandaClusterVariant() {
  return singleRoleClusterVariant({
    title: "Redpanda Native Cluster HA",
    filePrefix: "native-cluster-ha",
    summary: "Three Redpanda brokers run a native Raft-backed Kafka-compatible cluster with generated seed servers.",
    haCount: 3,
    preComposeShell: `
REDPANDA_NODE_ID=$((NODE_INDEX - 1))
`,
    extraEnvText: (_def, nodes) => `REDPANDA_NODE_ID=$REDPANDA_NODE_ID\nREDPANDA_SEEDS=${nodes.map((node) => `${node.ip}:33145`).join(",")}`,
    command: `
redpanda start
--overprovisioned
--smp 1
--memory 2G
--reserve-memory 0M
--node-id=\${REDPANDA_NODE_ID}
--check=false
--kafka-addr=internal://0.0.0.0:9092,external://0.0.0.0:19092
--advertise-kafka-addr=internal://\${CURRENT_IP}:9092,external://\${CURRENT_IP}:19092
--rpc-addr=0.0.0.0:33145
--advertise-rpc-addr=\${CURRENT_IP}:33145
--seeds=\${REDPANDA_SEEDS}
`,
    validateCommand: "curl -fsS http://127.0.0.1:9644/v1/status/ready",
    health: "curl -fsS http://127.0.0.1:9644/v1/status/ready"
  });
}

function opensearchClusterVariant() {
  return singleRoleClusterVariant({
    title: "OpenSearch Cluster HA",
    filePrefix: "cluster-ha",
    summary: "Three OpenSearch nodes form a cluster-manager quorum with generated discovery seed hosts.",
    haCount: 3,
    includeDefEnv: false,
    environment: (_def, nodes) => ({
      "cluster.name": "octastack-opensearch",
      "node.name": "${OCTASTACK_NODE_NAME}",
      "network.host": "0.0.0.0",
      "discovery.seed_hosts": nodes.map((node) => node.ip).join(","),
      "cluster.initial_cluster_manager_nodes": nodes.map((node) => node.label).join(","),
      "DISABLE_SECURITY_PLUGIN": "true",
      "OPENSEARCH_JAVA_OPTS": "-Xms1g -Xmx1g",
      "bootstrap.memory_lock": "true"
    }),
    ulimits: { memlock: "-1" },
    validateCommand: "curl -fsS http://127.0.0.1:9200/_cluster/health?pretty",
    health: "curl -fsS http://127.0.0.1:9200/_cluster/health"
  });
}

function elasticsearchClusterVariant() {
  return singleRoleClusterVariant({
    title: "Elasticsearch Cluster HA",
    filePrefix: "cluster-ha",
    summary: "Three Elasticsearch nodes form a discovery-backed cluster with generated initial master nodes and disabled demo security.",
    haCount: 3,
    includeDefEnv: false,
    environment: (_def, nodes) => ({
      "cluster.name": "octastack-elasticsearch",
      "node.name": "${OCTASTACK_NODE_NAME}",
      "network.host": "0.0.0.0",
      "discovery.seed_hosts": nodes.map((node) => node.ip).join(","),
      "cluster.initial_master_nodes": nodes.map((node) => node.label).join(","),
      "xpack.security.enabled": "false",
      "ES_JAVA_OPTS": "-Xms1g -Xmx1g",
      "bootstrap.memory_lock": "true"
    }),
    ulimits: { memlock: "-1" },
    validateCommand: "curl -fsS http://127.0.0.1:9200/_cluster/health?pretty",
    health: "curl -fsS http://127.0.0.1:9200/_cluster/health"
  });
}

function minioDistributedVariant() {
  return singleRoleClusterVariant({
    title: "MinIO Distributed Erasure Coding HA",
    filePrefix: "distributed-erasure-ha",
    summary: "Four MinIO members run distributed erasure coding with a generated endpoint list and shared root credentials.",
    haCount: 4,
    command: (_def, nodes) => `server --console-address ':9001' ${nodes.map((node) => `http://${node.ip}:9000/data`).join(" ")}`,
    validateCommand: "curl -fsS http://127.0.0.1:9000/minio/health/live",
    health: "curl -fsS http://127.0.0.1:9000/minio/health/live"
  });
}

function valkeyClusterVariant() {
  return singleRoleClusterVariant({
    title: "Valkey Cluster HA",
    filePrefix: "cluster-ha",
    summary: "Six Valkey members run native cluster mode as three primaries plus three replicas with generated cluster announce IPs.",
    haCount: 6,
    command: "valkey-server --bind 0.0.0.0 --protected-mode no --appendonly yes --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000 --cluster-announce-ip \${CURRENT_IP}",
    postDeployCommand: (_def, nodes) => `
set -euo pipefail
${nodeDetectionScript("valkey-cluster-ha", nodes)}
${waitForContainerCommand("octastack-valkey", "valkey-cli ping")}
if [ "$NODE_INDEX" = "1" ]; then
  sleep 15
  docker exec octastack-valkey valkey-cli --cluster create ${nodes.map((node) => `${node.ip}:6379`).join(" ")} --cluster-replicas 1 --cluster-yes || true
fi
`,
    validateCommand: "docker exec octastack-valkey valkey-cli cluster nodes",
    health: "docker exec octastack-valkey valkey-cli ping"
  });
}

function valkeySentinelVariant() {
  return singleRoleClusterVariant({
    title: "Valkey Sentinel HA",
    filePrefix: "sentinel-ha",
    summary: "Three Valkey members run primary/replica data nodes plus Sentinel quorum on every member.",
    haCount: 3,
    preComposeShell: `
if [ "$NODE_INDEX" = "1" ]; then
  REPLICAOF_LINE=""
else
  REPLICAOF_LINE="replicaof \${FIRST_NODE_IP} 6379"
fi
`,
    preComposeFiles: `
cat >/opt/octastack/valkey_sentinel_ha/valkey.conf <<EOF
bind 0.0.0.0
protected-mode no
appendonly yes
dir /data
\${REPLICAOF_LINE}
EOF
cat >/opt/octastack/valkey_sentinel_ha/sentinel.conf <<EOF
port 26379
sentinel monitor valkey-ha \${FIRST_NODE_IP} 6379 2
sentinel down-after-milliseconds valkey-ha 5000
sentinel failover-timeout valkey-ha 60000
sentinel parallel-syncs valkey-ha 1
EOF
`,
    volumes: ["data:/data", "/opt/octastack/valkey_sentinel_ha/valkey.conf:/etc/valkey/valkey.conf:ro", "/opt/octastack/valkey_sentinel_ha/sentinel.conf:/etc/valkey/sentinel.conf:ro"],
    command: "sh -lc 'valkey-server /etc/valkey/valkey.conf & exec valkey-server /etc/valkey/sentinel.conf --sentinel'",
    validateCommand: "docker exec octastack-valkey valkey-cli -p 26379 sentinel master valkey-ha",
    health: "docker exec octastack-valkey valkey-cli ping"
  });
}

function zookeeperEnsembleVariant() {
  return singleRoleClusterVariant({
    title: "ZooKeeper Ensemble HA",
    filePrefix: "ensemble-ha",
    summary: "Three ZooKeeper members form an odd-number ensemble with generated server IDs and peer addresses.",
    haCount: 3,
    preComposeShell: "ZOO_MY_ID=$NODE_INDEX",
    extraEnvText: (_def, nodes) => `ZOO_MY_ID=$ZOO_MY_ID\nZOO_SERVERS=${nodes.map((node, index) => `server.${index + 1}=${node.ip}:2888:3888;2181`).join(" ")}`,
    environment: {
      ZOO_MY_ID: "${ZOO_MY_ID}",
      ZOO_SERVERS: "${ZOO_SERVERS}",
      ZOO_4LW_COMMANDS_WHITELIST: "ruok,stat,srvr,mntr"
    },
    validateCommand: "docker exec octastack-zookeeper zkServer.sh status || true",
    health: "docker exec octastack-zookeeper zkServer.sh status || true"
  });
}

function vaultRaftVariant() {
  return singleRoleClusterVariant({
    title: "Vault Integrated Raft HA",
    filePrefix: "raft-ha",
    summary: "Three Vault members use integrated Raft storage with generated retry_join stanzas and IPC_LOCK enabled.",
    haCount: 3,
    capAdd: ["IPC_LOCK"],
    preComposeFiles: (_def, nodes) => `
cat >/opt/octastack/vault_integrated_raft_ha/vault.hcl <<HCL
ui = true
disable_mlock = false
listener "tcp" {
  address = "0.0.0.0:8200"
  tls_disable = true
}
storage "raft" {
  path = "/vault/file"
${nodes.map((node) => `  retry_join { leader_api_addr = "http://${node.ip}:8200" }`).join("\n")}
}
api_addr = "http://\${CURRENT_IP}:8200"
cluster_addr = "http://\${CURRENT_IP}:8201"
HCL
`,
    volumes: ["data:/vault/file", "/opt/octastack/vault_integrated_raft_ha/vault.hcl:/vault/config/vault.hcl:ro"],
    command: "server -config=/vault/config/vault.hcl",
    environment: { VAULT_ADDR: "http://127.0.0.1:8200" },
    validateCommand: "docker exec octastack-vault vault status || true",
    health: "curl -fsS http://127.0.0.1:8200/v1/sys/health || true"
  });
}

function statelessActiveActiveVariant(title, filePrefix, summary) {
  return singleRoleClusterVariant({
    title,
    filePrefix,
    summary,
    haCount: 2,
    validateCommand: `
set -euo pipefail
docker ps --filter name=octastack- --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'
`,
    health: "docker ps --format '{{.Names}} {{.Status}}' | grep octastack"
  });
}

function victoriaMetricsClusterVariant() {
  return roleBasedClusterVariant({
    title: "VictoriaMetrics Cluster HA",
    filePrefix: "cluster-ha",
    summary: "VictoriaMetrics runs in cluster mode with three vmstorage nodes, two vmselect nodes, and two vminsert nodes.",
    nodeGroups: [
      { role: "vmstorage", labelPrefix: "victoriametrics-storage", vmNamePrefix: "victoriametrics-storage", count: 3, cores: 4, memory: 8192, diskGb: "200" },
      { role: "vmselect", labelPrefix: "victoriametrics-select", vmNamePrefix: "victoriametrics-select", count: 2, cores: 2, memory: 4096, diskGb: "40" },
      { role: "vminsert", labelPrefix: "victoriametrics-insert", vmNamePrefix: "victoriametrics-insert", count: 2, cores: 2, memory: 4096, diskGb: "40" }
    ],
    volumes: ["data:/storage"],
    roles: {
      vmstorage: { image: "victoriametrics/vmstorage:v1.103.0", command: "-retentionPeriod=30d -storageDataPath=/storage -httpListenAddr=:8482 -vminsertAddr=:8400 -vmselectAddr=:8401" },
      vmselect: { image: "victoriametrics/vmselect:v1.103.0", command: (_def, nodes) => `-httpListenAddr=:8481 ${nodes.filter((node) => node.role === "vmstorage").map((node) => `-storageNode=${node.ip}:8401`).join(" ")}` },
      vminsert: { image: "victoriametrics/vminsert:v1.103.0", command: (_def, nodes) => `-httpListenAddr=:8480 ${nodes.filter((node) => node.role === "vmstorage").map((node) => `-storageNode=${node.ip}:8400`).join(" ")}` }
    },
    validateCommand: "curl -fsS http://127.0.0.1:8482/health || curl -fsS http://127.0.0.1:8481/health || curl -fsS http://127.0.0.1:8480/health",
    health: "curl -fsS http://127.0.0.1:8482/health || curl -fsS http://127.0.0.1:8481/health || curl -fsS http://127.0.0.1:8480/health"
  });
}

function seaweedFsClusterVariant() {
  return roleBasedClusterVariant({
    title: "SeaweedFS Master Volume Filer HA",
    filePrefix: "master-volume-filer-ha",
    summary: "SeaweedFS runs three master nodes plus replicated volume and filer nodes with generated master peer addresses.",
    nodeGroups: [
      { role: "master", labelPrefix: "seaweed-master", vmNamePrefix: "seaweed-master", count: 3, cores: 2, memory: 4096, diskGb: "40" },
      { role: "volume", labelPrefix: "seaweed-volume", vmNamePrefix: "seaweed-volume", count: 2, cores: 4, memory: 8192, diskGb: "300" },
      { role: "filer", labelPrefix: "seaweed-filer", vmNamePrefix: "seaweed-filer", count: 2, cores: 2, memory: 4096, diskGb: "80" }
    ],
    volumes: ["data:/data"],
    roles: {
      master: { image: "chrislusf/seaweedfs:3.73", command: (_def, nodes) => `master -ip=\${CURRENT_IP} -port=9333 -mdir=/data/master -peers=${nodes.filter((node) => node.role === "master").map((node) => `${node.ip}:9333`).join(",")}` },
      volume: { image: "chrislusf/seaweedfs:3.73", command: (_def, nodes) => `volume -ip=\${CURRENT_IP} -port=8080 -dir=/data/volume -mserver=${nodes.filter((node) => node.role === "master").map((node) => `${node.ip}:9333`).join(",")}` },
      filer: { image: "chrislusf/seaweedfs:3.73", command: (_def, nodes) => `filer -ip=\${CURRENT_IP} -port=8888 -master=${nodes.filter((node) => node.role === "master").map((node) => `${node.ip}:9333`).join(",")}` }
    },
    validateCommand: "curl -fsS http://127.0.0.1:9333/cluster/status || curl -fsS http://127.0.0.1:8888/",
    health: "curl -fsS http://127.0.0.1:9333/cluster/status || curl -fsS http://127.0.0.1:8888/"
  });
}

function typesenseClusterVariant() {
  return singleRoleClusterVariant({
    title: "Typesense Native Cluster HA",
    filePrefix: "native-cluster-ha",
    summary: "Three Typesense members run native clustering with a generated nodes file and per-node peering address.",
    haCount: 3,
    preComposeFiles: (_def, nodes) => `
cat >/opt/octastack/typesense_native_cluster_ha/nodes <<'EOF'
${nodes.map((node) => `${node.ip}:8107:8108`).join("\n")}
EOF
`,
    volumes: ["data:/data", "/opt/octastack/typesense_native_cluster_ha/nodes:/data/nodes:ro"],
    command: "--data-dir /data --api-key=change-me --enable-cors --peering-address \${CURRENT_IP} --peering-port 8107 --nodes=/data/nodes",
    validateCommand: "curl -fsS http://127.0.0.1:8108/health",
    health: "curl -fsS http://127.0.0.1:8108/health"
  });
}

function weaviateClusterVariant() {
  return singleRoleClusterVariant({
    title: "Weaviate Cluster HA",
    filePrefix: "cluster-ha",
    summary: "Three Weaviate members run with gossip and Raft join settings generated from the node IP plan.",
    haCount: 3,
    environment: (_def, nodes) => ({
      QUERY_DEFAULTS_LIMIT: "25",
      AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: "true",
      PERSISTENCE_DATA_PATH: "/var/lib/weaviate",
      DEFAULT_VECTORIZER_MODULE: "none",
      CLUSTER_HOSTNAME: "${CURRENT_IP}",
      CLUSTER_GOSSIP_BIND_PORT: "7100",
      CLUSTER_DATA_BIND_PORT: "7101",
      RAFT_JOIN: nodes.map((node) => node.ip).join(",")
    }),
    validateCommand: "curl -fsS http://127.0.0.1:8080/v1/.well-known/ready",
    health: "curl -fsS http://127.0.0.1:8080/v1/.well-known/ready"
  });
}

function couchdbClusterVariant() {
  return singleRoleClusterVariant({
    title: "CouchDB Native Cluster HA",
    filePrefix: "native-cluster-ha",
    summary: "Three CouchDB members run native clustering with a shared cookie/secret and first-member cluster setup calls.",
    haCount: 3,
    environment: {
      COUCHDB_USER: "admin",
      COUCHDB_PASSWORD: "change-me",
      COUCHDB_SECRET: "replace-with-long-random-secret",
      ERL_FLAGS: "-setcookie replace-with-erlang-cookie",
      NODENAME: "couchdb@${CURRENT_IP}"
    },
    postDeployCommand: (_def, nodes) => `
set -euo pipefail
${nodeDetectionScript("couchdb-native-cluster-ha", nodes)}
${waitForContainerCommand("octastack-couchdb", "curl -fsS http://admin:change-me@127.0.0.1:5984/_up")}
if [ "$NODE_INDEX" != "1" ]; then
  log "cluster setup is driven by the first CouchDB member"
  exit 0
fi
for member in ${nodes.map((node) => node.ip).join(" ")}; do
  curl -fsS -X POST http://admin:change-me@127.0.0.1:5984/_cluster_setup \\
    -H 'Content-Type: application/json' \\
    --data-binary @- <<EOF || true
{"action":"enable_cluster","bind_address":"0.0.0.0","username":"admin","password":"change-me","node_count":"${nodes.length}","remote_node":"$member","remote_current_user":"admin","remote_current_password":"change-me"}
EOF
  if [ "$member" != "${nodes[0].ip}" ]; then
    curl -fsS -X POST http://admin:change-me@127.0.0.1:5984/_cluster_setup \\
      -H 'Content-Type: application/json' \\
      --data-binary @- <<EOF || true
{"action":"add_node","host":"$member","port":5984,"username":"admin","password":"change-me"}
EOF
  fi
done
curl -fsS -X POST http://admin:change-me@127.0.0.1:5984/_cluster_setup -H 'Content-Type: application/json' -d '{"action":"finish_cluster"}' || true
`,
    validateCommand: "curl -fsS http://admin:change-me@127.0.0.1:5984/_membership",
    health: "curl -fsS http://admin:change-me@127.0.0.1:5984/_up"
  });
}

function simpleReplicatedContainerVariant(title, filePrefix, summary) {
  return {
    title,
    filePrefix,
    steps: containerHaSteps,
    summary,
    supportNote: summary
  };
}

function catalogTarget(def, index) {
  const tech = slug(def.displayName).replaceAll("_", "-");
  return {
    label: `${tech}-single-01`,
    role: def.role ?? "app",
    vmName: `${tech}-single-01`,
    ip: "10.0.0.50",
    cores: def.cores ?? 4,
    memory: def.memory ?? 8192,
    diskGb: def.diskGb ?? "80"
  };
}

function catalogNodes(def, index) {
  const tech = slug(def.displayName).replaceAll("_", "-");
  const count = def.haCount ?? 3;
  return Array.from({ length: count }, (_, itemIndex) => ({
    label: `${tech}-${String(itemIndex + 1).padStart(2, "0")}`,
    role: def.role ?? "member",
    vmName: `${tech}-${String(itemIndex + 1).padStart(2, "0")}`,
    ip: `10.0.0.${11 + itemIndex}`,
    cores: def.haCores ?? def.cores ?? 4,
    memory: def.haMemory ?? def.memory ?? 8192,
    diskGb: def.haDiskGb ?? def.diskGb ?? "80"
  }));
}

function catalogVariantNodes(def, variant) {
  const tech = slug(def.displayName).replaceAll("_", "-");
  const groups = variant.nodeGroups ?? [
    {
      role: def.role ?? "member",
      labelPrefix: tech,
      vmNamePrefix: tech,
      count: variant.haCount ?? def.haCount ?? 3
    }
  ];
  return groups.flatMap((group) => Array.from({ length: group.count }, (_, itemIndex) => {
    const ordinal = String(itemIndex + 1).padStart(2, "0");
    const labelPrefix = group.labelPrefix ?? `${tech}-${group.role.replaceAll("_", "-")}`;
    const vmNamePrefix = group.vmNamePrefix ?? labelPrefix;
    return {
      label: `${labelPrefix}-${ordinal}`,
      role: group.role,
      vmName: `${vmNamePrefix}-${ordinal}`,
      ip: `10.0.0.${11 + itemIndex}`,
      cores: group.cores ?? variant.haCores ?? def.haCores ?? def.cores ?? 4,
      memory: group.memory ?? variant.haMemory ?? def.haMemory ?? def.memory ?? 8192,
      diskGb: group.diskGb ?? variant.haDiskGb ?? def.haDiskGb ?? def.diskGb ?? "80"
    };
  }));
}

function catalogStack(def, index) {
  const target = catalogTarget(def, index);
  const haVariants = (def.haVariants ?? []).map((variant) => {
    const nodes = catalogVariantNodes(def, variant);
    return {
      title: variant.title ?? `${def.displayName} HA`,
      filePrefix: variant.filePrefix ?? "ha-cluster",
      nodes,
      get steps() { return variant.steps(def, this.nodes, variant); },
      health: variant.health ?? def.haHealth ?? def.health,
      supportNote: variant.supportNote ?? ""
    };
  });
  return {
    displayName: def.displayName,
    category: def.category,
    domain: def.domain ?? "apps.example.internal",
    gateway: "10.0.0.1",
    defaultCores: def.cores ?? 4,
    defaultMemory: def.memory ?? 8192,
    defaultDiskGb: def.diskGb ?? "80",
    variables: [
      variable("var-0", "environment", "payload.environment", "production"),
      variable("var-1", "service_name", "payload.service_name", slug(def.displayName).replaceAll("_", "-"))
    ],
    single: {
      filePrefix: def.singleFilePrefix ?? "single-node",
      target,
      existingHost: "10.0.0.50",
      steps: containerSingleSteps(def),
      health: def.health
    },
    haVariants,
    haUnsupportedReason: def.haUnsupportedReason
  };
}

function catalogHaProfiles(def) {
  const profiles = {
    mysql: [mysqlGroupReplicationVariant()],
    mariadb: [mariadbGaleraVariant()],
    mongodb: [mongodbReplicaSetVariant()],
    cassandra: [cassandraRingVariant()],
    scylladb: [scyllaRingVariant()],
    clickhouse: [clickHouseKeeperVariant()],
    cockroachdb: [cockroachClusterVariant()],
    yugabytedb: [yugabyteClusterVariant()],
    couchdb: [couchdbClusterVariant()],
    victoriametrics: [victoriaMetricsClusterVariant()],
    opensearch: [opensearchClusterVariant()],
    elasticsearch: [elasticsearchClusterVariant()],
    minio: [minioDistributedVariant()],
    etcd: [etcdClusterVariant()],
    consul: [consulClusterVariant()],
    nats: [natsJetStreamClusterVariant()],
    redpanda: [redpandaClusterVariant()],
    nginx: [statelessActiveActiveVariant("Nginx Active-Active Web HA", "active-active-ha", "Two Nginx nodes run the same stateless web tier behind an external load balancer or DNS load-sharing layer.")],
    httpd: [statelessActiveActiveVariant("Apache HTTPD Active-Active Web HA", "active-active-ha", "Two Apache HTTPD nodes run the same stateless web tier behind an external load balancer or DNS load-sharing layer.")],
    haproxy: [statelessActiveActiveVariant("HAProxy Active-Active Edge HA", "active-active-ha", "Two HAProxy nodes run the same edge configuration so upstream routing can fail over through external VIP, BGP, or DNS control.")],
    traefik: [statelessActiveActiveVariant("Traefik Active-Active Ingress HA", "active-active-ha", "Two Traefik ingress nodes run stateless active-active routing and are intended to sit behind an external VIP, BGP, or DNS control layer.")],
    vault: [vaultRaftVariant()],
    rethinkdb: [rethinkdbClusterVariant()],
    valkey: [valkeySentinelVariant(), valkeyClusterVariant()],
    solr: [],
    typesense: [typesenseClusterVariant()],
    weaviate: [weaviateClusterVariant()],
    zookeeper: [zookeeperEnsembleVariant()],
    seaweedfs: [seaweedFsClusterVariant()]
  };
  return profiles[def.serviceName] ?? [];
}

function catalogHaUnsupportedReason(def) {
  const reasons = {
    timescaledb: "Not generated in this catalog scope; TimescaleDB HA should be built on the PostgreSQL Patroni pattern with extension/package hardening.",
    neo4j: "Not generated for the community container profile; Neo4j clustering is an enterprise topology and not catalog-safe here.",
    influxdb: "Not generated; the OSS InfluxDB v2 container profile does not provide a built-in clustered HA topology.",
    questdb: "Not generated; this OSS single-node profile does not expose a catalog-safe native HA topology.",
    pulsar: "Not generated from the standalone profile; production HA requires separate ZooKeeper, BookKeeper, broker, and proxy roles.",
    artemis: "Not generated; live/backup or broker-cluster HA requires topology-specific storage and quorum decisions outside this generic container profile.",
    jenkins: "Not generated; Jenkins controller active-active HA is not appropriate for this single-controller OSS profile.",
    gitlab: "Not generated; GitLab CE HA requires a larger reference architecture with external PostgreSQL, Redis, Gitaly, Praefect, and load balancers.",
    nexus: "Not generated; Nexus Repository HA is not available for this OSS-style single-node catalog profile.",
    sonarqube: "Not generated; SonarQube HA requires Data Center style topology, not the community container profile.",
    keycloak: "Not generated from the start-dev profile; production Keycloak HA requires external database/cache, TLS, and hostname hardening.",
    loki: "Not generated from the local-config profile; Loki HA requires distributed read/write/backend or simple-scalable mode plus object storage.",
    tempo: "Not generated from the local single-binary profile; Tempo HA requires distributed roles and object storage.",
    mssql: "Not generated; SQL Server Always On requires domain, listener, licensing, and storage decisions outside this container example.",
    "oracle-free": "Not generated; Oracle RAC/Data Guard style HA is not appropriate for the Oracle Free single-container profile.",
    firebird: "Not generated; this Firebird container profile has no built-in catalog-safe HA clustering mode.",
    arangodb: "Not generated from the single-server profile; ArangoDB HA requires agency, coordinator, and DB-server role separation.",
    memcached: "Not generated; Memcached HA is client-side sharding/replication rather than a server-side clustered workflow.",
    dragonflydb: "Not generated; cluster/replication behavior is version and deployment-mode sensitive for this generic image.",
    solr: "Not generated from the standalone profile; SolrCloud HA requires an explicit ZooKeeper ensemble and collection bootstrap plan.",
    meilisearch: "Not generated; this OSS single-node profile does not provide a built-in clustered HA topology.",
    qdrant: "Not generated from the standalone profile; distributed Qdrant bootstrapping is version-sensitive and should be explicit per release.",
    milvus: "Not generated from the standalone profile; Milvus HA requires external etcd, object storage, and message-bus services.",
    chromadb: "Not generated; this ChromaDB profile does not provide a server-side clustered HA topology.",
    grafana: "Not generated from the SQLite-backed profile; Grafana HA requires an external shared database and session/cache strategy.",
    gitea: "Not generated from the single-node profile; Gitea HA requires external database, shared storage, and SSH/HTTP load balancing.",
    drone: "Not generated; this Drone profile is tied to one server/data volume and does not express a catalog-safe HA topology.",
    jaeger: "Not generated from the all-in-one profile; Jaeger HA requires collectors/query nodes plus external storage."
  };
  return reasons[def.serviceName] ?? "No built-in or catalog-safe HA topology is generated for this catalog profile.";
}

function withCatalogHa(def) {
  const haVariants = def.haVariants ?? catalogHaProfiles(def);
  return {
    ...def,
    haVariants,
    haUnsupportedReason: haVariants.length ? undefined : def.haUnsupportedReason ?? catalogHaUnsupportedReason(def)
  };
}

function catalogStacks() {
  const definitions = [
    { displayName: "MySQL", category: "databases/mysql", serviceName: "mysql", image: "mysql:8.4", role: "mysql", ports: ["3306:3306"], env: { MYSQL_ROOT_PASSWORD: "change-me", MYSQL_DATABASE: "app_db", MYSQL_USER: "app_user", MYSQL_PASSWORD: "change-me" }, volumes: ["data:/var/lib/mysql"], health: "docker exec octastack-mysql mysqladmin ping -uroot -pchange-me" },
    { displayName: "MariaDB", category: "databases/mariadb", serviceName: "mariadb", image: "mariadb:11.4", role: "mariadb", ports: ["3306:3306"], env: { MARIADB_ROOT_PASSWORD: "change-me", MARIADB_DATABASE: "app_db", MARIADB_USER: "app_user", MARIADB_PASSWORD: "change-me" }, volumes: ["data:/var/lib/mysql"], health: "docker exec octastack-mariadb mariadb-admin ping -uroot -pchange-me" },
    { displayName: "MongoDB", category: "databases/mongodb", serviceName: "mongodb", image: "mongo:7", role: "mongodb", ports: ["27017:27017"], env: { MONGO_INITDB_ROOT_USERNAME: "root", MONGO_INITDB_ROOT_PASSWORD: "change-me" }, volumes: ["data:/data/db"], health: "docker exec octastack-mongodb mongosh --quiet --eval 'db.adminCommand({ ping: 1 })'" },
    { displayName: "Cassandra", category: "databases/cassandra", serviceName: "cassandra", image: "cassandra:5", role: "cassandra", ports: ["9042:9042"], env: { CASSANDRA_CLUSTER_NAME: "octastack-cassandra" }, volumes: ["data:/var/lib/cassandra"], health: "docker exec octastack-cassandra nodetool status" },
    { displayName: "ScyllaDB", category: "databases/scylladb", serviceName: "scylladb", image: "scylladb/scylla:6.1", role: "scylladb", ports: ["9042:9042"], command: "--smp 2 --memory 4G --overprovisioned 1", volumes: ["data:/var/lib/scylla"], health: "docker exec octastack-scylladb nodetool status" },
    { displayName: "ClickHouse", category: "databases/clickhouse", serviceName: "clickhouse", image: "clickhouse/clickhouse-server:24.8", role: "clickhouse", ports: ["8123:8123", "9000:9000"], env: { CLICKHOUSE_DB: "app_db", CLICKHOUSE_USER: "app_user", CLICKHOUSE_PASSWORD: "change-me" }, volumes: ["data:/var/lib/clickhouse"], health: "curl -fsS 'http://127.0.0.1:8123/ping'" },
    { displayName: "TimescaleDB", category: "databases/timescaledb", serviceName: "timescaledb", image: "timescale/timescaledb:latest-pg16", role: "timescaledb", ports: ["5432:5432"], env: { POSTGRES_PASSWORD: "change-me", POSTGRES_DB: "metrics" }, volumes: ["data:/var/lib/postgresql/data"], health: "docker exec octastack-timescaledb pg_isready -U postgres" },
    { displayName: "CockroachDB", category: "databases/cockroachdb", serviceName: "cockroachdb", image: "cockroachdb/cockroach:v24.2.0", role: "cockroach", ports: ["26257:26257", "8080:8080"], command: "start-single-node --insecure --store=/cockroach/cockroach-data", volumes: ["data:/cockroach/cockroach-data"], health: "docker exec octastack-cockroachdb cockroach sql --insecure --execute='select 1'" },
    { displayName: "YugabyteDB", category: "databases/yugabytedb", serviceName: "yugabytedb", image: "yugabytedb/yugabyte:2.23.0.0-b710", role: "yugabyte", ports: ["5433:5433", "7000:7000", "9000:9000"], command: "bin/yugabyted start --foreground", volumes: ["data:/root/var"], health: "docker exec octastack-yugabytedb bin/ysqlsh -h 127.0.0.1 -c 'select 1;'" },
    { displayName: "Neo4j", category: "databases/neo4j", serviceName: "neo4j", image: "neo4j:5", role: "neo4j", ports: ["7474:7474", "7687:7687"], env: { NEO4J_AUTH: "neo4j/change-me" }, volumes: ["data:/data"], health: "docker exec octastack-neo4j cypher-shell -u neo4j -p change-me 'RETURN 1;'" },
    { displayName: "CouchDB", category: "databases/couchdb", serviceName: "couchdb", image: "couchdb:3", role: "couchdb", ports: ["5984:5984"], env: { COUCHDB_USER: "admin", COUCHDB_PASSWORD: "change-me" }, volumes: ["data:/opt/couchdb/data"], health: "curl -fsS http://admin:change-me@127.0.0.1:5984/_up" },
    { displayName: "InfluxDB", category: "databases/influxdb", serviceName: "influxdb", image: "influxdb:2", role: "influxdb", ports: ["8086:8086"], env: { DOCKER_INFLUXDB_INIT_MODE: "setup", DOCKER_INFLUXDB_INIT_USERNAME: "admin", DOCKER_INFLUXDB_INIT_PASSWORD: "change-me-123", DOCKER_INFLUXDB_INIT_ORG: "octastack", DOCKER_INFLUXDB_INIT_BUCKET: "metrics" }, volumes: ["data:/var/lib/influxdb2"], health: "curl -fsS http://127.0.0.1:8086/health" },
    { displayName: "VictoriaMetrics", category: "databases/victoriametrics", serviceName: "victoriametrics", image: "victoriametrics/victoria-metrics:v1.103.0", role: "victoriametrics", ports: ["8428:8428"], command: "-storageDataPath=/storage", volumes: ["data:/storage"], health: "curl -fsS http://127.0.0.1:8428/health" },
    { displayName: "QuestDB", category: "databases/questdb", serviceName: "questdb", image: "questdb/questdb:8.1.0", role: "questdb", ports: ["9000:9000", "8812:8812", "9009:9009"], volumes: ["data:/var/lib/questdb"], health: "curl -fsS http://127.0.0.1:9000/" },
    { displayName: "OpenSearch", category: "search/opensearch", serviceName: "opensearch", image: "opensearchproject/opensearch:2.17.0", role: "opensearch", ports: ["9200:9200", "9600:9600"], env: { discovery_type: "single-node", OPENSEARCH_INITIAL_ADMIN_PASSWORD: "ChangeMe123!" }, volumes: ["data:/usr/share/opensearch/data"], health: "curl -kfsS -u admin:ChangeMe123! https://127.0.0.1:9200/_cluster/health" },
    { displayName: "Elasticsearch", category: "search/elasticsearch", serviceName: "elasticsearch", image: "docker.elastic.co/elasticsearch/elasticsearch:8.15.0", role: "elasticsearch", ports: ["9200:9200"], env: { discovery_type: "single-node", xpack_security_enabled: "false", ES_JAVA_OPTS: "-Xms1g -Xmx1g" }, volumes: ["data:/usr/share/elasticsearch/data"], health: "curl -fsS http://127.0.0.1:9200/_cluster/health" },
    { displayName: "MinIO", category: "storage/minio", serviceName: "minio", image: "minio/minio:RELEASE.2024-08-29T01-40-52Z", role: "minio", ports: ["9000:9000", "9001:9001"], env: { MINIO_ROOT_USER: "admin", MINIO_ROOT_PASSWORD: "change-me-123456" }, command: "server /data --console-address ':9001'", volumes: ["data:/data"], health: "curl -fsS http://127.0.0.1:9000/minio/health/live" },
    { displayName: "etcd", category: "coordination/etcd", serviceName: "etcd", image: "quay.io/coreos/etcd:v3.5.16", role: "etcd", ports: ["2379:2379", "2380:2380"], command: "etcd --advertise-client-urls=http://0.0.0.0:2379 --listen-client-urls=http://0.0.0.0:2379", volumes: ["data:/etcd-data"], health: "docker exec octastack-etcd etcdctl endpoint health" },
    { displayName: "Consul", category: "coordination/consul", serviceName: "consul", image: "hashicorp/consul:1.19", role: "consul", ports: ["8500:8500", "8600:8600/udp"], command: "agent -server -bootstrap-expect=1 -ui -client=0.0.0.0", volumes: ["data:/consul/data"], health: "curl -fsS http://127.0.0.1:8500/v1/status/leader" },
    { displayName: "NATS JetStream", category: "messaging/nats", serviceName: "nats", image: "nats:2.10", role: "nats", ports: ["4222:4222", "8222:8222"], command: "-js -m 8222", volumes: ["data:/data"], health: "curl -fsS http://127.0.0.1:8222/healthz" },
    { displayName: "Redpanda", category: "messaging/redpanda", serviceName: "redpanda", image: "redpandadata/redpanda:v24.2.3", role: "redpanda", ports: ["9092:9092", "9644:9644"], command: "redpanda start --overprovisioned --smp 1 --memory 2G --reserve-memory 0M --node-id 0 --check=false", volumes: ["data:/var/lib/redpanda/data"], health: "curl -fsS http://127.0.0.1:9644/v1/status/ready" },
    { displayName: "Apache Pulsar", category: "messaging/pulsar", serviceName: "pulsar", image: "apachepulsar/pulsar:3.3.0", role: "pulsar", ports: ["6650:6650", "8080:8080"], command: "bin/pulsar standalone", volumes: ["data:/pulsar/data"], health: "curl -fsS http://127.0.0.1:8080/admin/v2/clusters" },
    { displayName: "ActiveMQ Artemis", category: "messaging/activemq-artemis", serviceName: "artemis", image: "apache/activemq-artemis:latest", role: "artemis", ports: ["61616:61616", "8161:8161"], env: { ARTEMIS_USER: "admin", ARTEMIS_PASSWORD: "change-me" }, volumes: ["data:/var/lib/artemis-instance"], health: "curl -fsS http://127.0.0.1:8161/console/" },
    { displayName: "Nginx", category: "web/nginx", serviceName: "nginx", image: "nginx:1.27", role: "web", ports: ["80:80"], volumes: ["data:/usr/share/nginx/html"], health: "curl -fsS http://127.0.0.1/" },
    { displayName: "Apache HTTPD", category: "web/apache-httpd", serviceName: "httpd", image: "httpd:2.4", role: "web", ports: ["80:80"], volumes: ["data:/usr/local/apache2/htdocs"], health: "curl -fsS http://127.0.0.1/" },
    { displayName: "HAProxy", category: "networking/haproxy", serviceName: "haproxy", image: "haproxy:3.0", role: "load_balancer", ports: ["80:80", "8404:8404"], volumes: ["data:/usr/local/etc/haproxy"], health: "docker ps --filter name=octastack-haproxy" },
    { displayName: "Traefik", category: "networking/traefik", serviceName: "traefik", image: "traefik:v3.1", role: "ingress", ports: ["80:80", "8080:8080"], command: "--api.insecure=true --providers.docker=false --entrypoints.web.address=:80", volumes: ["data:/etc/traefik"], health: "curl -fsS http://127.0.0.1:8080/api/rawdata" },
    { displayName: "Jenkins", category: "devops/jenkins", serviceName: "jenkins", image: "jenkins/jenkins:lts", role: "ci", ports: ["8080:8080", "50000:50000"], volumes: ["data:/var/jenkins_home"], health: "curl -fsS http://127.0.0.1:8080/login" },
    { displayName: "GitLab CE", category: "devops/gitlab-ce", serviceName: "gitlab", image: "gitlab/gitlab-ce:17.3.0-ce.0", role: "gitlab", ports: ["80:80", "443:443", "2222:22"], env: { GITLAB_OMNIBUS_CONFIG: "external_url 'http://gitlab.example.internal'" }, volumes: ["data:/var/opt/gitlab"], health: "docker exec octastack-gitlab gitlab-ctl status" },
    { displayName: "Nexus Repository", category: "devops/nexus-repository", serviceName: "nexus", image: "sonatype/nexus3:3.72.0", role: "artifact_repo", ports: ["8081:8081"], volumes: ["data:/nexus-data"], health: "curl -fsS http://127.0.0.1:8081/service/rest/v1/status" },
    { displayName: "SonarQube", category: "devops/sonarqube", serviceName: "sonarqube", image: "sonarqube:10-community", role: "quality", ports: ["9000:9000"], env: { SONAR_ES_BOOTSTRAP_CHECKS_DISABLE: "true" }, volumes: ["data:/opt/sonarqube/data"], health: "curl -fsS http://127.0.0.1:9000/api/system/status" },
    { displayName: "Keycloak", category: "identity/keycloak", serviceName: "keycloak", image: "quay.io/keycloak/keycloak:25.0", role: "identity", ports: ["8080:8080"], env: { KEYCLOAK_ADMIN: "admin", KEYCLOAK_ADMIN_PASSWORD: "change-me" }, command: "start-dev", volumes: ["data:/opt/keycloak/data"], health: "curl -fsS http://127.0.0.1:8080/realms/master" },
    { displayName: "Vault", category: "security/vault", serviceName: "vault", image: "hashicorp/vault:1.17", role: "vault", ports: ["8200:8200"], env: { VAULT_DEV_ROOT_TOKEN_ID: "change-me", VAULT_DEV_LISTEN_ADDRESS: "0.0.0.0:8200" }, volumes: ["data:/vault/file"], health: "curl -fsS http://127.0.0.1:8200/v1/sys/health || true" },
    { displayName: "Loki", category: "observability/loki", serviceName: "loki", image: "grafana/loki:3.1.0", role: "logs", ports: ["3100:3100"], command: "-config.file=/etc/loki/local-config.yaml", volumes: ["data:/loki"], health: "curl -fsS http://127.0.0.1:3100/ready" },
    { displayName: "Tempo", category: "observability/tempo", serviceName: "tempo", image: "grafana/tempo:2.6.0", role: "traces", ports: ["3200:3200", "4317:4317"], command: "-config.file=/etc/tempo.yaml", volumes: ["data:/tmp/tempo"], health: "curl -fsS http://127.0.0.1:3200/ready" },
    { displayName: "Microsoft SQL Server", category: "databases/mssql", serviceName: "mssql", image: "mcr.microsoft.com/mssql/server:2022-latest", role: "mssql", ports: ["1433:1433"], env: { ACCEPT_EULA: "Y", MSSQL_SA_PASSWORD: "ChangeMe123!" }, volumes: ["data:/var/opt/mssql"], health: "docker exec octastack-mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P ChangeMe123! -C -Q 'SELECT 1'" },
    { displayName: "Oracle Database Free", category: "databases/oracle-free", serviceName: "oracle-free", image: "gvenzl/oracle-free:23-slim", role: "oracle", ports: ["1521:1521"], env: { ORACLE_PASSWORD: "ChangeMe123!" }, volumes: ["data:/opt/oracle/oradata"], health: "docker exec octastack-oracle-free healthcheck.sh" },
    { displayName: "Firebird", category: "databases/firebird", serviceName: "firebird", image: "firebirdsql/firebird:5.0", role: "firebird", ports: ["3050:3050"], env: { FIREBIRD_ROOT_PASSWORD: "change-me" }, volumes: ["data:/firebird/data"], health: "docker ps --filter name=octastack-firebird" },
    { displayName: "ArangoDB", category: "databases/arangodb", serviceName: "arangodb", image: "arangodb:3.12", role: "arangodb", ports: ["8529:8529"], env: { ARANGO_ROOT_PASSWORD: "change-me" }, volumes: ["data:/var/lib/arangodb3"], health: "curl -fsS http://root:change-me@127.0.0.1:8529/_api/version" },
    { displayName: "RethinkDB", category: "databases/rethinkdb", serviceName: "rethinkdb", image: "rethinkdb:2.4", role: "rethinkdb", ports: ["28015:28015", "8080:8080"], volumes: ["data:/data"], health: "curl -fsS http://127.0.0.1:8080/" },
    { displayName: "Memcached", category: "cache/memcached", serviceName: "memcached", image: "memcached:1.6", role: "cache", ports: ["11211:11211"], command: "memcached -m 256", volumes: ["data:/tmp"], health: "docker exec octastack-memcached sh -lc 'echo version | nc 127.0.0.1 11211 || true'" },
    { displayName: "Valkey", category: "cache/valkey", serviceName: "valkey", image: "valkey/valkey:8", role: "cache", ports: ["6379:6379"], volumes: ["data:/data"], health: "docker exec octastack-valkey valkey-cli ping" },
    { displayName: "DragonflyDB", category: "cache/dragonflydb", serviceName: "dragonflydb", image: "docker.dragonflydb.io/dragonflydb/dragonfly:latest", role: "cache", ports: ["6379:6379"], volumes: ["data:/data"], health: "docker exec octastack-dragonflydb redis-cli ping" },
    { displayName: "Apache Solr", category: "search/solr", serviceName: "solr", image: "solr:9", role: "search", ports: ["8983:8983"], volumes: ["data:/var/solr"], health: "curl -fsS http://127.0.0.1:8983/solr/admin/info/system" },
    { displayName: "Meilisearch", category: "search/meilisearch", serviceName: "meilisearch", image: "getmeili/meilisearch:v1.10", role: "search", ports: ["7700:7700"], env: { MEILI_MASTER_KEY: "change-me" }, volumes: ["data:/meili_data"], health: "curl -fsS http://127.0.0.1:7700/health" },
    { displayName: "Typesense", category: "search/typesense", serviceName: "typesense", image: "typesense/typesense:27.1", role: "search", ports: ["8108:8108"], command: "--data-dir /data --api-key=change-me --enable-cors", volumes: ["data:/data"], health: "curl -fsS http://127.0.0.1:8108/health" },
    { displayName: "Qdrant", category: "vector/qdrant", serviceName: "qdrant", image: "qdrant/qdrant:v1.11.0", role: "vector", ports: ["6333:6333", "6334:6334"], volumes: ["data:/qdrant/storage"], health: "curl -fsS http://127.0.0.1:6333/healthz" },
    { displayName: "Weaviate", category: "vector/weaviate", serviceName: "weaviate", image: "semitechnologies/weaviate:1.26.1", role: "vector", ports: ["8080:8080"], env: { QUERY_DEFAULTS_LIMIT: "25", AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: "true", PERSISTENCE_DATA_PATH: "/var/lib/weaviate", DEFAULT_VECTORIZER_MODULE: "none", CLUSTER_HOSTNAME: "node1" }, volumes: ["data:/var/lib/weaviate"], health: "curl -fsS http://127.0.0.1:8080/v1/.well-known/ready" },
    { displayName: "Milvus", category: "vector/milvus", serviceName: "milvus", image: "milvusdb/milvus:v2.4.6", role: "vector", ports: ["19530:19530", "9091:9091"], command: "milvus run standalone", volumes: ["data:/var/lib/milvus"], health: "curl -fsS http://127.0.0.1:9091/healthz" },
    { displayName: "ChromaDB", category: "vector/chromadb", serviceName: "chromadb", image: "chromadb/chroma:0.5.5", role: "vector", ports: ["8000:8000"], volumes: ["data:/chroma/chroma"], health: "curl -fsS http://127.0.0.1:8000/api/v1/heartbeat" },
    { displayName: "ZooKeeper", category: "coordination/zookeeper", serviceName: "zookeeper", image: "zookeeper:3.9", role: "zookeeper", ports: ["2181:2181"], volumes: ["data:/data"], health: "docker exec octastack-zookeeper zkServer.sh status || true" },
    { displayName: "SeaweedFS", category: "storage/seaweedfs", serviceName: "seaweedfs", image: "chrislusf/seaweedfs:3.73", role: "object_storage", ports: ["9333:9333", "8333:8333"], command: "server -dir=/data -s3", volumes: ["data:/data"], health: "curl -fsS http://127.0.0.1:9333/cluster/status" },
    { displayName: "Grafana", category: "observability/grafana", serviceName: "grafana", image: "grafana/grafana:11.1.0", role: "dashboard", ports: ["3000:3000"], env: { GF_SECURITY_ADMIN_PASSWORD: "change-me" }, volumes: ["data:/var/lib/grafana"], health: "curl -fsS http://127.0.0.1:3000/api/health" },
    { displayName: "Gitea", category: "devops/gitea", serviceName: "gitea", image: "gitea/gitea:1.22", role: "git", ports: ["3000:3000", "2222:22"], volumes: ["data:/data"], health: "curl -fsS http://127.0.0.1:3000/" },
    { displayName: "Drone CI", category: "devops/drone", serviceName: "drone", image: "drone/drone:2", role: "ci", ports: ["8080:80"], env: { DRONE_GITEA_SERVER: "http://gitea.example.internal", DRONE_RPC_SECRET: "change-me", DRONE_SERVER_HOST: "drone.example.internal", DRONE_SERVER_PROTO: "http" }, volumes: ["data:/data"], health: "curl -fsS http://127.0.0.1:8080/healthz" },
    { displayName: "Jaeger", category: "observability/jaeger", serviceName: "jaeger", image: "jaegertracing/all-in-one:1.60", role: "traces", ports: ["16686:16686", "4317:4317"], env: { COLLECTOR_OTLP_ENABLED: "true" }, volumes: ["data:/badger"], health: "curl -fsS http://127.0.0.1:16686/" }
  ];
  return definitions.map((definition, index) => catalogStack(withCatalogHa(definition), index + 80));
}

const stacks = [
  {
    displayName: "PostgreSQL",
    category: "databases/postgresql",
    domain: "db.example.internal",
    gateway: "10.0.0.1",
    defaultCores: 4,
    defaultMemory: 8192,
    defaultDiskGb: "100",
    variables: [
      variable("var-0", "cluster_name", "payload.cluster_name", "pg-prod"),
      variable("var-1", "environment", "payload.environment", "production")
    ],
    single: {
      filePrefix: "single-node",
      target: { label: "postgres-single-01", role: "postgres", vmName: "pg-single-01", ip: "10.0.0.50", cores: 4, memory: 8192, diskGb: "100" },
      existingHost: "10.0.0.50",
      install: pgSingleInstall(),
      get steps() { return legacyScriptSteps("PostgreSQL single-node", this.install); },
      health: "pg_isready -h 127.0.0.1 -p 5432 && sudo -u postgres psql -c 'SELECT version();'"
    },
    ha: {
      title: "PostgreSQL Patroni etcd HA",
      filePrefix: "ha-patroni-etcd",
      nodes: [
        { label: "etcd-01", role: "etcd", vmName: "pg-etcd-01", ip: "10.0.0.11", cores: 2, memory: 4096, diskGb: "40" },
        { label: "etcd-02", role: "etcd", vmName: "pg-etcd-02", ip: "10.0.0.12", cores: 2, memory: 4096, diskGb: "40" },
        { label: "etcd-03", role: "etcd", vmName: "pg-etcd-03", ip: "10.0.0.13", cores: 2, memory: 4096, diskGb: "40" },
        { label: "pg-01", role: "postgres", vmName: "pg-ha-01", ip: "10.0.0.21", cores: 4, memory: 8192, diskGb: "150" },
        { label: "pg-02", role: "postgres", vmName: "pg-ha-02", ip: "10.0.0.22", cores: 4, memory: 8192, diskGb: "150" },
        { label: "pg-03", role: "postgres", vmName: "pg-ha-03", ip: "10.0.0.23", cores: 4, memory: 8192, diskGb: "150" },
        { label: "pg-lb-01", role: "load_balancer", vmName: "pg-lb-01", ip: "10.0.0.31", cores: 2, memory: 2048, diskGb: "30" },
        { label: "pg-lb-02", role: "load_balancer", vmName: "pg-lb-02", ip: "10.0.0.32", cores: 2, memory: 2048, diskGb: "30" }
      ],
      get install() { return pgHaInstall(this.nodes); },
      get steps() { return legacyScriptSteps(this.title, this.install); },
      health: "curl -fsS http://10.0.0.21:8008/health && curl -fsS http://10.0.0.31:5432 || true"
    }
  },
  {
    displayName: "Redis",
    category: "cache/redis",
    domain: "cache.example.internal",
    gateway: "10.0.64.1",
    defaultCores: 2,
    defaultMemory: 4096,
    defaultDiskGb: "40",
    variables: [
      variable("var-0", "cluster_name", "payload.cluster_name", "redis-prod"),
      variable("var-1", "environment", "payload.environment", "production")
    ],
    single: {
      filePrefix: "single-node",
      target: { label: "redis-single-01", role: "redis", vmName: "redis-single-01", ip: "10.0.64.50", cores: 2, memory: 4096, diskGb: "40" },
      existingHost: "10.0.64.50",
      install: redisSingleInstall(),
      get steps() { return legacyScriptSteps("Redis single-node", this.install); },
      health: "redis-cli -h 127.0.0.1 -p 6379 PING"
    },
    haVariants: [
      {
        title: "Redis Sentinel HA",
        filePrefix: "sentinel-ha",
        nodes: [
          { label: "redis-01", role: "redis", vmName: "redis-ha-01", ip: "10.0.64.11", cores: 2, memory: 4096, diskGb: "50" },
          { label: "redis-02", role: "redis", vmName: "redis-ha-02", ip: "10.0.64.12", cores: 2, memory: 4096, diskGb: "50" },
          { label: "redis-03", role: "redis", vmName: "redis-ha-03", ip: "10.0.64.13", cores: 2, memory: 4096, diskGb: "50" }
        ],
        get install() { return redisHaInstall(this.nodes); },
        get steps() { return legacyScriptSteps(this.title, this.install); },
        health: "redis-cli -h 10.0.64.11 -p 26379 sentinel master redis-ha"
      },
      {
        title: "Redis Cluster HA",
        filePrefix: "cluster-ha",
        nodes: [
          { label: "redis-cluster-01", role: "redis", vmName: "redis-cluster-01", ip: "10.0.64.11", cores: 2, memory: 4096, diskGb: "50" },
          { label: "redis-cluster-02", role: "redis", vmName: "redis-cluster-02", ip: "10.0.64.12", cores: 2, memory: 4096, diskGb: "50" },
          { label: "redis-cluster-03", role: "redis", vmName: "redis-cluster-03", ip: "10.0.64.13", cores: 2, memory: 4096, diskGb: "50" },
          { label: "redis-cluster-04", role: "redis", vmName: "redis-cluster-04", ip: "10.0.64.14", cores: 2, memory: 4096, diskGb: "50" },
          { label: "redis-cluster-05", role: "redis", vmName: "redis-cluster-05", ip: "10.0.64.15", cores: 2, memory: 4096, diskGb: "50" },
          { label: "redis-cluster-06", role: "redis", vmName: "redis-cluster-06", ip: "10.0.64.16", cores: 2, memory: 4096, diskGb: "50" }
        ],
        get install() { return redisClusterInstall(this.nodes); },
        get steps() { return legacyScriptSteps(this.title, this.install); },
        health: "redis-cli -h 10.0.64.11 -p 6379 cluster info"
      }
    ]
  },
  {
    displayName: "Kafka",
    category: "messaging/kafka",
    domain: "msg.example.internal",
    gateway: "10.0.80.1",
    defaultCores: 4,
    defaultMemory: 8192,
    defaultDiskGb: "100",
    variables: [
      variable("var-0", "cluster_name", "payload.cluster_name", "kafka-prod"),
      variable("var-1", "environment", "payload.environment", "production")
    ],
    single: {
      filePrefix: "kraft-single-node",
      target: { label: "kafka-single-01", role: "broker", vmName: "kafka-single-01", ip: "10.0.80.50", cores: 4, memory: 8192, diskGb: "100" },
      existingHost: "10.0.80.50",
      install: kafkaSingleInstall(),
      get steps() { return legacyScriptSteps("Kafka single-node", this.install); },
      health: "/opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server 127.0.0.1:9092"
    },
    ha: {
      title: "Kafka KRaft HA",
      filePrefix: "kraft-ha",
      nodes: [
        { label: "kafka-01", role: "broker", vmName: "kafka-ha-01", ip: "10.0.80.11", cores: 4, memory: 8192, diskGb: "150" },
        { label: "kafka-02", role: "broker", vmName: "kafka-ha-02", ip: "10.0.80.12", cores: 4, memory: 8192, diskGb: "150" },
        { label: "kafka-03", role: "broker", vmName: "kafka-ha-03", ip: "10.0.80.13", cores: 4, memory: 8192, diskGb: "150" }
      ],
      get install() { return kafkaHaInstall(this.nodes); },
      get steps() { return legacyScriptSteps(this.title, this.install); },
      health: "/opt/kafka/bin/kafka-metadata-quorum.sh --bootstrap-server 10.0.80.11:9092 describe --status"
    }
  },
  {
    displayName: "RabbitMQ",
    category: "messaging/rabbitmq",
    domain: "msg.example.internal",
    gateway: "10.0.81.1",
    defaultCores: 2,
    defaultMemory: 4096,
    defaultDiskGb: "60",
    variables: [
      variable("var-0", "cluster_name", "payload.cluster_name", "rabbitmq-prod"),
      variable("var-1", "environment", "payload.environment", "production")
    ],
    single: {
      filePrefix: "single-node",
      target: { label: "rabbitmq-single-01", role: "rabbitmq", vmName: "rabbitmq-single-01", ip: "10.0.81.50", cores: 2, memory: 4096, diskGb: "60" },
      existingHost: "10.0.81.50",
      install: rabbitSingleInstall(),
      get steps() { return legacyScriptSteps("RabbitMQ single-node", this.install); },
      health: "sudo rabbitmq-diagnostics ping && sudo rabbitmqctl status"
    },
    ha: {
      title: "RabbitMQ Quorum HA",
      filePrefix: "quorum-ha",
      nodes: [
        { label: "rabbitmq-01", role: "rabbitmq", vmName: "rabbitmq-ha-01", ip: "10.0.81.11", cores: 2, memory: 4096, diskGb: "80" },
        { label: "rabbitmq-02", role: "rabbitmq", vmName: "rabbitmq-ha-02", ip: "10.0.81.12", cores: 2, memory: 4096, diskGb: "80" },
        { label: "rabbitmq-03", role: "rabbitmq", vmName: "rabbitmq-ha-03", ip: "10.0.81.13", cores: 2, memory: 4096, diskGb: "80" }
      ],
      get install() { return rabbitHaInstall(this.nodes); },
      get steps() { return legacyScriptSteps(this.title, this.install); },
      health: "sudo rabbitmq-diagnostics cluster_status"
    }
  },
  {
    displayName: "Vanilla Kubernetes",
    category: "kubernetes/vanilla",
    domain: "k8s.example.internal",
    gateway: "10.0.96.1",
    defaultCores: 4,
    defaultMemory: 8192,
    defaultDiskGb: "80",
    variables: [
      variable("var-0", "cluster_name", "payload.cluster_name", "k8s-prod"),
      variable("var-1", "pod_cidr", "payload.pod_cidr", "192.168.0.0/16")
    ],
    single: {
      filePrefix: "single-control-plane",
      target: { label: "k8s-cp-single-01", role: "control_plane", vmName: "k8s-single-cp-01", ip: "10.0.96.50", cores: 4, memory: 8192, diskGb: "80" },
      existingHost: "10.0.96.50",
      install: vanillaSingleInstall(),
      get steps() { return legacyScriptSteps("Vanilla Kubernetes single-node", this.install); },
      health: "kubectl get nodes -o wide && kubectl get pods -A"
    },
    ha: {
      title: "Vanilla Kubernetes HA",
      filePrefix: "ha-control-plane",
      nodes: [
        { label: "k8s-cp-01", role: "control_plane", vmName: "k8s-cp-01", ip: "10.0.96.11", cores: 4, memory: 8192, diskGb: "100" },
        { label: "k8s-cp-02", role: "control_plane", vmName: "k8s-cp-02", ip: "10.0.96.12", cores: 4, memory: 8192, diskGb: "100" },
        { label: "k8s-cp-03", role: "control_plane", vmName: "k8s-cp-03", ip: "10.0.96.13", cores: 4, memory: 8192, diskGb: "100" },
        { label: "k8s-worker-01", role: "worker", vmName: "k8s-worker-01", ip: "10.0.96.21", cores: 4, memory: 8192, diskGb: "120" },
        { label: "k8s-worker-02", role: "worker", vmName: "k8s-worker-02", ip: "10.0.96.22", cores: 4, memory: 8192, diskGb: "120" }
      ],
      get install() { return vanillaHaInstall(this.nodes); },
      get steps() { return legacyScriptSteps(this.title, this.install); },
      health: "kubectl --kubeconfig /etc/kubernetes/admin.conf get nodes -o wide"
    }
  },
  {
    displayName: "Rancher RKE2",
    category: "kubernetes/rancher-rke2",
    domain: "rancher.example.internal",
    gateway: "10.0.97.1",
    defaultCores: 4,
    defaultMemory: 8192,
    defaultDiskGb: "100",
    variables: [
      variable("var-0", "cluster_name", "payload.cluster_name", "rke2-prod"),
      variable("var-1", "rancher_hostname", "payload.rancher_hostname", "rancher.example.internal")
    ],
    single: {
      filePrefix: "single-server",
      target: { label: "rke2-single-01", role: "rke2_server", vmName: "rke2-single-01", ip: "10.0.97.50", cores: 4, memory: 8192, diskGb: "100" },
      existingHost: "10.0.97.50",
      install: rke2SingleInstall(),
      get steps() { return legacyScriptSteps("Rancher RKE2 single-node", this.install); },
      health: "sudo /var/lib/rancher/rke2/bin/kubectl --kubeconfig /etc/rancher/rke2/rke2.yaml get nodes -o wide"
    },
    ha: {
      title: "Rancher RKE2 HA",
      filePrefix: "ha-server-agent",
      nodes: [
        { label: "rke2-server-01", role: "rke2_server", vmName: "rke2-server-01", ip: "10.0.97.11", cores: 4, memory: 8192, diskGb: "120" },
        { label: "rke2-server-02", role: "rke2_server", vmName: "rke2-server-02", ip: "10.0.97.12", cores: 4, memory: 8192, diskGb: "120" },
        { label: "rke2-server-03", role: "rke2_server", vmName: "rke2-server-03", ip: "10.0.97.13", cores: 4, memory: 8192, diskGb: "120" },
        { label: "rke2-agent-01", role: "rke2_agent", vmName: "rke2-agent-01", ip: "10.0.97.21", cores: 4, memory: 8192, diskGb: "120" },
        { label: "rke2-agent-02", role: "rke2_agent", vmName: "rke2-agent-02", ip: "10.0.97.22", cores: 4, memory: 8192, diskGb: "120" }
      ],
      get install() { return rke2HaInstall(this.nodes); },
      get steps() { return legacyScriptSteps(this.title, this.install); },
      health: "sudo /var/lib/rancher/rke2/bin/kubectl --kubeconfig /etc/rancher/rke2/rke2.yaml get nodes -o wide"
    }
  },
  {
    displayName: "Prometheus Grafana",
    category: "monitoring/prometheus-grafana",
    domain: "monitoring.example.internal",
    gateway: "10.0.112.1",
    defaultCores: 2,
    defaultMemory: 4096,
    defaultDiskGb: "80",
    variables: [
      variable("var-0", "cluster_name", "payload.cluster_name", "monitoring-prod"),
      variable("var-1", "retention", "payload.retention", "30d")
    ],
    single: {
      filePrefix: "single-node",
      target: { label: "monitoring-single-01", role: "monitoring", vmName: "monitoring-single-01", ip: "10.0.112.50", cores: 2, memory: 4096, diskGb: "80" },
      existingHost: "10.0.112.50",
      install: monitoringSingleInstall(),
      get steps() { return legacyScriptSteps("Prometheus Grafana single-node", this.install); },
      health: "curl -fsS http://127.0.0.1:9090/-/ready && curl -fsS http://127.0.0.1:3000/api/health"
    },
    ha: {
      title: "Prometheus Grafana HA",
      filePrefix: "ha-stack",
      nodes: [
        { label: "prometheus-01", role: "prometheus", vmName: "prometheus-01", ip: "10.0.112.11", cores: 4, memory: 8192, diskGb: "200" },
        { label: "prometheus-02", role: "prometheus", vmName: "prometheus-02", ip: "10.0.112.12", cores: 4, memory: 8192, diskGb: "200" },
        { label: "alertmanager-01", role: "alertmanager", vmName: "alertmanager-01", ip: "10.0.112.21", cores: 2, memory: 2048, diskGb: "40" },
        { label: "alertmanager-02", role: "alertmanager", vmName: "alertmanager-02", ip: "10.0.112.22", cores: 2, memory: 2048, diskGb: "40" },
        { label: "alertmanager-03", role: "alertmanager", vmName: "alertmanager-03", ip: "10.0.112.23", cores: 2, memory: 2048, diskGb: "40" },
        { label: "grafana-01", role: "grafana", vmName: "grafana-01", ip: "10.0.112.31", cores: 2, memory: 4096, diskGb: "60" },
        { label: "grafana-02", role: "grafana", vmName: "grafana-02", ip: "10.0.112.32", cores: 2, memory: 4096, diskGb: "60" }
      ],
      get install() { return monitoringHaInstall(this.nodes); },
      get steps() { return legacyScriptSteps(this.title, this.install); },
      health: "curl -fsS http://10.0.112.11:9090/-/ready && curl -fsS http://10.0.112.31:3000/api/health"
    }
  },
  ...catalogStacks()
];

applyNetworkPlan(stacks);

function validateWorkflow(workflow, fileName) {
  const errors = [];
  const nodeIds = new Set();
  const nodesById = new Map();
  for (const n of workflow.nodes ?? []) {
    if (!n.id || !n.type || !n.position || n.data === undefined) {
      errors.push(`${fileName}: node is missing id/type/position/data`);
    }
    if (n.position && !hasNumericPosition(n)) {
      errors.push(`${fileName}: node ${n.id} position must contain numeric x/y`);
    }
    if (nodeIds.has(n.id)) {
      errors.push(`${fileName}: duplicate node id ${n.id}`);
    }
    nodeIds.add(n.id);
    nodesById.set(n.id, n);
  }
  errors.push(...validateNodeLayout(workflow.nodes ?? [], fileName));
  if (![...nodesById.values()].some((n) => n.type === "triggerNode")) {
    errors.push(`${fileName}: missing triggerNode`);
  }
  const incoming = new Map([...nodeIds].map((id) => [id, []]));
  const outgoing = new Map([...nodeIds].map((id) => [id, []]));
  const edgeIds = new Set();
  for (const e of workflow.edges ?? []) {
    if (!e.id || !e.source || !e.target || !e.type || !e.mode) {
      errors.push(`${fileName}: edge is missing id/source/target/type/mode`);
    }
    if (edgeIds.has(e.id)) {
      errors.push(`${fileName}: duplicate edge id ${e.id}`);
    }
    edgeIds.add(e.id);
    if (!nodeIds.has(e.source)) {
      errors.push(`${fileName}: edge ${e.id} source does not exist`);
    }
    if (!nodeIds.has(e.target)) {
      errors.push(`${fileName}: edge ${e.id} target does not exist`);
    }
    if (!["sequential", "parallel"].includes(e.mode)) {
      errors.push(`${fileName}: edge ${e.id} has invalid mode ${e.mode}`);
    }
    incoming.get(e.target)?.push(e);
    outgoing.get(e.source)?.push(e);
  }
  for (const n of nodesById.values()) {
    if (n.type === "triggerNode" && incoming.get(n.id)?.length) {
      errors.push(`${fileName}: triggerNode ${n.id} has incoming edge`);
    }
    if (n.type === "endNode" && outgoing.get(n.id)?.length) {
      errors.push(`${fileName}: endNode ${n.id} has outgoing edge`);
    }
  }
  for (const [source, edges] of outgoing.entries()) {
    const sequential = edges.filter((e) => e.mode === "sequential");
    const orders = new Set();
    for (const e of sequential) {
      if (!Number.isInteger(e.order) || e.order <= 0) {
        errors.push(`${fileName}: sequential edge ${e.id} has invalid order`);
      }
      if (orders.has(e.order)) {
        errors.push(`${fileName}: source ${source} has duplicate sequential order ${e.order}`);
      }
      orders.add(e.order);
    }
  }
  function hasUpstream(startId, type) {
    const seen = new Set();
    const stack = [...(incoming.get(startId) ?? []).map((e) => e.source)];
    while (stack.length) {
      const current = stack.pop();
      if (seen.has(current)) continue;
      seen.add(current);
      if (nodesById.get(current)?.type === type) return true;
      stack.push(...(incoming.get(current) ?? []).map((e) => e.source));
    }
    return false;
  }
  for (const n of nodesById.values()) {
    if (n.type === "provisionNode" && !hasUpstream(n.id, "proxmoxConfigNode")) {
      errors.push(`${fileName}: provisionNode ${n.id} lacks upstream proxmoxConfigNode`);
    }
    if (n.type === "destroyNode" && !hasUpstream(n.id, "provisionNode")) {
      errors.push(`${fileName}: destroyNode ${n.id} lacks upstream provisionNode`);
    }
    if (n.type === "waitUntilUpNode" && !hasUpstream(n.id, "provisionNode") && !hasUpstream(n.id, "serverNode")) {
      errors.push(`${fileName}: waitUntilUpNode ${n.id} lacks upstream provisionNode/serverNode`);
    }
    if (["configureNode", "actionNode", "configCommandNode", "configFileNode", "configPackageNode", "configServiceNode"].includes(n.type)) {
      if (!hasUpstream(n.id, "provisionNode") && !hasUpstream(n.id, "serverNode")) {
        errors.push(`${fileName}: ${n.type} ${n.id} lacks upstream provisionNode/serverNode`);
      }
    }
  }
  return errors;
}

function writeWorkflowPackage(filePath, entry) {
  const errors = validateWorkflow(entry.workflow, path.relative(ROOT, filePath));
  if (errors.length) {
    throw new Error(errors.join("\n"));
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(workflowPackage(entry), null, 2) + "\n");
}

function workflowEntries() {
  const entries = [];
  for (const stack of stacks) {
    entries.push({
      stack,
      mode: "single-node",
      provisioning: "provisioned",
      fileName: `${stack.single.filePrefix}-provisioned.json`,
      workflow: createSingleProvisionedWorkflow(stack),
      name: `${stack.displayName} single-node provisioned`,
      description: `Provision a single ${stack.displayName} node on Proxmox, wait for reachability, then install and validate the stack.`
    });
    entries.push({
      stack,
      mode: "single-node",
      provisioning: "existing",
      fileName: `${stack.single.filePrefix}-existing.json`,
      workflow: createSingleExistingWorkflow(stack),
      name: `${stack.displayName} single-node existing`,
      description: `Install and validate ${stack.displayName} on an existing single host.`
    });
    for (const ha of stackHaVariants(stack)) {
      entries.push({
        stack,
        ha,
        mode: "high-availability",
        provisioning: "provisioned",
        fileName: `${ha.filePrefix}-provisioned.json`,
        workflow: createHaProvisionedWorkflow(stack, ha),
        name: `${ha.title} provisioned`,
        description: `Provision ${ha.title} nodes on Proxmox, wait for reachability, then bootstrap and validate the HA stack.`
      });
      entries.push({
        stack,
        ha,
        mode: "high-availability",
        provisioning: "existing",
        fileName: `${ha.filePrefix}-existing.json`,
        workflow: createHaExistingWorkflow(stack, ha),
        name: `${ha.title} existing`,
        description: `Bootstrap and validate ${ha.title} across existing member nodes with bash command steps.`
      });
    }
  }
  return entries;
}

function workflowPackage(entry) {
  return {
    kind: WORKFLOW_PACKAGE_KIND,
    version: WORKFLOW_PACKAGE_VERSION,
    exportedAt: EXPORTED_AT,
    workflow: {
      name: entry.name,
      description: entry.description,
      graphData: entry.workflow
    },
    dependencies: {
      templates: [],
      customNodes: []
    }
  };
}

function uniqueStacksFromEntries(entries) {
  const uniqueStacks = [];
  const seenStacks = new Set();
  for (const entry of entries) {
    if (seenStacks.has(entry.stack.category)) {
      continue;
    }
    seenStacks.add(entry.stack.category);
    uniqueStacks.push(entry.stack);
  }
  return uniqueStacks;
}

function topologyDocRelativePath(stack) {
  return path.posix.join("topologies", `${stack.category}.md`);
}

function topologyDocIndexLink(stack) {
  return path.posix.relative("topologies", topologyDocRelativePath(stack));
}

function workflowRelativePath(entry) {
  return path.posix.join("workflows", entry.stack.category, entry.fileName);
}

function workflowLinkFromTopologyDoc(stack, entry) {
  const docDir = path.posix.dirname(topologyDocRelativePath(stack));
  return path.posix.relative(docDir, workflowRelativePath(entry));
}

function markdownTableCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", "<br>");
}

function mermaidText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\n", " ");
}

function mermaidLabel(lines) {
  return lines.map(mermaidText).join("<br/>");
}

function singleNodeTopologyMermaid(stack) {
  const target = stack.single.target;
  const lines = [
    "flowchart LR",
    `  workflow["${mermaidLabel(["OctaStack workflow", "provisioned or existing"])}"]`,
    `  gateway["${mermaidLabel(["Gateway", stack.network.gateway])}"]`,
    `  single["${mermaidLabel([target.label, target.role, target.ip])}"]`,
    `  health["${mermaidLabel(["Health check", stack.displayName])}"]`,
    "  workflow --> gateway",
    "  gateway --> single",
    "  single --> health"
  ];
  return lines.join("\n");
}

function haTopologyMermaid(stack, ha) {
  const lines = [
    "flowchart LR",
    `  workflow["${mermaidLabel(["OctaStack workflow", "provisioned or existing"])}"]`,
    `  gateway["${mermaidLabel(["Gateway", stack.network.gateway])}"]`,
    `  subgraph stack_block["${mermaidText(`${ha.title} - ${stack.network.stackCidr}`)}"]`,
    "    direction LR"
  ];
  const byRole = new Map();
  ha.nodes.forEach((target, index) => {
    if (!byRole.has(target.role)) {
      byRole.set(target.role, []);
    }
    byRole.get(target.role).push({ ...target, nodeId: `n${index}` });
  });
  let roleIndex = 0;
  for (const [role, targets] of byRole.entries()) {
    lines.push(`    subgraph role_${roleIndex}["${mermaidText(role)}"]`);
    lines.push("      direction TB");
    for (const target of targets) {
      lines.push(`      ${target.nodeId}["${mermaidLabel([target.label, target.ip])}"]`);
    }
    lines.push("    end");
    roleIndex += 1;
  }
  lines.push("  end");
  lines.push("  workflow --> gateway");
  for (const target of ha.nodes) {
    const nodeId = `n${ha.nodes.indexOf(target)}`;
    lines.push(`  gateway --> ${nodeId}`);
  }
  for (const targets of byRole.values()) {
    for (let index = 1; index < targets.length; index += 1) {
      lines.push(`  ${targets[index - 1].nodeId} <-->|peer| ${targets[index].nodeId}`);
    }
  }
  const firstByRole = [...byRole.values()].map((targets) => targets[0]).filter(Boolean);
  for (let index = 1; index < firstByRole.length; index += 1) {
    lines.push(`  ${firstByRole[index - 1].nodeId} -. service path .-> ${firstByRole[index].nodeId}`);
  }
  return lines.join("\n");
}

function workflowTable(entries, stack, predicate) {
  const rows = entries.filter((entry) => entry.stack.category === stack.category && predicate(entry));
  const lines = [
    "| Pattern | Provisioning | Workflow |",
    "| --- | --- | --- |"
  ];
  for (const entry of rows) {
    const rel = workflowLinkFromTopologyDoc(stack, entry);
    lines.push(`| ${entry.mode} | ${entry.provisioning} | [${entry.fileName}](${rel}) |`);
  }
  return lines.join("\n");
}

function inventoryTable(nodes) {
  const lines = [
    "| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |",
    "| --- | --- | --- | --- | --- | --- | --- |"
  ];
  for (const nodeInfo of nodes) {
    lines.push(`| ${markdownTableCell(nodeInfo.label)} | ${markdownTableCell(nodeInfo.role)} | \`${nodeInfo.ip}\` | ${markdownTableCell(nodeInfo.vmName)} | ${nodeInfo.cores ?? ""} | ${nodeInfo.memory ?? ""} | ${nodeInfo.diskGb ?? ""} |`);
  }
  return lines.join("\n");
}

function makeStackTopologyDoc(stack, entries) {
  const lines = [];
  const variants = stackHaVariants(stack);
  lines.push(`# ${stack.displayName} Topology`);
  lines.push("");
  lines.push("This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.");
  lines.push("");
  lines.push("## Stack Summary");
  lines.push("");
  lines.push(`- Domain: \`${topLevelCategory(stack.category)}\``);
  lines.push(`- Workflow path: \`workflows/${stack.category}\``);
  lines.push(`- Stack network: \`${stack.network.stackCidr}\``);
  lines.push(`- Gateway: \`${stack.network.gateway}\``);
  lines.push(`- Single-node IP: \`${stack.single.target.ip}\``);
  lines.push(`- HA status: ${variants.length ? "Generated" : "Not generated"}`);
  if (!variants.length) {
    lines.push(`- HA note: ${stack.haUnsupportedReason || "No built-in or catalog-safe HA topology is generated for this catalog profile."}`);
  }
  lines.push("");
  lines.push("## Single-Node Topology");
  lines.push("");
  lines.push("```mermaid");
  lines.push(singleNodeTopologyMermaid(stack));
  lines.push("```");
  lines.push("");
  lines.push("### Single-Node Inventory");
  lines.push("");
  lines.push(inventoryTable([stack.single.target]));
  lines.push("");
  lines.push("### Single-Node Workflows");
  lines.push("");
  lines.push(workflowTable(entries, stack, (entry) => entry.mode === "single-node"));
  lines.push("");
  lines.push("## High-Availability Topologies");
  lines.push("");
  if (!variants.length) {
    lines.push(stack.haUnsupportedReason || "No high-availability topology is generated for this stack.");
    lines.push("");
  }
  for (const ha of variants) {
    lines.push(`### ${ha.title}`);
    lines.push("");
    lines.push("```mermaid");
    lines.push(haTopologyMermaid(stack, ha));
    lines.push("```");
    lines.push("");
    lines.push("#### HA Inventory");
    lines.push("");
    lines.push(inventoryTable(ha.nodes));
    lines.push("");
    lines.push("#### HA Workflows");
    lines.push("");
    lines.push(workflowTable(entries, stack, (entry) => entry.ha?.title === ha.title));
    lines.push("");
  }
  lines.push("## Addressing Rules");
  lines.push("");
  lines.push("- The stack receives one `/24` from the parent `10.0.0.0/16` plan.");
  lines.push("- `.1` is the example gateway.");
  lines.push("- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.");
  lines.push("- `.50` is reserved for the single-node target.");
  lines.push("");
  return lines.join("\n");
}

function makeTopologyIndex(entries) {
  const lines = [];
  const uniqueStacks = uniqueStacksFromEntries(entries);
  lines.push("# Topology Documentation");
  lines.push("");
  lines.push("This directory contains generated Mermaid topology diagrams for every stack in the workflow library. Each stack document includes the single-node topology, generated HA topologies when available, inventory tables, and links back to the workflow JSON packages.");
  lines.push("");
  lines.push("## Network Plan");
  lines.push("");
  lines.push(`All diagrams use the parent network \`${ROOT_NETWORK_CIDR}\`. Each top-level domain receives a category block, and each stack receives one \`/24\` inside that block.`);
  lines.push("");
  lines.push("| Domain | Category block |");
  lines.push("| --- | --- |");
  for (const block of CATEGORY_IP_BLOCKS) {
    lines.push(`| ${block.category} | \`${block.cidr}\` |`);
  }
  lines.push("");
  lines.push("## Stack Index");
  lines.push("");
  lines.push("| Domain | Stack | Stack block | HA status | Topology document |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const stack of uniqueStacks) {
    const variants = stackHaVariants(stack);
    const docRel = topologyDocIndexLink(stack);
    const haStatus = variants.length ? variants.map((ha) => ha.title).join(", ") : stack.haUnsupportedReason || "Not generated";
    lines.push(`| ${topLevelCategory(stack.category)} | ${markdownTableCell(stack.displayName)} | \`${stack.network.stackCidr}\` | ${markdownTableCell(haStatus)} | [${stack.category}](${docRel}) |`);
  }
  lines.push("");
  return lines.join("\n");
}

function writeTopologyDocs(entries) {
  fs.mkdirSync(TOPOLOGY_ROOT, { recursive: true });
  fs.writeFileSync(path.join(TOPOLOGY_ROOT, "README.md"), makeTopologyIndex(entries));
  for (const stack of uniqueStacksFromEntries(entries)) {
    const rel = topologyDocRelativePath(stack);
    const outPath = path.join(ROOT, rel);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, makeStackTopologyDoc(stack, entries));
  }
}

function makeReadme(entries) {
  const lines = [];
  const categories = [...new Set(entries.map((entry) => entry.stack.category))].sort();
  lines.push("# OctaStack Workflow Example Library");
  lines.push("");
  lines.push("This repository contains ready-to-adapt JSON workflow packages for OctaStack automation imports. The examples follow the package, canonical graph, and validation rules documented in `NODES.md`.");
  lines.push("");
  lines.push("The library is organized by operational domain, then by technology. Every technology includes simple single-node examples. Technologies with a catalog-safe HA topology also include one or more high-availability variants, each available in provisioned and existing-infrastructure modes.");
  lines.push("");
  lines.push("## Provisioning modes");
  lines.push("");
  lines.push("- `*-provisioned.json`: starts with `proxmoxConfigNode`, provisions VMs through `provisionNode`, waits for reachability, then installs/configures the stack.");
  lines.push("- `*-existing.json`: skips VM creation and starts from `serverNode`. Single-node examples target the application host directly. HA examples fan out to the existing member nodes and run bash command steps on each active node context.");
  lines.push("");
  lines.push("## Topology documentation");
  lines.push("");
  lines.push("Generated Mermaid topology documents are available in [topologies/README.md](topologies/README.md). Each stack document includes the single-node topology, generated HA topology diagrams when available, inventory tables, IP allocation, and links back to the workflow JSON packages.");
  lines.push("");
  lines.push("## IP address plan");
  lines.push("");
  lines.push(`All generated examples use the parent network \`${ROOT_NETWORK_CIDR}\`. Each top-level workflow category receives a block inside that parent network, and each stack receives one \`/24\` from its category block.`);
  lines.push("");
  lines.push("Host conventions inside each stack `/24`:");
  lines.push("");
  lines.push("- `.1`: gateway");
  lines.push("- `.11-.49`: HA members, grouped by role in blocks of ten");
  lines.push("- `.50`: single-node target; provisioned and existing variants reuse the same example address");
  lines.push("");
  lines.push("| Category | Category block |");
  lines.push("| --- | --- |");
  for (const block of CATEGORY_IP_BLOCKS) {
    lines.push(`| ${block.category} | \`${block.cidr}\` |`);
  }
  lines.push("");
  lines.push("| Category | Stack | Stack block | Gateway | Single-node IP | HA variants and member IPs |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  const uniqueStacks = uniqueStacksFromEntries(entries);
  for (const stack of uniqueStacks) {
    const haSummary = stackHaVariants(stack)
      .map((ha) => `${ha.title}: ${ha.nodes.map((target) => `\`${target.label}:${target.ip}\``).join(", ")}`)
      .join("<br>");
    lines.push(`| ${topLevelCategory(stack.category)} | ${stack.displayName} | \`${stack.network.stackCidr}\` | \`${stack.network.gateway}\` | \`${stack.single.target.ip}\` | ${haSummary || stack.haUnsupportedReason || "Not generated; no suitable HA topology in this catalog scope."} |`);
  }
  lines.push("");
  lines.push("## HA support matrix");
  lines.push("");
  lines.push("| Domain | Stack | HA workflow status | Variants |");
  lines.push("| --- | --- | --- | --- |");
  for (const stack of stacks) {
    const variants = stackHaVariants(stack);
    lines.push(`| ${topLevelCategory(stack.category)} | ${stack.displayName} | ${variants.length ? "Generated" : "Not generated"} | ${variants.map((ha) => ha.title).join(", ") || stack.haUnsupportedReason || "No built-in or catalog-safe HA topology."} |`);
  }
  lines.push("");
  lines.push("## Catalog");
  lines.push("");
  lines.push("| Domain | Stack | Pattern | Provisioning | File |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const entry of entries) {
    const rel = path.posix.join("workflows", entry.stack.category, entry.fileName);
    lines.push(`| ${entry.stack.category.split("/")[0]} | ${entry.stack.displayName} | ${entry.mode} | ${entry.provisioning} | [${rel}](${rel}) |`);
  }
  lines.push("");
  lines.push("## Directory guide");
  lines.push("");
  lines.push("- `topologies/`: generated Markdown documentation with Mermaid diagrams for every stack topology.");
  for (const category of categories) {
    const stacksInCategory = [...new Set(entries.filter((entry) => entry.stack.category === category).map((entry) => entry.stack.displayName))].join(", ");
    lines.push(`- \`workflows/${category}\`: ${stacksInCategory} examples.`);
  }
  lines.push("");
  lines.push("## Standard conventions");
  lines.push("");
  lines.push("- Every JSON file is an importable workflow package with `kind: \"octastack.workflow.package\"`, `version: 1`, and the graph nested under `workflow.graphData`.");
  lines.push("- Every workflow uses `triggerNode` as the only root entry point.");
  lines.push("- Nodes are generated with a layered layout: linear flows use wide vertical spacing, and HA fan-out branches are distributed horizontally so nodes do not overlap in the editor.");
  lines.push("- Newer catalog examples break installation into multiple small `configCommandNode` steps so each phase can be inspected, retried, or replaced independently.");
  lines.push("- Provisioned examples use `profileId: \"replace-with-proxmox-profile-id\"`; replace it with the real Proxmox profile ID before importing.");
  lines.push("- Template VM IDs default to `9000`; adjust `templateId`, CPU, memory, storage, network bridge, VLAN, and static IP values per environment.");
  lines.push("- All example credentials and secrets use obvious placeholders such as `change-me` and `replace-with-rke2-token`.");
  lines.push("- HA examples prefer odd-number quorum sets where relevant: 3 etcd nodes, 3 Redis Sentinel members, 3 Kafka KRaft voters, 3 RabbitMQ members, and 3 Kubernetes/RKE2 server nodes.");
  lines.push("- HA command steps are plain bash scripts that run on the active target node. They do not install external orchestration tools inside command nodes or wrap shell logic in generated orchestration files.");
  lines.push("- The scripts are intentionally explicit and readable. Treat them as production starting points, then harden package repositories, certificates, secrets, users, backups, firewalls, and storage classes for your environment.");
  lines.push("");
  lines.push("## Validation");
  lines.push("");
  lines.push("Run this after editing generated workflow JSON:");
  lines.push("");
  lines.push("```bash");
  lines.push("node tools/validate-workflows.mjs");
  lines.push("```");
  lines.push("");
  lines.push("The validator checks JSON parseability, unique node and edge IDs, valid edge references, trigger/end rules, context requirements for provision/wait/config nodes, sequential edge ordering, and approximate node layout overlap.");
  lines.push("");
  lines.push("## Regeneration");
  lines.push("");
  lines.push("The example files are generated from `tools/generate-library.mjs` so stack-wide naming and graph conventions stay consistent:");
  lines.push("");
  lines.push("```bash");
  lines.push("node tools/generate-library.mjs");
  lines.push("node tools/validate-workflows.mjs");
  lines.push("```");
  lines.push("");
  return lines.join("\n");
}

fs.rmSync(WORKFLOW_ROOT, { recursive: true, force: true });
fs.rmSync(TOPOLOGY_ROOT, { recursive: true, force: true });
const entries = workflowEntries();
for (const entry of entries) {
  writeWorkflowPackage(path.join(WORKFLOW_ROOT, entry.stack.category, entry.fileName), entry);
}
writeTopologyDocs(entries);
fs.writeFileSync(path.join(ROOT, "README.md"), makeReadme(entries));
console.log(`Generated ${entries.length} workflow examples and ${uniqueStacksFromEntries(entries).length} topology documents.`);
