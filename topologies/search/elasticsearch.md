# Elasticsearch Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `search`
- Workflow path: `workflows/search/elasticsearch`
- Stack network: `10.0.129.0/24`
- Gateway: `10.0.129.1`
- Single-node IP: `10.0.129.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.129.1"]
  single["elasticsearch-single-01<br/>elasticsearch<br/>10.0.129.50"]
  health["Health check<br/>Elasticsearch"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| elasticsearch-single-01 | elasticsearch | `10.0.129.50` | elasticsearch-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/search/elasticsearch/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/search/elasticsearch/single-node-existing.json) |

## High-Availability Topologies

### Elasticsearch Cluster HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.129.1"]
  subgraph stack_block["Elasticsearch Cluster HA - 10.0.129.0/24"]
    direction LR
    subgraph role_0["elasticsearch"]
      direction TB
      n0["elasticsearch-01<br/>10.0.129.11"]
      n1["elasticsearch-02<br/>10.0.129.12"]
      n2["elasticsearch-03<br/>10.0.129.13"]
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
| elasticsearch-01 | elasticsearch | `10.0.129.11` | elasticsearch-01 | 4 | 8192 | 80 |
| elasticsearch-02 | elasticsearch | `10.0.129.12` | elasticsearch-02 | 4 | 8192 | 80 |
| elasticsearch-03 | elasticsearch | `10.0.129.13` | elasticsearch-03 | 4 | 8192 | 80 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [cluster-ha-provisioned.json](../../workflows/search/elasticsearch/cluster-ha-provisioned.json) |
| high-availability | existing | [cluster-ha-existing.json](../../workflows/search/elasticsearch/cluster-ha-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
