# Memcached Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `cache`
- Workflow path: `workflows/cache/memcached`
- Stack network: `10.0.65.0/24`
- Gateway: `10.0.65.1`
- Single-node IP: `10.0.65.50`
- HA status: Not generated
- HA note: Not generated; Memcached HA is client-side sharding/replication rather than a server-side clustered workflow.

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.65.1"]
  single["memcached-single-01<br/>cache<br/>10.0.65.50"]
  health["Health check<br/>Memcached"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| memcached-single-01 | cache | `10.0.65.50` | memcached-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/cache/memcached/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/cache/memcached/single-node-existing.json) |

## High-Availability Topologies

Not generated; Memcached HA is client-side sharding/replication rather than a server-side clustered workflow.

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
