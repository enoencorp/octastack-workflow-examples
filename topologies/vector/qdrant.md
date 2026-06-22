# Qdrant Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `vector`
- Workflow path: `workflows/vector/qdrant`
- Stack network: `10.0.232.0/24`
- Gateway: `10.0.232.1`
- Single-node IP: `10.0.232.50`
- HA status: Not generated
- HA note: Not generated from the standalone profile; distributed Qdrant bootstrapping is version-sensitive and should be explicit per release.

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.232.1"]
  single["qdrant-single-01<br/>vector<br/>10.0.232.50"]
  health["Health check<br/>Qdrant"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| qdrant-single-01 | vector | `10.0.232.50` | qdrant-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/vector/qdrant/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/vector/qdrant/single-node-existing.json) |

## High-Availability Topologies

Not generated from the standalone profile; distributed Qdrant bootstrapping is version-sensitive and should be explicit per release.

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
