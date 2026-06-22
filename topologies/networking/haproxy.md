# HAProxy Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `networking`
- Workflow path: `workflows/networking/haproxy`
- Stack network: `10.0.176.0/24`
- Gateway: `10.0.176.1`
- Single-node IP: `10.0.176.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.176.1"]
  single["haproxy-single-01<br/>load_balancer<br/>10.0.176.50"]
  health["Health check<br/>HAProxy"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| haproxy-single-01 | load_balancer | `10.0.176.50` | haproxy-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/networking/haproxy/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/networking/haproxy/single-node-existing.json) |

## High-Availability Topologies

### HAProxy Active-Active Edge HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.176.1"]
  subgraph stack_block["HAProxy Active-Active Edge HA - 10.0.176.0/24"]
    direction LR
    subgraph role_0["load_balancer"]
      direction TB
      n0["haproxy-01<br/>10.0.176.11"]
      n1["haproxy-02<br/>10.0.176.12"]
    end
  end
  workflow --> gateway
  gateway --> n0
  gateway --> n1
  n0 <-->|peer| n1
```

#### HA Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| haproxy-01 | load_balancer | `10.0.176.11` | haproxy-01 | 4 | 8192 | 80 |
| haproxy-02 | load_balancer | `10.0.176.12` | haproxy-02 | 4 | 8192 | 80 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [active-active-ha-provisioned.json](../../workflows/networking/haproxy/active-active-ha-provisioned.json) |
| high-availability | existing | [active-active-ha-existing.json](../../workflows/networking/haproxy/active-active-ha-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
