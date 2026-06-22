# RethinkDB Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `databases`
- Workflow path: `workflows/databases/rethinkdb`
- Stack network: `10.0.19.0/24`
- Gateway: `10.0.19.1`
- Single-node IP: `10.0.19.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.19.1"]
  single["rethinkdb-single-01<br/>rethinkdb<br/>10.0.19.50"]
  health["Health check<br/>RethinkDB"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| rethinkdb-single-01 | rethinkdb | `10.0.19.50` | rethinkdb-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/databases/rethinkdb/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/databases/rethinkdb/single-node-existing.json) |

## High-Availability Topologies

### RethinkDB Native Cluster HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.19.1"]
  subgraph stack_block["RethinkDB Native Cluster HA - 10.0.19.0/24"]
    direction LR
    subgraph role_0["rethinkdb"]
      direction TB
      n0["rethinkdb-01<br/>10.0.19.11"]
      n1["rethinkdb-02<br/>10.0.19.12"]
      n2["rethinkdb-03<br/>10.0.19.13"]
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
| rethinkdb-01 | rethinkdb | `10.0.19.11` | rethinkdb-01 | 4 | 8192 | 80 |
| rethinkdb-02 | rethinkdb | `10.0.19.12` | rethinkdb-02 | 4 | 8192 | 80 |
| rethinkdb-03 | rethinkdb | `10.0.19.13` | rethinkdb-03 | 4 | 8192 | 80 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [native-cluster-ha-provisioned.json](../../workflows/databases/rethinkdb/native-cluster-ha-provisioned.json) |
| high-availability | existing | [native-cluster-ha-existing.json](../../workflows/databases/rethinkdb/native-cluster-ha-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
