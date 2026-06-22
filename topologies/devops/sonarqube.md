# SonarQube Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `devops`
- Workflow path: `workflows/devops/sonarqube`
- Stack network: `10.0.211.0/24`
- Gateway: `10.0.211.1`
- Single-node IP: `10.0.211.50`
- HA status: Not generated
- HA note: Not generated; SonarQube HA requires Data Center style topology, not the community container profile.

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.211.1"]
  single["sonarqube-single-01<br/>quality<br/>10.0.211.50"]
  health["Health check<br/>SonarQube"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| sonarqube-single-01 | quality | `10.0.211.50` | sonarqube-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/devops/sonarqube/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/devops/sonarqube/single-node-existing.json) |

## High-Availability Topologies

Not generated; SonarQube HA requires Data Center style topology, not the community container profile.

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
