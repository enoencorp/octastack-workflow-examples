# MariaDB Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `databases`
- Workflow path: `workflows/databases/mariadb`
- Stack network: `10.0.2.0/24`
- Gateway: `10.0.2.1`
- Single-node IP: `10.0.2.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.2.1"]
  single["mariadb-single-01<br/>mariadb<br/>10.0.2.50"]
  health["Health check<br/>MariaDB"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| mariadb-single-01 | mariadb | `10.0.2.50` | mariadb-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/databases/mariadb/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/databases/mariadb/single-node-existing.json) |

## High-Availability Topologies

### MariaDB Galera HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.2.1"]
  subgraph stack_block["MariaDB Galera HA - 10.0.2.0/24"]
    direction LR
    subgraph role_0["mariadb"]
      direction TB
      n0["mariadb-01<br/>10.0.2.11"]
      n1["mariadb-02<br/>10.0.2.12"]
      n2["mariadb-03<br/>10.0.2.13"]
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
| mariadb-01 | mariadb | `10.0.2.11` | mariadb-01 | 4 | 8192 | 80 |
| mariadb-02 | mariadb | `10.0.2.12` | mariadb-02 | 4 | 8192 | 80 |
| mariadb-03 | mariadb | `10.0.2.13` | mariadb-03 | 4 | 8192 | 80 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [galera-ha-provisioned.json](../../workflows/databases/mariadb/galera-ha-provisioned.json) |
| high-availability | existing | [galera-ha-existing.json](../../workflows/databases/mariadb/galera-ha-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
