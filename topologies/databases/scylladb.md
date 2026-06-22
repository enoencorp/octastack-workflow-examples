# ScyllaDB Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `databases`
- Workflow path: `workflows/databases/scylladb`
- Stack network: `10.0.5.0/24`
- Gateway: `10.0.5.1`
- Single-node IP: `10.0.5.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.5.1"]
  single["scylladb-single-01<br/>scylladb<br/>10.0.5.50"]
  health["Health check<br/>ScyllaDB"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| scylladb-single-01 | scylladb | `10.0.5.50` | scylladb-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/databases/scylladb/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/databases/scylladb/single-node-existing.json) |

## High-Availability Topologies

### ScyllaDB Native Ring HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.5.1"]
  subgraph stack_block["ScyllaDB Native Ring HA - 10.0.5.0/24"]
    direction LR
    subgraph role_0["scylladb"]
      direction TB
      n0["scylladb-01<br/>10.0.5.11"]
      n1["scylladb-02<br/>10.0.5.12"]
      n2["scylladb-03<br/>10.0.5.13"]
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
| scylladb-01 | scylladb | `10.0.5.11` | scylladb-01 | 4 | 8192 | 80 |
| scylladb-02 | scylladb | `10.0.5.12` | scylladb-02 | 4 | 8192 | 80 |
| scylladb-03 | scylladb | `10.0.5.13` | scylladb-03 | 4 | 8192 | 80 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [native-ring-ha-provisioned.json](../../workflows/databases/scylladb/native-ring-ha-provisioned.json) |
| high-availability | existing | [native-ring-ha-existing.json](../../workflows/databases/scylladb/native-ring-ha-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
