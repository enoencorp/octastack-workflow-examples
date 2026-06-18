# OctaStack Workflow Node Reference

This document describes the React Flow node types, parameters, runtime behavior, and connection rules used in the OctaStack automation workflow editor. Its purpose is to provide a clear, machine-translatable reference for teaching an AI model to generate correct workflow graphs.

Scope is the main workflow editor:

- Frontend: `frontend/src/app/dashboard/automation/mapping`
- Graph normalization: `frontend/src/lib/workflow-graph.ts`
- Frontend validation: `frontend/src/lib/validateWorkflow.ts`
- Backend runtime: `backend/internal/core/business/orchestrator`
- Trigger synchronization: `backend/internal/core/business/automation/workflow_graph.go`
- ProxAI workflow generation contract: `backend/internal/core/business/proxai/workspace.go`

## 1. Canonical Graph Format

The workflow graph is stored as JSONB with `nodes` and `edges` fields.

```json
{
  "nodes": [
    {
      "id": "node_trigger",
      "type": "triggerNode",
      "position": { "x": 80, "y": 80 },
      "data": {}
    }
  ],
  "edges": [
    {
      "id": "edge_trigger_context",
      "source": "node_trigger",
      "target": "node_context",
      "type": "workflowEdge",
      "mode": "sequential",
      "order": 1,
      "data": {
        "mode": "sequential",
        "order": 1
      }
    }
  ]
}
```

Rules for AI generation:

- In new workflows, the root node must always be `triggerNode`.
- `startNode` is supported as a legacy alias, but it must not be used in new generation.
- Every node must contain `id`, `type`, `position`, and `data`.
- Every edge must contain `id`, `source`, `target`, `type`, and `mode`.
- `mode` must be either `parallel` or `sequential`.
- Positive and unique `order` values must be used for sibling `sequential` edges.
- `mode` and `order` must be written as top-level edge fields and, when possible, mirrored inside `data`.
- Node IDs must be unique within the graph.
- Edge `source` and `target` values must reference existing node IDs.

## 2. Runtime Execution Model

The backend runtime executes the graph as follows:

- First, all `triggerNode` nodes are treated as start nodes.
- If there is no `triggerNode`, nodes without incoming edges are treated as fallback start nodes.
- Frontend validation requires at least one `triggerNode` in the workflow.
- Downstream nodes do not run until a node completes.
- If a node has multiple parents, the runtime waits until all parent nodes are completed.
- `sequential` edges from the same source node are executed in order.
- `parallel` edges are executed in parallel with goroutines.
- The runtime dispatches sequential edges first, then parallel edges.
- When a `conditionNode` completes, only the branch matching the result is dispatched.
- If a `serverNode` contains multiple targets, the downstream flow is fanned out in parallel with a separate scope for each target.
- `loopStartNode` sets up loop state; `loopEndNode` replays the body node according to the count.

Template rendering is supported in string fields:

```text
{{payload.status}}
{{trigger.environment}}
{{provision.vmid}}
{{provision.ip}}
{{target.host}}
{{loop.index}}
{{i}}
```

Runtime variables:

| Variable | Source | Meaning |
| --- | --- | --- |
| `payload` | Trigger body | Webhook/manual payload object |
| `triggerType` | Trigger node | `manual`, `webhook`, `schedule` |
| `trigger` | Trigger node | Trigger metadata and defined trigger variables |
| Trigger variable keys | Trigger node `variables` | Also set directly as top-level variables |
| `provision` | Provision node | `vmid`, `targetNode`, `name`, `node`, and `ip` when available |
| `vmid` | Provision node | Created VMID |
| `targetNode` | Provision node | Proxmox node name |
| `ip` | Provision, Server, Wait | Active host/IP |
| `target` | Server node | Active target metadata object |
| `targets` | Server node | Multi-target list |
| `loop` | Loop node | `index`, `count`, iterator variable |
| Iterator variable | Loop node | Default `i` |
| `conditionResult` | Condition node | Last condition boolean result |

## 3. Handle Model

Most nodes use `WorkflowNodeShell`:

- Default input handle: top, `type="target"`.
- Default output handle: bottom, `type="source"`.
- Trigger node: has only an output handle and must not accept incoming edges.
- End node: has only an input handle and must not produce outgoing edges.
- Condition node: has a top input handle and two special bottom source handles:
  - `sourceHandle: "true"`
  - `sourceHandle: "false"`

The condition edge label is automatically `TRUE` or `FALSE` based on the source handle. Other edge labels are `PARALLEL` or `SEQUENTIAL #n`.

## 4. Frontend Save Validation Rules

Rules applied during frontend save:

