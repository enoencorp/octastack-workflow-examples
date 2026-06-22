# Apache HTTPD Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `web`
- Workflow path: `workflows/web/apache-httpd`
- Stack network: `10.0.241.0/24`
- Gateway: `10.0.241.1`
- Single-node IP: `10.0.241.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.241.1"]
  single["apache-httpd-single-01<br/>web<br/>10.0.241.50"]
  health["Health check<br/>Apache HTTPD"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| apache-httpd-single-01 | web | `10.0.241.50` | apache-httpd-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/web/apache-httpd/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/web/apache-httpd/single-node-existing.json) |

## High-Availability Topologies

### Apache HTTPD Active-Active Web HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.241.1"]
  subgraph stack_block["Apache HTTPD Active-Active Web HA - 10.0.241.0/24"]
    direction LR
    subgraph role_0["web"]
      direction TB
      n0["apache-httpd-01<br/>10.0.241.11"]
      n1["apache-httpd-02<br/>10.0.241.12"]
    end
  end
  workflow --> gateway
  gateway --> n0
  gateway --> n1
  n0 <-->|peer| n1
```

#### HA Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| apache-httpd-01 | web | `10.0.241.11` | apache-httpd-01 | 4 | 8192 | 80 |
| apache-httpd-02 | web | `10.0.241.12` | apache-httpd-02 | 4 | 8192 | 80 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [active-active-ha-provisioned.json](../../workflows/web/apache-httpd/active-active-ha-provisioned.json) |
| high-availability | existing | [active-active-ha-existing.json](../../workflows/web/apache-httpd/active-active-ha-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
