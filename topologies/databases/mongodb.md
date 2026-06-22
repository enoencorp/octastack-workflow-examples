# MongoDB Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `databases`
- Workflow path: `workflows/databases/mongodb`
- Stack network: `10.0.3.0/24`
- Gateway: `10.0.3.1`
- Single-node IP: `10.0.3.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.3.1"]
  single["mongodb-single-01<br/>mongodb<br/>10.0.3.50"]
  health["Health check<br/>MongoDB"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| mongodb-single-01 | mongodb | `10.0.3.50` | mongodb-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/databases/mongodb/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/databases/mongodb/single-node-existing.json) |

## High-Availability Topologies

### MongoDB Replica Set HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.3.1"]
  subgraph stack_block["MongoDB Replica Set HA - 10.0.3.0/24"]
    direction LR
    subgraph role_0["mongodb"]
      direction TB
      n0["mongodb-01<br/>10.0.3.11"]
      n1["mongodb-02<br/>10.0.3.12"]
      n2["mongodb-03<br/>10.0.3.13"]
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
| mongodb-01 | mongodb | `10.0.3.11` | mongodb-01 | 4 | 8192 | 80 |
| mongodb-02 | mongodb | `10.0.3.12` | mongodb-02 | 4 | 8192 | 80 |
| mongodb-03 | mongodb | `10.0.3.13` | mongodb-03 | 4 | 8192 | 80 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [replica-set-ha-provisioned.json](../../workflows/databases/mongodb/replica-set-ha-provisioned.json) |
| high-availability | existing | [replica-set-ha-existing.json](../../workflows/databases/mongodb/replica-set-ha-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