- There must be at least one `triggerNode`.
- `triggerNode` cannot receive incoming edges.
- Every `loopStartNode` must contain a reachable `loopEndNode` downstream.
- Every `conditionNode` must have at least one `true` branch and at least one `false` branch.
- `provisionNode` requires `proxmoxConfigNode` upstream.
- `destroyNode` requires `provisionNode` upstream.
- `waitUntilUpNode` requires either `provisionNode` or `serverNode` upstream.
- `configureNode`, `actionNode`, `configCommandNode`, `configFileNode`, `configPackageNode`, and `configServiceNode` require either `provisionNode` or `serverNode` upstream.
- If more than one outgoing edge leaves a node, sequential edge `order` values must be positive and unique.

Important implementation note: According to the intended contract, `true` and `false` handles must only be used on source edges from `conditionNode`, and the target node can be any valid downstream node. The current frontend validation code checks this through the target node, so behavior in the mapping UI may conflict with the intended contract when saving condition branches. For AI, the correct model is that the condition node emits two branches.

## 5. Node Catalog

Active node types available for AI generation:

1. `triggerNode`
2. `proxmoxConfigNode`
3. `provisionNode`
4. `waitUntilUpNode`
5. `configureNode`
6. `actionNode`
7. `configCommandNode`
8. `configFileNode`
9. `configPackageNode`
10. `configServiceNode`
11. `conditionNode`
12. `loopStartNode`
13. `loopEndNode`
14. `destroyNode`
15. `serverNode`
16. `customNode`
17. `endNode`

Legacy or runtime-only types:

| Type | Status | Note |
| --- | --- | --- |
| `startNode` | Legacy | Do not use in new graph generation; the backend normalizes it as `triggerNode`. |
| `clusterContextNode` | Runtime alias | Same profile context behavior as `proxmoxConfigNode`. |
| `resourcesNode` | Runtime-only | Not in the sidebar; sets compute defaults. Use `provisionNode` fields in new generation. |
| `networkNode` | Runtime-only | Not in the sidebar; sets network defaults. Use `provisionNode` fields in new generation. |
| `storageNode` | Runtime-only | Not in the sidebar; sets storage defaults or adds an extra disk to the VM. Use `provisionNode.disks` in new generation. |
| `IteratorNode` | UI legacy/unused | Not active in `nodeTypes`; do not use in new generation. |

## 6. Node Details

### 6.1 `triggerNode` - Workflow Entry Point

Starts the workflow manually, by webhook, or by schedule. At runtime, it writes the payload and trigger variables into the workflow context.

Recommended data:

```json
{
  "label": "Trigger",
  "triggerType": "manual",
  "enabled": true,
  "variables": [],
  "webhookPath": "",
  "secretRef": "",
  "cronExpr": "",
  "timezone": "UTC"
}
```

Parameters:

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `label` | string | `Trigger` | UI title. |
| `triggerType` | enum | `manual` | `manual`, `webhook`, `schedule`. |
| `enabled` | boolean | `true` | Whether the webhook/schedule trigger is active. |
| `variables` | array | `[]` | Trigger payload/default variable mapping list. |
| `webhookPath` | string | `""` | Path-based webhook endpoint hint. |
| `secretRef` | string | `""` | SHA-256 hashed on save; webhook is verified with `X-Workflow-Secret` or `?secret=`. |
| `cronExpr` | string | `""` | Schedule trigger cron expression. |
| `timezone` | string | `UTC` | Cron timezone. |
| `runtimeTrigger` | object | runtime-only | Merged in the UI for trigger ID, endpoint, and last/next run data; do not write in AI generation. |

`variables` item shape:

```json
{
  "id": "var-0",
  "key": "environment",
  "source": "payload.env",
  "value": "TEST"
}
```

Variable resolution order:

1. If `source` is filled, the `payload.` prefix is stripped and the payload path is read.
2. If `source` is absent, the `key` path is searched inside the payload.
3. If no value is found, `value` is used as the default.

Connection:

- Must not have incoming edges.
- Outgoing edges can go to any non-trigger node, but downstream context rules must be satisfied.
- The safest model for AI is to generate one root trigger in the workflow.

### 6.2 `proxmoxConfigNode` - Cluster Context

Selects the cluster profile for downstream Proxmox operations. The backend sets `ExecutionContext.ProfileID`.

Data:

```json
{
  "label": "Cluster Context",
  "profileId": "cluster-profile-id"
}
```

Parameters:

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `label` | string | `Cluster Context` | UI title. |
| `profileId` | string | `""` | Proxmox cluster profile ID. Required for provision, destroy, Proxmox API custom node, and inventory lookup. |

Connection:

- Usually `triggerNode -> proxmoxConfigNode -> provisionNode`.
- `serverNode` can use upstream cluster context for inventory selection.
- Does not create a VM by itself; it only sets context.

### 6.3 `serverNode` - Target Server Context

Carries existing host/VM targets into the workflow context. Use it to run commands/playbooks on existing hosts instead of a provisioned VM.

Data:

