# Cassandra Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `databases`
- Workflow path: `workflows/databases/cassandra`
- Stack network: `10.0.4.0/24`
- Gateway: `10.0.4.1`
- Single-node IP: `10.0.4.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.4.1"]
  single["cassandra-single-01<br/>cassandra<br/>10.0.4.50"]
  health["Health check<br/>Cassandra"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| cassandra-single-01 | cassandra | `10.0.4.50` | cassandra-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/databases/cassandra/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/databases/cassandra/single-node-existing.json) |

## High-Availability Topologies

### Cassandra Native Ring HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.4.1"]
  subgraph stack_block["Cassandra Native Ring HA - 10.0.4.0/24"]
    direction LR
    subgraph role_0["cassandra"]
      direction TB
      n0["cassandra-01<br/>10.0.4.11"]
      n1["cassandra-02<br/>10.0.4.12"]
      n2["cassandra-03<br/>10.0.4.13"]
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
| cassandra-01 | cassandra | `10.0.4.11` | cassandra-01 | 4 | 8192 | 80 |
| cassandra-02 | cassandra | `10.0.4.12` | cassandra-02 | 4 | 8192 | 80 |
| cassandra-03 | cassandra | `10.0.4.13` | cassandra-03 | 4 | 8192 | 80 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [native-ring-ha-provisioned.json](../../workflows/databases/cassandra/native-ring-ha-provisioned.json) |
| high-availability | existing | [native-ring-ha-existing.json](../../workflows/databases/cassandra/native-ring-ha-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
