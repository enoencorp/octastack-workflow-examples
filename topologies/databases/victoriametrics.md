# VictoriaMetrics Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `databases`
- Workflow path: `workflows/databases/victoriametrics`
- Stack network: `10.0.13.0/24`
- Gateway: `10.0.13.1`
- Single-node IP: `10.0.13.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.13.1"]
  single["victoriametrics-single-01<br/>victoriametrics<br/>10.0.13.50"]
  health["Health check<br/>VictoriaMetrics"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| victoriametrics-single-01 | victoriametrics | `10.0.13.50` | victoriametrics-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/databases/victoriametrics/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/databases/victoriametrics/single-node-existing.json) |

## High-Availability Topologies

### VictoriaMetrics Cluster HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.13.1"]
  subgraph stack_block["VictoriaMetrics Cluster HA - 10.0.13.0/24"]
    direction LR
    subgraph role_0["vmstorage"]
      direction TB
      n0["victoriametrics-storage-01<br/>10.0.13.11"]
      n1["victoriametrics-storage-02<br/>10.0.13.12"]
      n2["victoriametrics-storage-03<br/>10.0.13.13"]
    end
    subgraph role_1["vmselect"]
      direction TB
      n3["victoriametrics-select-01<br/>10.0.13.21"]
      n4["victoriametrics-select-02<br/>10.0.13.22"]
    end
    subgraph role_2["vminsert"]
      direction TB
      n5["victoriametrics-insert-01<br/>10.0.13.31"]
      n6["victoriametrics-insert-02<br/>10.0.13.32"]
    end
  end
  workflow --> gateway
  gateway --> n0
  gateway --> n1
  gateway --> n2
  gateway --> n3
  gateway --> n4
  gateway --> n5
  gateway --> n6
  n0 <-->|peer| n1
  n1 <-->|peer| n2
  n3 <-->|peer| n4
  n5 <-->|peer| n6
  n0 -. service path .-> n3
  n3 -. service path .-> n5
```

#### HA Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| victoriametrics-storage-01 | vmstorage | `10.0.13.11` | victoriametrics-storage-01 | 4 | 8192 | 200 |
| victoriametrics-storage-02 | vmstorage | `10.0.13.12` | victoriametrics-storage-02 | 4 | 8192 | 200 |
| victoriametrics-storage-03 | vmstorage | `10.0.13.13` | victoriametrics-storage-03 | 4 | 8192 | 200 |
| victoriametrics-select-01 | vmselect | `10.0.13.21` | victoriametrics-select-01 | 2 | 4096 | 40 |
| victoriametrics-select-02 | vmselect | `10.0.13.22` | victoriametrics-select-02 | 2 | 4096 | 40 |
| victoriametrics-insert-01 | vminsert | `10.0.13.31` | victoriametrics-insert-01 | 2 | 4096 | 40 |
| victoriametrics-insert-02 | vminsert | `10.0.13.32` | victoriametrics-insert-02 | 2 | 4096 | 40 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [cluster-ha-provisioned.json](../../workflows/databases/victoriametrics/cluster-ha-provisioned.json) |
| high-availability | existing | [cluster-ha-existing.json](../../workflows/databases/victoriametrics/cluster-ha-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
