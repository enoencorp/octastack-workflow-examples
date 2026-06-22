# Consul Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `coordination`
- Workflow path: `workflows/coordination/consul`
- Stack network: `10.0.161.0/24`
- Gateway: `10.0.161.1`
- Single-node IP: `10.0.161.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.161.1"]
  single["consul-single-01<br/>consul<br/>10.0.161.50"]
  health["Health check<br/>Consul"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| consul-single-01 | consul | `10.0.161.50` | consul-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/coordination/consul/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/coordination/consul/single-node-existing.json) |

## High-Availability Topologies

### Consul Server Quorum HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.161.1"]
  subgraph stack_block["Consul Server Quorum HA - 10.0.161.0/24"]
    direction LR
    subgraph role_0["consul"]
      direction TB
      n0["consul-01<br/>10.0.161.11"]
      n1["consul-02<br/>10.0.161.12"]
      n2["consul-03<br/>10.0.161.13"]
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
| consul-01 | consul | `10.0.161.11` | consul-01 | 4 | 8192 | 80 |
| consul-02 | consul | `10.0.161.12` | consul-02 | 4 | 8192 | 80 |
| consul-03 | consul | `10.0.161.13` | consul-03 | 4 | 8192 | 80 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [server-quorum-ha-provisioned.json](../../workflows/coordination/consul/server-quorum-ha-provisioned.json) |
| high-availability | existing | [server-quorum-ha-existing.json](../../workflows/coordination/consul/server-quorum-ha-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
