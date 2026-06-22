# ClickHouse Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `databases`
- Workflow path: `workflows/databases/clickhouse`
- Stack network: `10.0.6.0/24`
- Gateway: `10.0.6.1`
- Single-node IP: `10.0.6.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.6.1"]
  single["clickhouse-single-01<br/>clickhouse<br/>10.0.6.50"]
  health["Health check<br/>ClickHouse"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| clickhouse-single-01 | clickhouse | `10.0.6.50` | clickhouse-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/databases/clickhouse/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/databases/clickhouse/single-node-existing.json) |

## High-Availability Topologies

### ClickHouse Replicated Keeper HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.6.1"]
  subgraph stack_block["ClickHouse Replicated Keeper HA - 10.0.6.0/24"]
    direction LR
    subgraph role_0["clickhouse"]
      direction TB
      n0["clickhouse-01<br/>10.0.6.11"]
      n1["clickhouse-02<br/>10.0.6.12"]
      n2["clickhouse-03<br/>10.0.6.13"]
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
| clickhouse-01 | clickhouse | `10.0.6.11` | clickhouse-01 | 4 | 8192 | 80 |
| clickhouse-02 | clickhouse | `10.0.6.12` | clickhouse-02 | 4 | 8192 | 80 |
| clickhouse-03 | clickhouse | `10.0.6.13` | clickhouse-03 | 4 | 8192 | 80 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [replicated-keeper-ha-provisioned.json](../../workflows/databases/clickhouse/replicated-keeper-ha-provisioned.json) |
| high-availability | existing | [replicated-keeper-ha-existing.json](../../workflows/databases/clickhouse/replicated-keeper-ha-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
