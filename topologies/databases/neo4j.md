# Neo4j Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `databases`
- Workflow path: `workflows/databases/neo4j`
- Stack network: `10.0.10.0/24`
- Gateway: `10.0.10.1`
- Single-node IP: `10.0.10.50`
- HA status: Not generated
- HA note: Not generated for the community container profile; Neo4j clustering is an enterprise topology and not catalog-safe here.

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.10.1"]
  single["neo4j-single-01<br/>neo4j<br/>10.0.10.50"]
  health["Health check<br/>Neo4j"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| neo4j-single-01 | neo4j | `10.0.10.50` | neo4j-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/databases/neo4j/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/databases/neo4j/single-node-existing.json) |

## High-Availability Topologies

Not generated for the community container profile; Neo4j clustering is an enterprise topology and not catalog-safe here.

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
