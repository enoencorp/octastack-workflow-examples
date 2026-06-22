# Keycloak Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `identity`
- Workflow path: `workflows/identity/keycloak`
- Stack network: `10.0.224.0/24`
- Gateway: `10.0.224.1`
- Single-node IP: `10.0.224.50`
- HA status: Not generated
- HA note: Not generated from the start-dev profile; production Keycloak HA requires external database/cache, TLS, and hostname hardening.

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.224.1"]
  single["keycloak-single-01<br/>identity<br/>10.0.224.50"]
  health["Health check<br/>Keycloak"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| keycloak-single-01 | identity | `10.0.224.50` | keycloak-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/identity/keycloak/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/identity/keycloak/single-node-existing.json) |

## High-Availability Topologies

Not generated from the start-dev profile; production Keycloak HA requires external database/cache, TLS, and hostname hardening.

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
