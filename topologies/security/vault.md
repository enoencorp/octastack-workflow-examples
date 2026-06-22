# Vault Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `security`
- Workflow path: `workflows/security/vault`
- Stack network: `10.0.228.0/24`
- Gateway: `10.0.228.1`
- Single-node IP: `10.0.228.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.228.1"]
  single["vault-single-01<br/>vault<br/>10.0.228.50"]
  health["Health check<br/>Vault"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| vault-single-01 | vault | `10.0.228.50` | vault-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/security/vault/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/security/vault/single-node-existing.json) |

## High-Availability Topologies

### Vault Integrated Raft HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.228.1"]
  subgraph stack_block["Vault Integrated Raft HA - 10.0.228.0/24"]
    direction LR
    subgraph role_0["vault"]
      direction TB
      n0["vault-01<br/>10.0.228.11"]
      n1["vault-02<br/>10.0.228.12"]
      n2["vault-03<br/>10.0.228.13"]
    end
  end
  workflow --> gateway
  gateway --> n0
  gateway --> n1
  gateway --> n2
  n0 <-->|peer| n1
  n1 <-->|peer| n2
```

#### HA Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| vault-01 | vault | `10.0.228.11` | vault-01 | 4 | 8192 | 80 |
| vault-02 | vault | `10.0.228.12` | vault-02 | 4 | 8192 | 80 |
| vault-03 | vault | `10.0.228.13` | vault-03 | 4 | 8192 | 80 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [raft-ha-provisioned.json](../../workflows/security/vault/raft-ha-provisioned.json) |
| high-availability | existing | [raft-ha-existing.json](../../workflows/security/vault/raft-ha-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
