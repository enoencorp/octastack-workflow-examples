# SeaweedFS Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `storage`
- Workflow path: `workflows/storage/seaweedfs`
- Stack network: `10.0.145.0/24`
- Gateway: `10.0.145.1`
- Single-node IP: `10.0.145.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.145.1"]
  single["seaweedfs-single-01<br/>object_storage<br/>10.0.145.50"]
  health["Health check<br/>SeaweedFS"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| seaweedfs-single-01 | object_storage | `10.0.145.50` | seaweedfs-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/storage/seaweedfs/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/storage/seaweedfs/single-node-existing.json) |

## High-Availability Topologies

### SeaweedFS Master Volume Filer HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.145.1"]
  subgraph stack_block["SeaweedFS Master Volume Filer HA - 10.0.145.0/24"]
    direction LR
    subgraph role_0["master"]
      direction TB
      n0["seaweed-master-01<br/>10.0.145.11"]
      n1["seaweed-master-02<br/>10.0.145.12"]
      n2["seaweed-master-03<br/>10.0.145.13"]
    end
    subgraph role_1["volume"]
      direction TB
      n3["seaweed-volume-01<br/>10.0.145.21"]
      n4["seaweed-volume-02<br/>10.0.145.22"]
    end
    subgraph role_2["filer"]
      direction TB
      n5["seaweed-filer-01<br/>10.0.145.31"]
      n6["seaweed-filer-02<br/>10.0.145.32"]
    end
  end
  workflow --> gateway
  gateway --> n0
  gateway --> n1
  gateway --> n2
  gateway --> n3
  gateway --> n4
  gateway --> n5
  gateway --> n6
  n0 <-->|peer| n1
  n1 <-->|peer| n2
  n3 <-->|peer| n4
  n5 <-->|peer| n6
  n0 -. service path .-> n3
  n3 -. service path .-> n5
```

#### HA Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| seaweed-master-01 | master | `10.0.145.11` | seaweed-master-01 | 2 | 4096 | 40 |
| seaweed-master-02 | master | `10.0.145.12` | seaweed-master-02 | 2 | 4096 | 40 |
| seaweed-master-03 | master | `10.0.145.13` | seaweed-master-03 | 2 | 4096 | 40 |
| seaweed-volume-01 | volume | `10.0.145.21` | seaweed-volume-01 | 4 | 8192 | 300 |
| seaweed-volume-02 | volume | `10.0.145.22` | seaweed-volume-02 | 4 | 8192 | 300 |
| seaweed-filer-01 | filer | `10.0.145.31` | seaweed-filer-01 | 2 | 4096 | 80 |
| seaweed-filer-02 | filer | `10.0.145.32` | seaweed-filer-02 | 2 | 4096 | 80 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [master-volume-filer-ha-provisioned.json](../../workflows/storage/seaweedfs/master-volume-filer-ha-provisioned.json) |
| high-availability | existing | [master-volume-filer-ha-existing.json](../../workflows/storage/seaweedfs/master-volume-filer-ha-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
