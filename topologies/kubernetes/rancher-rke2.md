# Rancher RKE2 Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `kubernetes`
- Workflow path: `workflows/kubernetes/rancher-rke2`
- Stack network: `10.0.97.0/24`
- Gateway: `10.0.97.1`
- Single-node IP: `10.0.97.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.97.1"]
  single["rke2-single-01<br/>rke2_server<br/>10.0.97.50"]
  health["Health check<br/>Rancher RKE2"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| rke2-single-01 | rke2_server | `10.0.97.50` | rke2-single-01 | 4 | 8192 | 100 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-server-provisioned.json](../../workflows/kubernetes/rancher-rke2/single-server-provisioned.json) |
| single-node | existing | [single-server-existing.json](../../workflows/kubernetes/rancher-rke2/single-server-existing.json) |

## High-Availability Topologies

### Rancher RKE2 HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.97.1"]
  subgraph stack_block["Rancher RKE2 HA - 10.0.97.0/24"]
    direction LR
    subgraph role_0["rke2_server"]
      direction TB
      n0["rke2-server-01<br/>10.0.97.11"]
      n1["rke2-server-02<br/>10.0.97.12"]
      n2["rke2-server-03<br/>10.0.97.13"]
    end
    subgraph role_1["rke2_agent"]
      direction TB
      n3["rke2-agent-01<br/>10.0.97.21"]
      n4["rke2-agent-02<br/>10.0.97.22"]
    end
  end
  workflow --> gateway
  gateway --> n0
  gateway --> n1
  gateway --> n2
  gateway --> n3
  gateway --> n4
  n0 <-->|peer| n1
  n1 <-->|peer| n2
  n3 <-->|peer| n4
  n0 -. service path .-> n3
```

#### HA Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| rke2-server-01 | rke2_server | `10.0.97.11` | rke2-server-01 | 4 | 8192 | 120 |
| rke2-server-02 | rke2_server | `10.0.97.12` | rke2-server-02 | 4 | 8192 | 120 |
| rke2-server-03 | rke2_server | `10.0.97.13` | rke2-server-03 | 4 | 8192 | 120 |
| rke2-agent-01 | rke2_agent | `10.0.97.21` | rke2-agent-01 | 4 | 8192 | 120 |
| rke2-agent-02 | rke2_agent | `10.0.97.22` | rke2-agent-02 | 4 | 8192 | 120 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [ha-server-agent-provisioned.json](../../workflows/kubernetes/rancher-rke2/ha-server-agent-provisioned.json) |
| high-availability | existing | [ha-server-agent-existing.json](../../workflows/kubernetes/rancher-rke2/ha-server-agent-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
