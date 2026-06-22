# CouchDB Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `databases`
- Workflow path: `workflows/databases/couchdb`
- Stack network: `10.0.11.0/24`
- Gateway: `10.0.11.1`
- Single-node IP: `10.0.11.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.11.1"]
  single["couchdb-single-01<br/>couchdb<br/>10.0.11.50"]
  health["Health check<br/>CouchDB"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| couchdb-single-01 | couchdb | `10.0.11.50` | couchdb-single-01 | 4 | 8192 | 80 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [single-node-provisioned.json](../../workflows/databases/couchdb/single-node-provisioned.json) |
| single-node | existing | [single-node-existing.json](../../workflows/databases/couchdb/single-node-existing.json) |

## High-Availability Topologies

### CouchDB Native Cluster HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.11.1"]
  subgraph stack_block["CouchDB Native Cluster HA - 10.0.11.0/24"]
    direction LR
    subgraph role_0["couchdb"]
      direction TB
      n0["couchdb-01<br/>10.0.11.11"]
      n1["couchdb-02<br/>10.0.11.12"]
      n2["couchdb-03<br/>10.0.11.13"]
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
| couchdb-01 | couchdb | `10.0.11.11` | couchdb-01 | 4 | 8192 | 80 |
| couchdb-02 | couchdb | `10.0.11.12` | couchdb-02 | 4 | 8192 | 80 |
| couchdb-03 | couchdb | `10.0.11.13` | couchdb-03 | 4 | 8192 | 80 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [native-cluster-ha-provisioned.json](../../workflows/databases/couchdb/native-cluster-ha-provisioned.json) |
| high-availability | existing | [native-cluster-ha-existing.json](../../workflows/databases/couchdb/native-cluster-ha-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
