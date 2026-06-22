# MinIO Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `storage`
- Workflow path: `workflows/storage/minio`
- Stack network: `10.0.144.0/24`
- Gateway: `10.0.144.1`
- Single-node IP: `10.0.144.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.144.1"]
  single["minio-single-01<br/>minio<br/>10.0.144.50"]
  health["Health check<br/>MinIO"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| minio-single-01 | minio | `10.0.144.50` | minio-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/storage/minio/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/storage/minio/single-node-existing.json) |

## High-Availability Topologies

### MinIO Distributed Erasure Coding HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.144.1"]
  subgraph stack_block["MinIO Distributed Erasure Coding HA - 10.0.144.0/24"]
    direction LR
    subgraph role_0["minio"]
      direction TB
      n0["minio-01<br/>10.0.144.11"]
      n1["minio-02<br/>10.0.144.12"]
      n2["minio-03<br/>10.0.144.13"]
      n3["minio-04<br/>10.0.144.14"]
    end
  end
  workflow --> gateway
  gateway --> n0
  gateway --> n1
  gateway --> n2
  gateway --> n3
  n0 <-->|peer| n1
  n1 <-->|peer| n2
  n2 <-->|peer| n3
```

#### HA Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| minio-01 | minio | `10.0.144.11` | minio-01 | 4 | 8192 | 80 |
| minio-02 | minio | `10.0.144.12` | minio-02 | 4 | 8192 | 80 |
| minio-03 | minio | `10.0.144.13` | minio-03 | 4 | 8192 | 80 |
| minio-04 | minio | `10.0.144.14` | minio-04 | 4 | 8192 | 80 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [distributed-erasure-ha-provisioned.json](../../workflows/storage/minio/distributed-erasure-ha-provisioned.json) |
| high-availability | existing | [distributed-erasure-ha-existing.json](../../workflows/storage/minio/distributed-erasure-ha-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
