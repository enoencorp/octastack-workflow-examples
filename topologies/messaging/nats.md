# NATS JetStream Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `messaging`
- Workflow path: `workflows/messaging/nats`
- Stack network: `10.0.82.0/24`
- Gateway: `10.0.82.1`
- Single-node IP: `10.0.82.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.82.1"]
  single["nats-jetstream-single-01<br/>nats<br/>10.0.82.50"]
  health["Health check<br/>NATS JetStream"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| nats-jetstream-single-01 | nats | `10.0.82.50` | nats-jetstream-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/messaging/nats/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/messaging/nats/single-node-existing.json) |

## High-Availability Topologies

### NATS JetStream Cluster HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.82.1"]
  subgraph stack_block["NATS JetStream Cluster HA - 10.0.82.0/24"]
    direction LR
    subgraph role_0["nats"]
      direction TB
      n0["nats-jetstream-01<br/>10.0.82.11"]
      n1["nats-jetstream-02<br/>10.0.82.12"]
      n2["nats-jetstream-03<br/>10.0.82.13"]
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
| nats-jetstream-01 | nats | `10.0.82.11` | nats-jetstream-01 | 4 | 8192 | 80 |
| nats-jetstream-02 | nats | `10.0.82.12` | nats-jetstream-02 | 4 | 8192 | 80 |
| nats-jetstream-03 | nats | `10.0.82.13` | nats-jetstream-03 | 4 | 8192 | 80 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [jetstream-cluster-ha-provisioned.json](../../workflows/messaging/nats/jetstream-cluster-ha-provisioned.json) |
| high-availability | existing | [jetstream-cluster-ha-existing.json](../../workflows/messaging/nats/jetstream-cluster-ha-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
