# TimescaleDB Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `databases`
- Workflow path: `workflows/databases/timescaledb`
- Stack network: `10.0.7.0/24`
- Gateway: `10.0.7.1`
- Single-node IP: `10.0.7.50`
- HA status: Not generated
- HA note: Not generated in this catalog scope; TimescaleDB HA should be built on the PostgreSQL Patroni pattern with extension/package hardening.

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.7.1"]
  single["timescaledb-single-01<br/>timescaledb<br/>10.0.7.50"]
  health["Health check<br/>TimescaleDB"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| timescaledb-single-01 | timescaledb | `10.0.7.50` | timescaledb-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/databases/timescaledb/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/databases/timescaledb/single-node-existing.json) |

## High-Availability Topologies

Not generated in this catalog scope; TimescaleDB HA should be built on the PostgreSQL Patroni pattern with extension/package hardening.

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
