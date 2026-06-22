# CockroachDB Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `databases`
- Workflow path: `workflows/databases/cockroachdb`
- Stack network: `10.0.8.0/24`
- Gateway: `10.0.8.1`
- Single-node IP: `10.0.8.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.8.1"]
  single["cockroachdb-single-01<br/>cockroach<br/>10.0.8.50"]
  health["Health check<br/>CockroachDB"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| cockroachdb-single-01 | cockroach | `10.0.8.50` | cockroachdb-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/databases/cockroachdb/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/databases/cockroachdb/single-node-existing.json) |

## High-Availability Topologies

### CockroachDB Native Cluster HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.8.1"]
  subgraph stack_block["CockroachDB Native Cluster HA - 10.0.8.0/24"]
    direction LR
    subgraph role_0["cockroach"]
      direction TB
      n0["cockroachdb-01<br/>10.0.8.11"]
      n1["cockroachdb-02<br/>10.0.8.12"]
      n2["cockroachdb-03<br/>10.0.8.13"]
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
| cockroachdb-01 | cockroach | `10.0.8.11` | cockroachdb-01 | 4 | 8192 | 80 |
| cockroachdb-02 | cockroach | `10.0.8.12` | cockroachdb-02 | 4 | 8192 | 80 |
| cockroachdb-03 | cockroach | `10.0.8.13` | cockroachdb-03 | 4 | 8192 | 80 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [native-cluster-ha-provisioned.json](../../workflows/databases/cockroachdb/native-cluster-ha-provisioned.json) |
| high-availability | existing | [native-cluster-ha-existing.json](../../workflows/databases/cockroachdb/native-cluster-ha-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
