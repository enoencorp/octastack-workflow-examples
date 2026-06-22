# Redis Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `cache`
- Workflow path: `workflows/cache/redis`
- Stack network: `10.0.64.0/24`
- Gateway: `10.0.64.1`
- Single-node IP: `10.0.64.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.64.1"]
  single["redis-single-01<br/>redis<br/>10.0.64.50"]
  health["Health check<br/>Redis"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| redis-single-01 | redis | `10.0.64.50` | redis-single-01 | 2 | 4096 | 40 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/cache/redis/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/cache/redis/single-node-existing.json) |

## High-Availability Topologies

### Redis Sentinel HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.64.1"]
  subgraph stack_block["Redis Sentinel HA - 10.0.64.0/24"]
    direction LR
    subgraph role_0["redis"]
      direction TB
      n0["redis-01<br/>10.0.64.11"]
      n1["redis-02<br/>10.0.64.12"]
      n2["redis-03<br/>10.0.64.13"]
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
| redis-01 | redis | `10.0.64.11` | redis-ha-01 | 2 | 4096 | 50 |
| redis-02 | redis | `10.0.64.12` | redis-ha-02 | 2 | 4096 | 50 |
| redis-03 | redis | `10.0.64.13` | redis-ha-03 | 2 | 4096 | 50 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [sentinel-ha-provisioned.json](../../workflows/cache/redis/sentinel-ha-provisioned.json) |
| high-availability | existing | [sentinel-ha-existing.json](../../workflows/cache/redis/sentinel-ha-existing.json) |

### Redis Cluster HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.64.1"]
  subgraph stack_block["Redis Cluster HA - 10.0.64.0/24"]
    direction LR
    subgraph role_0["redis"]
      direction TB
      n0["redis-cluster-01<br/>10.0.64.11"]
      n1["redis-cluster-02<br/>10.0.64.12"]
      n2["redis-cluster-03<br/>10.0.64.13"]
      n3["redis-cluster-04<br/>10.0.64.14"]
      n4["redis-cluster-05<br/>10.0.64.15"]
      n5["redis-cluster-06<br/>10.0.64.16"]
    end
  end
  workflow --> gateway
  gateway --> n0
  gateway --> n1
  gateway --> n2
  gateway --> n3
  gateway --> n4
  gateway --> n5
  n0 <-->|peer| n1
  n1 <-->|peer| n2
  n2 <-->|peer| n3
  n3 <-->|peer| n4
  n4 <-->|peer| n5
```

#### HA Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| redis-cluster-01 | redis | `10.0.64.11` | redis-cluster-01 | 2 | 4096 | 50 |
| redis-cluster-02 | redis | `10.0.64.12` | redis-cluster-02 | 2 | 4096 | 50 |
| redis-cluster-03 | redis | `10.0.64.13` | redis-cluster-03 | 2 | 4096 | 50 |
| redis-cluster-04 | redis | `10.0.64.14` | redis-cluster-04 | 2 | 4096 | 50 |
| redis-cluster-05 | redis | `10.0.64.15` | redis-cluster-05 | 2 | 4096 | 50 |
| redis-cluster-06 | redis | `10.0.64.16` | redis-cluster-06 | 2 | 4096 | 50 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [cluster-ha-provisioned.json](../../workflows/cache/redis/cluster-ha-provisioned.json) |
| high-availability | existing | [cluster-ha-existing.json](../../workflows/cache/redis/cluster-ha-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
