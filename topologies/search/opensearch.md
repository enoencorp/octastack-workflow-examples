# OpenSearch Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `search`
- Workflow path: `workflows/search/opensearch`
- Stack network: `10.0.128.0/24`
- Gateway: `10.0.128.1`
- Single-node IP: `10.0.128.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.128.1"]
  single["opensearch-single-01<br/>opensearch<br/>10.0.128.50"]
  health["Health check<br/>OpenSearch"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| opensearch-single-01 | opensearch | `10.0.128.50` | opensearch-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/search/opensearch/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/search/opensearch/single-node-existing.json) |

## High-Availability Topologies

### OpenSearch Cluster HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.128.1"]
  subgraph stack_block["OpenSearch Cluster HA - 10.0.128.0/24"]
    direction LR
    subgraph role_0["opensearch"]
      direction TB
      n0["opensearch-01<br/>10.0.128.11"]
      n1["opensearch-02<br/>10.0.128.12"]
      n2["opensearch-03<br/>10.0.128.13"]
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
| opensearch-01 | opensearch | `10.0.128.11` | opensearch-01 | 4 | 8192 | 80 |
| opensearch-02 | opensearch | `10.0.128.12` | opensearch-02 | 4 | 8192 | 80 |
| opensearch-03 | opensearch | `10.0.128.13` | opensearch-03 | 4 | 8192 | 80 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [cluster-ha-provisioned.json](../../workflows/search/opensearch/cluster-ha-provisioned.json) |
| high-availability | existing | [cluster-ha-existing.json](../../workflows/search/opensearch/cluster-ha-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
