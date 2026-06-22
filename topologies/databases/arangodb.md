# ArangoDB Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `databases`
- Workflow path: `workflows/databases/arangodb`
- Stack network: `10.0.18.0/24`
- Gateway: `10.0.18.1`
- Single-node IP: `10.0.18.50`
- HA status: Not generated
- HA note: Not generated from the single-server profile; ArangoDB HA requires agency, coordinator, and DB-server role separation.

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.18.1"]
  single["arangodb-single-01<br/>arangodb<br/>10.0.18.50"]
  health["Health check<br/>ArangoDB"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| arangodb-single-01 | arangodb | `10.0.18.50` | arangodb-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/databases/arangodb/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/databases/arangodb/single-node-existing.json) |

## High-Availability Topologies

Not generated from the single-server profile; ArangoDB HA requires agency, coordinator, and DB-server role separation.

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
