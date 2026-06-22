# etcd Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `coordination`
- Workflow path: `workflows/coordination/etcd`
- Stack network: `10.0.160.0/24`
- Gateway: `10.0.160.1`
- Single-node IP: `10.0.160.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.160.1"]
  single["etcd-single-01<br/>etcd<br/>10.0.160.50"]
  health["Health check<br/>etcd"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| etcd-single-01 | etcd | `10.0.160.50` | etcd-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/coordination/etcd/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/coordination/etcd/single-node-existing.json) |

## High-Availability Topologies

### etcd Quorum Cluster HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.160.1"]
  subgraph stack_block["etcd Quorum Cluster HA - 10.0.160.0/24"]
    direction LR
    subgraph role_0["etcd"]
      direction TB
      n0["etcd-01<br/>10.0.160.11"]
      n1["etcd-02<br/>10.0.160.12"]
      n2["etcd-03<br/>10.0.160.13"]
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
| etcd-01 | etcd | `10.0.160.11` | etcd-01 | 4 | 8192 | 80 |
| etcd-02 | etcd | `10.0.160.12` | etcd-02 | 4 | 8192 | 80 |
| etcd-03 | etcd | `10.0.160.13` | etcd-03 | 4 | 8192 | 80 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [quorum-cluster-ha-provisioned.json](../../workflows/coordination/etcd/quorum-cluster-ha-provisioned.json) |
| high-availability | existing | [quorum-cluster-ha-existing.json](../../workflows/coordination/etcd/quorum-cluster-ha-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