```json
{
  "label": "Server",
  "hostname": "",
  "targets": [
    {
      "id": "target-0",
      "source": "inventory",
      "host": "10.0.0.10",
      "label": "web-01",
      "ip": "10.0.0.10",
      "name": "web-01",
      "node": "pve1",
      "vmid": "101",
      "status": "running",
      "type": "qemu"
    }
  ]
}
```

Target parameters:

| Field | Type | Usage |
| --- | --- | --- |
| `id` | string | Target item ID. |
| `source` | enum | `inventory` or `manual`. |
| `host` | string | Main target host/IP; must not be empty. |
| `label` | string | UI and trace label. |
| `ip` | string | Connection IP alias. |
| `name` | string | Inventory VM name. |
| `node` | string | Proxmox node name. |
| `vmid` | string/number | Proxmox VMID. |
| `status` | string | Inventory status. |
| `type` | string | `qemu`, `lxc`, `manual`, etc. |

Runtime behavior:

- If `targets` is empty and `hostname` is filled, it is used as one manual target.
- If there is one target, `target`, `ip`, `TargetHost`, `TargetNode`, and `VMID` are written into context.
- If there are multiple targets, the downstream flow runs with a parallel scope for each target.
- Inside multi-target fan-out, node status keys receive a scope suffix.

Connection:

- After `serverNode`, `waitUntilUpNode`, `actionNode`, `configureNode`, `config*Node`, `customNode`, `conditionNode`, and `endNode` can be used.
- Server context is sufficient for SSH/Ansible-based nodes.
- Upstream `proxmoxConfigNode` is recommended for inventory selection; it is not required for manual targets.

### 6.4 `provisionNode` - Provision VM

Clones a new VM from a Proxmox template VM, applies compute/storage/network/cloud-init settings, and produces VM context for downstream nodes.

Recommended data:

```json
{
  "label": "Provision VM",
  "node": "pve1",
  "templateId": "9000",
  "instanceName": "web-{{i}}",
  "vmId": "",
  "autoVmid": true,
  "environment": "TEST",
  "serverType": "APP",
  "cores": "2",
  "memory": "2048",
  "machine": "q35",
  "ostype": "l26",
  "bios": "seabios",
  "onboot": true,
  "agent": true,
  "targetStorage": "local-lvm",
  "cloudInitStorage": "",
  "cicustom": "",
  "disks": [],
  "networks": [],
  "ipAddress": "",
  "gw": "",
  "dns1": "",
  "dns2": "",
  "domain": ""
}
```

Main parameters:

| Field | Type | Default | Runtime usage |
| --- | --- | --- | --- |
| `label` | string | `Provision VM` | UI/trace name. |
| `node` | string | `""` | Target Proxmox node. Required. |
| `templateId` | string/number | `""` | QEMU template VMID to clone. Required. |
| `instanceName` | string | `vm-{{i}}` | New VM name. `hostname` can be a fallback if present. |
| `vmId` | string/number | `""` | Explicit VMID. If empty, the backend gets the next VMID. |
| `autoVmid` | boolean | `true` | UI behavior; backend treats an empty VMID as auto. |
| `cores` | string/number | `2` | VM CPU core count. |
| `memory` | string/number | `2048` | RAM in MB. |
| `machine` | string | `q35` | Proxmox machine type. |
| `ostype` | string | `l26` | Proxmox OS type. |
| `bios` | string | `seabios` | `seabios` or `ovmf`. |
| `onboot` | boolean | `true` | Proxmox `onboot=1`. |
| `agent` | boolean | `true` | QEMU guest agent setting. |
| `targetStorage` | string | `""` | Clone target storage. If empty, the first image-capable storage is selected. |
| `storage` | string | `""` | Legacy fallback for `targetStorage`. |
| `cloudInitStorage` | string | `""` | Cloud-init disk storage; if present, `ide2=<storage>:cloudinit`. |
| `cicustom` | string | `""` | Proxmox `cicustom`. |
| `ipAddress` | string | `""` | Top-level cloud-init `ipconfig0` IP/CIDR. |
| `gw` | string | `""` | Top-level cloud-init gateway. |
| `dns1` | string | `""` | Added to the nameserver list. |
| `dns2` | string | `""` | Added to the nameserver list. |
| `domain` | string | `""` | UI/cloud-init note field; not used directly in backend provisioning. |
| `environment` | string | `TEST` | For UI/tagging; not used directly in backend provisioning. |
| `serverType` | string | `APP` | For UI/tagging; not used directly in backend provisioning. |
| `cloudInitNotes` | string | `""` | UI note; backend does not use it. |
| `retryEnabled`, `retryLimit` | boolean/string | `true`, `1` | UI guardrail; backend retry is currently a hard-coded single retry for some node types. |
| `snapshotBeforeConfig`, `rollbackOnFailure` | boolean | `false`, `true` | UI guardrail; backend only performs rollback by deleting the created VM after provision failure. |

