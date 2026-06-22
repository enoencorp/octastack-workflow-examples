# ZooKeeper Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `coordination`
- Workflow path: `workflows/coordination/zookeeper`
- Stack network: `10.0.162.0/24`
- Gateway: `10.0.162.1`
- Single-node IP: `10.0.162.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.162.1"]
  single["zookeeper-single-01<br/>zookeeper<br/>10.0.162.50"]
  health["Health check<br/>ZooKeeper"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| zookeeper-single-01 | zookeeper | `10.0.162.50` | zookeeper-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/coordination/zookeeper/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/coordination/zookeeper/single-node-existing.json) |

## High-Availability Topologies

### ZooKeeper Ensemble HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.162.1"]
  subgraph stack_block["ZooKeeper Ensemble HA - 10.0.162.0/24"]
    direction LR
    subgraph role_0["zookeeper"]
      direction TB
      n0["zookeeper-01<br/>10.0.162.11"]
      n1["zookeeper-02<br/>10.0.162.12"]
      n2["zookeeper-03<br/>10.0.162.13"]
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
| zookeeper-01 | zookeeper | `10.0.162.11` | zookeeper-01 | 4 | 8192 | 80 |
| zookeeper-02 | zookeeper | `10.0.162.12` | zookeeper-02 | 4 | 8192 | 80 |
| zookeeper-03 | zookeeper | `10.0.162.13` | zookeeper-03 | 4 | 8192 | 80 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [ensemble-ha-provisioned.json](../../workflows/coordination/zookeeper/ensemble-ha-provisioned.json) |
| high-availability | existing | [ensemble-ha-existing.json](../../workflows/coordination/zookeeper/ensemble-ha-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
