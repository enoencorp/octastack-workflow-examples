# Redpanda Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `messaging`
- Workflow path: `workflows/messaging/redpanda`
- Stack network: `10.0.83.0/24`
- Gateway: `10.0.83.1`
- Single-node IP: `10.0.83.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.83.1"]
  single["redpanda-single-01<br/>redpanda<br/>10.0.83.50"]
  health["Health check<br/>Redpanda"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| redpanda-single-01 | redpanda | `10.0.83.50` | redpanda-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/messaging/redpanda/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/messaging/redpanda/single-node-existing.json) |

## High-Availability Topologies

### Redpanda Native Cluster HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.83.1"]
  subgraph stack_block["Redpanda Native Cluster HA - 10.0.83.0/24"]
    direction LR
    subgraph role_0["redpanda"]
      direction TB
      n0["redpanda-01<br/>10.0.83.11"]
      n1["redpanda-02<br/>10.0.83.12"]
      n2["redpanda-03<br/>10.0.83.13"]
    end
  end
  workflow --> gateway
  gateway --> n0
  gateway --> n1
  gateway --> n2
  n0 <-->|peer| n1
  n1 <-->|peer| n2
```

#### HA Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| redpanda-01 | redpanda | `10.0.83.11` | redpanda-01 | 4 | 8192 | 80 |
| redpanda-02 | redpanda | `10.0.83.12` | redpanda-02 | 4 | 8192 | 80 |
| redpanda-03 | redpanda | `10.0.83.13` | redpanda-03 | 4 | 8192 | 80 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [native-cluster-ha-provisioned.json](../../workflows/messaging/redpanda/native-cluster-ha-provisioned.json) |
| high-availability | existing | [native-cluster-ha-existing.json](../../workflows/messaging/redpanda/native-cluster-ha-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
