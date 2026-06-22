# MySQL Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `databases`
- Workflow path: `workflows/databases/mysql`
- Stack network: `10.0.1.0/24`
- Gateway: `10.0.1.1`
- Single-node IP: `10.0.1.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.1.1"]
  single["mysql-single-01<br/>mysql<br/>10.0.1.50"]
  health["Health check<br/>MySQL"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| mysql-single-01 | mysql | `10.0.1.50` | mysql-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/databases/mysql/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/databases/mysql/single-node-existing.json) |

## High-Availability Topologies

### MySQL Group Replication HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.1.1"]
  subgraph stack_block["MySQL Group Replication HA - 10.0.1.0/24"]
    direction LR
    subgraph role_0["mysql"]
      direction TB
      n0["mysql-01<br/>10.0.1.11"]
      n1["mysql-02<br/>10.0.1.12"]
      n2["mysql-03<br/>10.0.1.13"]
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
| mysql-01 | mysql | `10.0.1.11` | mysql-01 | 4 | 8192 | 80 |
| mysql-02 | mysql | `10.0.1.12` | mysql-02 | 4 | 8192 | 80 |
| mysql-03 | mysql | `10.0.1.13` | mysql-03 | 4 | 8192 | 80 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [group-replication-ha-provisioned.json](../../workflows/databases/mysql/group-replication-ha-provisioned.json) |
| high-availability | existing | [group-replication-ha-existing.json](../../workflows/databases/mysql/group-replication-ha-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
