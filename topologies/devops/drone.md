# Drone CI Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `devops`
- Workflow path: `workflows/devops/drone`
- Stack network: `10.0.213.0/24`
- Gateway: `10.0.213.1`
- Single-node IP: `10.0.213.50`
- HA status: Not generated
- HA note: Not generated; this Drone profile is tied to one server/data volume and does not express a catalog-safe HA topology.

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.213.1"]
  single["drone-ci-single-01<br/>ci<br/>10.0.213.50"]
  health["Health check<br/>Drone CI"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| drone-ci-single-01 | ci | `10.0.213.50` | drone-ci-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/devops/drone/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/devops/drone/single-node-existing.json) |

## High-Availability Topologies

Not generated; this Drone profile is tied to one server/data volume and does not express a catalog-safe HA topology.

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