Disk item:

```json
{
  "id": "disk-0",
  "slot": "scsi1",
  "bus": "scsi",
  "storage": "local-lvm",
  "sizeGb": "20",
  "cache": "",
  "iothread": false,
  "discard": false,
  "ssd": false,
  "backup": true
}
```

Disk runtime usage:

- If `slot` is empty, it becomes `scsi{index+1}`.
- If `bus` is empty, it becomes `scsi`.
- If `storage` and `sizeGb` are not meaningful, the disk is not added to the config.
- `cache`, `iothread`, `discard`, `ssd`, and `backup=false` are added to the Proxmox disk spec.
- `extraDisks` is normalized as a legacy alias.

Network item:

```json
{
  "id": "net-0",
  "slot": "net0",
  "model": "virtio",
  "bridge": "vmbr0",
  "vlanTag": "",
  "firewall": false,
  "rateLimitMbps": "",
  "macAddress": "",
  "queues": "",
  "ipAddress": "",
  "gw": "",
  "dns1": "",
  "dns2": "",
  "domain": ""
}
```

Network runtime usage:

- If `slot` is empty, it becomes `net{index}`.
- If `model` is empty, it becomes `virtio`.
- If `bridge` is empty, the NIC is not added to the config.
- If `macAddress` is filled, the Proxmox spec is built as `virtio=<mac>,bridge=<bridge>`.
- `vlanTag`, `firewall`, `rateLimitMbps`, and `queues` are added to the Proxmox NIC spec.
- Per-NIC `ipAddress`, `gw`, `dns1`, `dns2`, and `domain` are stored on the frontend, but the backend uses top-level `ipAddress`, `gw`, `dns1`, and `dns2` fields for cloud-init.

Preflight/runtime requirements:

- `ProfileID` must have been set by an upstream `proxmoxConfigNode`.
- `templateId` is required.
- `node` is required, and the cluster node must be online.
- `cores` must not exceed the node CPU capacity.
- `memory` must not exceed the node RAM capacity.
- If an explicit `vmId` is given, it must not conflict with an existing VMID.
- `targetStorage`, disk storages, and `cloudInitStorage` must be valid on the node.
- Storage must support image content.
- NIC bridge values must exist on the node.

Runtime outputs:

- `vmid`
- `targetNode`
- `provision.vmid`
- `provision.targetNode`
- `provision.name`
- `provision.node`
- `ip` and `provision.ip` if a static IP is provided or the wait node discovers an IP

Connection:

- Must have `proxmoxConfigNode` upstream.
- Usually `proxmoxConfigNode -> provisionNode -> waitUntilUpNode -> config/action/custom`.
- If downstream `destroyNode` is used, the upstream provision requirement is satisfied for validation.

### 6.5 `waitUntilUpNode` - Availability Check

Waits until the target selected through provision or server context is reachable.

Data:

```json
{
  "label": "Availability Check",
  "timeout": "15",
  "interval": "10",
  "probes": [
    {
      "id": "probe-0",
      "type": "ssh",
      "host": "",
      "port": "22",
      "label": "SSH reachability"
    }
  ]
}
```

Parameters:

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `timeout` | string/number | `15` | Total wait duration in minutes. |
| `interval` | string/number | `10` | Probe interval in seconds. |
| `probes` | array | SSH probe | Waits until all probes succeed. |

Probe item:

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `type` | enum | `ssh` | `ssh`, `ping`, `tcp`. |
| `host` | string | `""` | Host override. If empty, context IP/host is used. |
| `port` | string/number | `22` or `443` | Fallback is 22 for `ssh`, 443 for `tcp`. Not used by `ping`. |
| `label` | string | `SSH reachability` | UI/trace label. |

Runtime behavior:

- If Proxmox context and VMID exist, the VM is attempted to be started.
- If there is no IP, IPv4 discovery is attempted through Proxmox VM config or the guest agent.
- Base target order: `ec.IP`, config network IP, `ec.TargetHost`.
- Downstream starts if all probes succeed.
- On success, `ip` and `provision.ip` may be updated.

Connection:

- Must have `provisionNode` or `serverNode` upstream.
- Recommended after provision and before SSH/config nodes.

### 6.6 `actionNode` - Saved Ansible Template

Runs a saved Ansible template/playbook on the active host.

Data:

```json
{
  "label": "Install Nginx",
  "id": "template-id",
  "templateId": "template-id",
  "templateName": "Install Nginx",
  "failureMode": "HARD"
}
```

Parameters:

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `templateId` | string | `""` | Primary field for backend template lookup. |
| `id` | string | `""` | Legacy fallback template ID. |
| `templateName` | string | `""` | UI/trace label. |
| `failureMode` | enum | `HARD` | `HARD`/`SOFT` in the UI; backend runtime currently does not apply soft-fail semantics. |

