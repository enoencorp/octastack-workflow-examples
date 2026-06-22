# Valkey Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `cache`
- Workflow path: `workflows/cache/valkey`
- Stack network: `10.0.66.0/24`
- Gateway: `10.0.66.1`
- Single-node IP: `10.0.66.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.66.1"]
  single["valkey-single-01<br/>cache<br/>10.0.66.50"]
  health["Health check<br/>Valkey"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| valkey-single-01 | cache | `10.0.66.50` | valkey-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/cache/valkey/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/cache/valkey/single-node-existing.json) |

## High-Availability Topologies

### Valkey Sentinel HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.66.1"]
  subgraph stack_block["Valkey Sentinel HA - 10.0.66.0/24"]
    direction LR
    subgraph role_0["cache"]
      direction TB
      n0["valkey-01<br/>10.0.66.11"]
      n1["valkey-02<br/>10.0.66.12"]
      n2["valkey-03<br/>10.0.66.13"]
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
| valkey-01 | cache | `10.0.66.11` | valkey-01 | 4 | 8192 | 80 |
| valkey-02 | cache | `10.0.66.12` | valkey-02 | 4 | 8192 | 80 |
| valkey-03 | cache | `10.0.66.13` | valkey-03 | 4 | 8192 | 80 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [sentinel-ha-provisioned.json](../../workflows/cache/valkey/sentinel-ha-provisioned.json) |
| high-availability | existing | [sentinel-ha-existing.json](../../workflows/cache/valkey/sentinel-ha-existing.json) |

### Valkey Cluster HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.66.1"]
  subgraph stack_block["Valkey Cluster HA - 10.0.66.0/24"]
    direction LR
    subgraph role_0["cache"]
      direction TB
      n0["valkey-01<br/>10.0.66.11"]
      n1["valkey-02<br/>10.0.66.12"]
      n2["valkey-03<br/>10.0.66.13"]
      n3["valkey-04<br/>10.0.66.14"]
      n4["valkey-05<br/>10.0.66.15"]
      n5["valkey-06<br/>10.0.66.16"]
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
| valkey-01 | cache | `10.0.66.11` | valkey-01 | 4 | 8192 | 80 |
| valkey-02 | cache | `10.0.66.12` | valkey-02 | 4 | 8192 | 80 |
| valkey-03 | cache | `10.0.66.13` | valkey-03 | 4 | 8192 | 80 |
| valkey-04 | cache | `10.0.66.14` | valkey-04 | 4 | 8192 | 80 |
| valkey-05 | cache | `10.0.66.15` | valkey-05 | 4 | 8192 | 80 |
| valkey-06 | cache | `10.0.66.16` | valkey-06 | 4 | 8192 | 80 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [cluster-ha-provisioned.json](../../workflows/cache/valkey/cluster-ha-provisioned.json) |
| high-availability | existing | [cluster-ha-existing.json](../../workflows/cache/valkey/cluster-ha-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
