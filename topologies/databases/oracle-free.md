# Oracle Database Free Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `databases`
- Workflow path: `workflows/databases/oracle-free`
- Stack network: `10.0.16.0/24`
- Gateway: `10.0.16.1`
- Single-node IP: `10.0.16.50`
- HA status: Not generated
- HA note: Not generated; Oracle RAC/Data Guard style HA is not appropriate for the Oracle Free single-container profile.

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.16.1"]
  single["oracle-database-free-single-01<br/>oracle<br/>10.0.16.50"]
  health["Health check<br/>Oracle Database Free"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| oracle-database-free-single-01 | oracle | `10.0.16.50` | oracle-database-free-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/databases/oracle-free/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/databases/oracle-free/single-node-existing.json) |

## High-Availability Topologies

Not generated; Oracle RAC/Data Guard style HA is not appropriate for the Oracle Free single-container profile.

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