Runtime:

- Loads the template from the database.
- Finds the target IP through `staticHost` or context `ip`.
- If an SSH profile exists, its credentials are used; otherwise default `root` is tried.
- If there is no target IP, a warning is logged and execution is skipped like a simulation.

Connection:

- Must have `provisionNode` or `serverNode` upstream.
- Template content must not be written inline here; use `customNode` or `configureNode` for inline logic.

### 6.7 `configureNode` - Inline Playbook / Legacy Configure

Runs an inline Ansible playbook on the active host.

Data:

```json
{
  "label": "Configure VM",
  "playbook": "",
  "extraVars": ""
}
```

Parameters:

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `playbook` | string | `""` | Executed directly by the backend as an Ansible playbook; required. |
| `extraVars` | string | `""` | UI/summary field; currently not used in backend execution. |

Note:

- Marked as legacy-only in the ProxAI contract.
- In new flows, prefer `actionNode` for saved templates, `config*Node` for task/file/package/service operations, and `customNode` for custom inline logic.

Connection:

- Must have `provisionNode` or `serverNode` upstream.

### 6.8 `configCommandNode` - Remote Command

Runs a shell command on the active host.

Data:

```json
{
  "label": "Shell Command",
  "command": "uptime",
  "sudo": false
}
```

Parameters:

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `command` | string | `echo "hello"` | Shell command; multiline is supported. Required. |
| `sudo` | boolean | `false` | If `true`, the Ansible task receives `become: yes`. |

Connection:

- Must have `provisionNode` or `serverNode` upstream.

### 6.9 `configFileNode` - Write File

Creates or updates a file on the active host.

Data:

```json
{
  "label": "Write File",
  "path": "/etc/motd",
  "content": "Welcome!",
  "mode": "0644"
}
```

Parameters:

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `path` | string | `/tmp/test` | Target path. Required. |
| `content` | string | `""` | File content. |
| `mode` | string | `0644` | File permission mode. |

Runtime:

- Runs through the Ansible `copy` module.
- The task always uses `become: yes`.

Connection:

- Must have `provisionNode` or `serverNode` upstream.

### 6.10 `configPackageNode` - Manage Package

Manages package state on the active host.

Data:

```json
{
  "label": "Package",
  "pkgName": "curl",
  "state": "present",
  "sudo": false
}
```

Parameters:

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `pkgName` | string | `""` | Package name. Required. |
| `state` | enum | `present` | `present`, `absent`, `latest`. |
| `sudo` | boolean | `false` | UI field; backend package task currently always runs with `become: yes`. |

Connection:

- Must have `provisionNode` or `serverNode` upstream.

### 6.11 `configServiceNode` - Manage Service

Manages service lifecycle state on the active host.

Data:

```json
{
  "label": "Service",
  "serviceName": "nginx",
  "state": "started",
  "sudo": false
}
```

Parameters:

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `serviceName` | string | `""` | Service name. Required. |
| `state` | enum | `started` | UI: `started`, `stopped`, `restarted`, `reloaded`, `enabled`, `disabled`. |
| `sudo` | boolean | `false` | UI field; backend service task currently always runs with `become: yes`. |

Note:

- The backend writes `state` directly into the Ansible `service.state` field. `enabled`/`disabled` may require the separate `enabled` parameter in the Ansible service module; when AI generates new flows, it should prefer `started`, `stopped`, `restarted`, and `reloaded`.

Connection:

- Must have `provisionNode` or `serverNode` upstream.

### 6.12 `conditionNode` - Branching

Evaluates workflow context variables and routes to the `true` or `false` branch.

Data:

```json
{
  "label": "Condition",
  "mode": "builder",
  "leftOperand": "payload.status",
  "operator": "==",
  "rightType": "literal",
  "rightValue": "up",
  "condition": "payload.status == \"up\""
}
```

Parameters:

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `mode` | enum | `builder` | `builder` or `advanced`. |
| `leftOperand` | string | `payload.status` | Context variable path. |
| `operator` | enum | `==` | `==`, `!=`, `>`, `<`, `>=`, `<=`, `contains`, `exists`, `is empty`. |
| `rightType` | enum | `literal` | `literal` or `variable`. |
| `rightValue` | string | `up` | Literal value or variable path. |
| `condition` | string | generated | Auto expression in builder mode; direct expression in advanced mode. |

Operand recommendations:

- `payload.status`
- `payload.result`
- `payload.message`
- `trigger.<key>`
- `loop.index`
- `loop.count`
- `provision.ip`
- `provision.vmid`
- `provision.targetNode`
- `target.host`
- `target.ip`
- `target.node`
- `target.vmid`
- `target.status`
- `target.type`

Advanced evaluator limits:

