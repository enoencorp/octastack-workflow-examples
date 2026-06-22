# ActiveMQ Artemis Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `messaging`
- Workflow path: `workflows/messaging/activemq-artemis`
- Stack network: `10.0.85.0/24`
- Gateway: `10.0.85.1`
- Single-node IP: `10.0.85.50`
- HA status: Not generated
- HA note: Not generated; live/backup or broker-cluster HA requires topology-specific storage and quorum decisions outside this generic container profile.

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.85.1"]
  single["activemq-artemis-single-01<br/>artemis<br/>10.0.85.50"]
  health["Health check<br/>ActiveMQ Artemis"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| activemq-artemis-single-01 | artemis | `10.0.85.50` | activemq-artemis-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/messaging/activemq-artemis/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/messaging/activemq-artemis/single-node-existing.json) |

## High-Availability Topologies

Not generated; live/backup or broker-cluster HA requires topology-specific storage and quorum decisions outside this generic container profile.

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
