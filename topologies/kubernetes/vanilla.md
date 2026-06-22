# Vanilla Kubernetes Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `kubernetes`
- Workflow path: `workflows/kubernetes/vanilla`
- Stack network: `10.0.96.0/24`
- Gateway: `10.0.96.1`
- Single-node IP: `10.0.96.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.96.1"]
  single["k8s-cp-single-01<br/>control_plane<br/>10.0.96.50"]
  health["Health check<br/>Vanilla Kubernetes"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| k8s-cp-single-01 | control_plane | `10.0.96.50` | k8s-single-cp-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-control-plane-provisioned.json](../../workflows/kubernetes/vanilla/single-control-plane-provisioned.json) |
| single-node | existing | [single-control-plane-existing.json](../../workflows/kubernetes/vanilla/single-control-plane-existing.json) |

## High-Availability Topologies

### Vanilla Kubernetes HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.96.1"]
  subgraph stack_block["Vanilla Kubernetes HA - 10.0.96.0/24"]
    direction LR
    subgraph role_0["control_plane"]
      direction TB
      n0["k8s-cp-01<br/>10.0.96.11"]
      n1["k8s-cp-02<br/>10.0.96.12"]
      n2["k8s-cp-03<br/>10.0.96.13"]
    end
    subgraph role_1["worker"]
      direction TB
      n3["k8s-worker-01<br/>10.0.96.21"]
      n4["k8s-worker-02<br/>10.0.96.22"]
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
| k8s-cp-01 | control_plane | `10.0.96.11` | k8s-cp-01 | 4 | 8192 | 100 |
| k8s-cp-02 | control_plane | `10.0.96.12` | k8s-cp-02 | 4 | 8192 | 100 |
| k8s-cp-03 | control_plane | `10.0.96.13` | k8s-cp-03 | 4 | 8192 | 100 |
| k8s-worker-01 | worker | `10.0.96.21` | k8s-worker-01 | 4 | 8192 | 120 |
| k8s-worker-02 | worker | `10.0.96.22` | k8s-worker-02 | 4 | 8192 | 120 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [ha-control-plane-provisioned.json](../../workflows/kubernetes/vanilla/ha-control-plane-provisioned.json) |
| high-availability | existing | [ha-control-plane-existing.json](../../workflows/kubernetes/vanilla/ha-control-plane-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