- Does not run arbitrary JavaScript.
- Supports: `&&`, `||`, `String(x ?? "").includes(String(y ?? ""))`, `==`, `===`, `!=`, `!==`, `>=`, `<=`, `>`, `<`, boolean literal values.
- Numeric comparisons return false for values that cannot be parsed.

Connection:

- `conditionNode` receives a top input.
- Always produce two outgoing branches:

```json
{
  "source": "node_condition",
  "target": "node_true_path",
  "sourceHandle": "true",
  "mode": "sequential"
}
```

```json
{
  "source": "node_condition",
  "target": "node_false_path",
  "sourceHandle": "false",
  "mode": "sequential"
}
```

- Branch targets must satisfy the relevant context rules.
- Mode is not toggled on condition branch edges; the label is determined by the handle.

### 6.13 `loopStartNode` - Loop Start

Repeats the downstream body a fixed number of times.

Data:

```json
{
  "label": "Loop Start",
  "count": "3",
  "iteratorVar": "i"
}
```

Parameters:

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `count` | string/number | `3` | Iteration count. Runtime treats `<=0` as `1`. |
| `iteratorVar` | string | `i` | Runtime iterator variable name. The UI currently only edits count; the default is normalized. |

Runtime:

- The target of the first outgoing edge is treated as the loop body start.
- `iteratorVar` and `loop.index` are set to `0` as the first value.
- As `loopEndNode` completes, the body node is replayed.

Connection:

- Every loop start must contain a reachable `loopEndNode` downstream.
- In AI generation, produce one body entry edge from the loop start.
- The body must end with `loopEndNode`; after the loop finishes, it can continue with `loopEndNode -> next`.

### 6.14 `loopEndNode` - Loop End

Marks the end of the loop body.

Data:

```json
{
  "label": "Loop End"
}
```

Runtime:

- Does no work by itself.
- If a loop stack created by `loopStartNode` exists, it manages iteration continuation or loop exit.

Connection:

- Must have a loop body path upstream.
- Outgoing edge runs after the loop is completed.

### 6.15 `destroyNode` - Destroy VM

Deletes a Proxmox QEMU VM.

Data:

```json
{
  "label": "Destroy VM",
  "target": "{{vmid}}"
}
```

Parameters:

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `target` | string/number | `""` | VMID to delete. `{{vmid}}` can be used. |
| `vmId` | string/number | optional | Runtime checks this before `target`. |
| `node` | string | optional | Fallback node if `TargetNode` is absent. |

Runtime:

- Target VMID order: `data.vmId`, `data.target`, context `ec.VMID`.
- Node order: context `TargetNode`, `data.node`.
- `ProfileID` is required for the Proxmox client.
- Only calls QEMU VM delete.

Connection:

- Frontend validation requires `provisionNode` upstream.
- Practical flow: `proxmoxConfigNode -> provisionNode -> ... -> destroyNode`.

### 6.16 `customNode` - Custom Logic

Runs custom script/API/macro logic. Reusable nodes created from the Custom Nodes screen can be dragged from the Flow Sidebar.

Recommended data:

```json
{
  "label": "Custom Logic",
  "customNodeId": "cn-123",
  "scriptType": "shell",
  "scriptContent": "echo hello",
  "sudo": false,
  "method": "GET",
  "path": "",
  "body": "{}"
}
```

General parameters:

| Field | Type | Usage |
| --- | --- | --- |
| `id` | string | Can be used as the legacy/custom node ID for the dragged custom node. |
| `customNodeId` | string | Custom node ID. |
| `sourceCustomNodeId` | string | Source reusable custom node ID. |
| `label` | string | UI/trace name. |
| `scriptType` | enum | `shell`, `bash`, `python`, `ansible`, `proxmox_api`, `composite`, `workflow`. |
| `scriptContent` | string | Shell/Python/Ansible content. |
| `sudo` | boolean | Become value for Shell/Python wrapper execution. |
| `method` | string | Proxmox API method. |
| `path` | string | Proxmox API path. Supports `{node}` and `{vmid}` placeholders. |
| `body` | string | Proxmox API JSON body string. |
| `workflowId` | string | Sub-workflow ID for `composite` or `workflow` scriptType. |

Frontend inline editor script type options:

- `shell`
- `python`
- `ansible`

Custom Nodes admin feature options:

- `proxmox_api`
- `ansible`
- `python`
- `shell`

Backend runtime additionally supports:

- `bash` as an alias that runs like shell.
- `composite` and `workflow` to start a sub-workflow.

Script type behavior:

