# Weaviate Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `vector`
- Workflow path: `workflows/vector/weaviate`
- Stack network: `10.0.233.0/24`
- Gateway: `10.0.233.1`
- Single-node IP: `10.0.233.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.233.1"]
  single["weaviate-single-01<br/>vector<br/>10.0.233.50"]
  health["Health check<br/>Weaviate"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| weaviate-single-01 | vector | `10.0.233.50` | weaviate-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/vector/weaviate/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/vector/weaviate/single-node-existing.json) |

## High-Availability Topologies

### Weaviate Cluster HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.233.1"]
  subgraph stack_block["Weaviate Cluster HA - 10.0.233.0/24"]
    direction LR
    subgraph role_0["vector"]
      direction TB
      n0["weaviate-01<br/>10.0.233.11"]
      n1["weaviate-02<br/>10.0.233.12"]
      n2["weaviate-03<br/>10.0.233.13"]
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
| weaviate-01 | vector | `10.0.233.11` | weaviate-01 | 4 | 8192 | 80 |
| weaviate-02 | vector | `10.0.233.12` | weaviate-02 | 4 | 8192 | 80 |
| weaviate-03 | vector | `10.0.233.13` | weaviate-03 | 4 | 8192 | 80 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [cluster-ha-provisioned.json](../../workflows/vector/weaviate/cluster-ha-provisioned.json) |
| high-availability | existing | [cluster-ha-existing.json](../../workflows/vector/weaviate/cluster-ha-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
