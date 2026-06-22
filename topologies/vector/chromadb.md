# ChromaDB Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `vector`
- Workflow path: `workflows/vector/chromadb`
- Stack network: `10.0.235.0/24`
- Gateway: `10.0.235.1`
- Single-node IP: `10.0.235.50`
- HA status: Not generated
- HA note: Not generated; this ChromaDB profile does not provide a server-side clustered HA topology.

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.235.1"]
  single["chromadb-single-01<br/>vector<br/>10.0.235.50"]
  health["Health check<br/>ChromaDB"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| chromadb-single-01 | vector | `10.0.235.50` | chromadb-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/vector/chromadb/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/vector/chromadb/single-node-existing.json) |

## High-Availability Topologies

Not generated; this ChromaDB profile does not provide a server-side clustered HA topology.

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