| `scriptType` | Behavior | Context need |
| --- | --- | --- |
| `shell` / `bash` | Script is written as `/tmp/custom_script.sh`, executed, output is debugged, then cleaned up. | Target IP is required. |
| `python` | Script is written as `/tmp/custom_script.py`, executed with `python3`, then cleaned up. | Target IP is required. |
| `ansible` | If content is a full playbook it is run directly; if it is a task list, it runs inside a `hosts: all` wrapper. | Target IP is required. |
| `proxmox_api` | Makes a direct API request through the Proxmox client. | `ProfileID`; usually `TargetNode`/`VMID`. |
| `composite` / `workflow` | Creates and asynchronously starts a separate job for the sub-workflow. | `workflowId`. |

Connection:

- Frontend validation does not require context for custom nodes.
- In practice, upstream `provisionNode` or `serverNode` should be used for shell/python/ansible.
- For `proxmox_api`, upstream `proxmoxConfigNode` is required, and most paths also need provision/server target context.

### 6.17 `endNode` - Workflow End

The workflow terminal node.

Data:

```json
{
  "label": "End"
}
```

Connection:

- Can receive incoming edges.
- Must not produce outgoing edges.
- Runtime completes it without doing work.

## 7. Connection Matrix

This table summarizes practical connection decisions for AI.

| Source | Recommended target | Rule |
| --- | --- | --- |
| `triggerNode` | `proxmoxConfigNode`, `serverNode`, `conditionNode`, `loopStartNode`, `endNode` | Trigger cannot receive incoming edges. Do not go directly to a node that requires context. |
| `proxmoxConfigNode` | `provisionNode`, `serverNode`, `conditionNode`, `customNode` | Required upstream for provision. |
| `serverNode` | `waitUntilUpNode`, `actionNode`, `configureNode`, `configCommandNode`, `configFileNode`, `configPackageNode`, `configServiceNode`, `customNode`, `conditionNode`, `endNode` | Provides existing/manual target context. |
| `provisionNode` | `waitUntilUpNode`, `actionNode`, `configureNode`, `configCommandNode`, `configFileNode`, `configPackageNode`, `configServiceNode`, `destroyNode`, `customNode`, `conditionNode`, `endNode` | Provides new VM context. |
| `waitUntilUpNode` | `actionNode`, `configureNode`, `configCommandNode`, `configFileNode`, `configPackageNode`, `configServiceNode`, `customNode`, `conditionNode`, `endNode` | Use as a readiness guard before SSH/config. |
| `conditionNode` | Valid downstream node for each branch | `sourceHandle` must be `true` and `false`; both branches must exist. |
| `loopStartNode` | First node of the loop body | One body entry edge is recommended; a `loopEndNode` must be reachable downstream. |
| `loopEndNode` | Next node after the loop or `endNode` | Dispatched when the loop is completed. |
| `actionNode` / `configureNode` / `config*Node` / `customNode` | Another execution node, `conditionNode`, `loopEndNode`, `endNode` | Context is preserved. |
| `destroyNode` | `endNode` or node after cleanup | Destroy is destructive; usually use it near the end. |
| `endNode` | None | Do not produce outgoing edges. |

## 8. Required Patterns

### 8.1 Provision + Configure

```text
triggerNode
  -> proxmoxConfigNode
  -> provisionNode
  -> waitUntilUpNode
  -> configCommandNode/actionNode/customNode
  -> endNode
```

### 8.2 Existing Server Configuration

```text
triggerNode
  -> proxmoxConfigNode optional for inventory
  -> serverNode
  -> waitUntilUpNode
  -> configPackageNode
  -> configServiceNode
  -> endNode
```

### 8.3 Conditional Branch

```text
triggerNode -> serverNode -> conditionNode
conditionNode --true--> configCommandNode -> endNode
conditionNode --false--> endNode
```

Edges:

```json
[
  {
    "id": "edge_condition_true",
    "source": "node_condition",
    "target": "node_true",
    "sourceHandle": "true",
    "type": "workflowEdge",
    "mode": "sequential",
    "data": { "mode": "sequential" }
  },
  {
    "id": "edge_condition_false",
    "source": "node_condition",
    "target": "node_false",
    "sourceHandle": "false",
    "type": "workflowEdge",
    "mode": "sequential",
    "data": { "mode": "sequential" }
  }
]
```

### 8.4 Loop

```text
triggerNode
  -> loopStartNode
  -> configCommandNode
  -> loopEndNode
  -> endNode
```

Use `{{i}}` or `{{loop.index}}` to render the iteration index.

### 8.5 Multi-target Fan-out

```text
triggerNode
  -> serverNode(targets.length > 1)
  -> configCommandNode
  -> endNode
```

After `serverNode`, the runtime runs the downstream flow with a parallel scope for each target. Commands can use `{{target.host}}`, `{{target.ip}}`, and `{{target.name}}`.

## 9. AI Generation Checklist

Apply this checklist when generating an AI workflow:

