# InfluxDB Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `databases`
- Workflow path: `workflows/databases/influxdb`
- Stack network: `10.0.12.0/24`
- Gateway: `10.0.12.1`
- Single-node IP: `10.0.12.50`
- HA status: Not generated
- HA note: Not generated; the OSS InfluxDB v2 container profile does not provide a built-in clustered HA topology.

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.12.1"]
  single["influxdb-single-01<br/>influxdb<br/>10.0.12.50"]
  health["Health check<br/>InfluxDB"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| influxdb-single-01 | influxdb | `10.0.12.50` | influxdb-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/databases/influxdb/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/databases/influxdb/single-node-existing.json) |

## High-Availability Topologies

Not generated; the OSS InfluxDB v2 container profile does not provide a built-in clustered HA topology.

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