1. Make the root node `triggerNode`; do not generate `startNode`.
2. Keep the graph connected; do not generate orphan nodes.
3. Make every ID unique and readable.
4. Make every edge source/target an existing node ID.
5. Place `provisionNode` or `serverNode` before nodes that require context.
6. Always place `proxmoxConfigNode` before `provisionNode`.
7. After provision, put `waitUntilUpNode` before SSH-based config/action/custom nodes.
8. If using a condition node, generate both branches: `sourceHandle="true"` and `sourceHandle="false"`.
9. If using a loop, generate a reachable `loopEndNode` downstream of `loopStartNode`.
10. For the destructive `destroyNode`, provide an explicit target and upstream provision context.
11. Use `mode="sequential"` for a single dependency chain.
12. Use `mode="parallel"` for independent sibling tasks.
13. For sequential sibling edges, write unique `order` values as `1, 2, 3...`.
14. For `configServiceNode.state`, prefer safe values in new generation: `started`, `stopped`, `restarted`, `reloaded`.
15. Do not rely on UI-only fields or fields unused by the backend: `failureMode`, `extraVars`, provision reliability guardrail fields, package/service `sudo`.
16. If inline Ansible is needed, prefer `customNode.scriptType="ansible"`; if a saved template is needed, use `actionNode`.
17. If working on existing hosts, use `serverNode.targets[]`; if creating a new VM, use `provisionNode`.

## 10. Minimal Valid Examples

### Manual Provision Flow

```json
{
  "nodes": [
    {
      "id": "node_trigger",
      "type": "triggerNode",
      "position": { "x": 80, "y": 80 },
      "data": {
        "label": "Manual Trigger",
        "triggerType": "manual",
        "enabled": true,
        "variables": [],
        "webhookPath": "",
        "secretRef": "",
        "cronExpr": "",
        "timezone": "UTC"
      }
    },
    {
      "id": "node_context",
      "type": "proxmoxConfigNode",
      "position": { "x": 80, "y": 240 },
      "data": {
        "label": "Cluster Context",
        "profileId": "profile-id"
      }
    },
    {
      "id": "node_provision",
      "type": "provisionNode",
      "position": { "x": 80, "y": 400 },
      "data": {
        "label": "Provision VM",
        "node": "pve1",
        "templateId": "9000",
        "instanceName": "web-01",
        "autoVmid": true,
        "cores": "2",
        "memory": "2048",
        "machine": "q35",
        "ostype": "l26",
        "bios": "seabios",
        "onboot": true,
        "agent": true,
        "targetStorage": "local-lvm",
        "networks": [
          {
            "id": "net-0",
            "slot": "net0",
            "model": "virtio",
            "bridge": "vmbr0",
            "vlanTag": "",
            "firewall": false
          }
        ]
      }
    },
    {
      "id": "node_wait",
      "type": "waitUntilUpNode",
      "position": { "x": 80, "y": 600 },
      "data": {
        "label": "Availability Check",
        "timeout": "15",
        "interval": "10",
        "probes": [
          { "id": "probe-0", "type": "ssh", "host": "", "port": "22", "label": "SSH reachability" }
        ]
      }
    },
    {
      "id": "node_command",
      "type": "configCommandNode",
      "position": { "x": 80, "y": 780 },
      "data": {
        "label": "Verify Host",
        "command": "hostname && uptime",
        "sudo": false
      }
    },
    {
      "id": "node_end",
      "type": "endNode",
      "position": { "x": 80, "y": 940 },
      "data": { "label": "End" }
    }
  ],
  "edges": [
    { "id": "edge_1", "source": "node_trigger", "target": "node_context", "type": "workflowEdge", "mode": "sequential", "order": 1, "data": { "mode": "sequential", "order": 1 } },
    { "id": "edge_2", "source": "node_context", "target": "node_provision", "type": "workflowEdge", "mode": "sequential", "order": 1, "data": { "mode": "sequential", "order": 1 } },
    { "id": "edge_3", "source": "node_provision", "target": "node_wait", "type": "workflowEdge", "mode": "sequential", "order": 1, "data": { "mode": "sequential", "order": 1 } },
    { "id": "edge_4", "source": "node_wait", "target": "node_command", "type": "workflowEdge", "mode": "sequential", "order": 1, "data": { "mode": "sequential", "order": 1 } },
    { "id": "edge_5", "source": "node_command", "target": "node_end", "type": "workflowEdge", "mode": "sequential", "order": 1, "data": { "mode": "sequential", "order": 1 } }
  ]
}
```

## 11. Notes for Future Maintenance

- This document is based on the mapping/flow-editor node system.
- There is a separate experimental designer and broader catalog under `frontend/src/features/automation-designer`; this document does not cover those domain catalog types.
- The ProxAI workspace prompt contains the active node list and basic data shapes; this document extends that contract with runtime and UI behavior.
- There are some differences between frontend validation and backend runtime, such as condition branch checks; when preparing an AI training dataset, the intended runtime contract and save validation behavior should be labeled separately.
