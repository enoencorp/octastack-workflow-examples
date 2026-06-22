# Kafka Topology

This document is generated from `tools/generate-library.mjs`. It describes the logical topology shared by the provisioned and existing-infrastructure workflow variants.

## Stack Summary

- Domain: `messaging`
- Workflow path: `workflows/messaging/kafka`
- Stack network: `10.0.80.0/24`
- Gateway: `10.0.80.1`
- Single-node IP: `10.0.80.50`
- HA status: Generated

## Single-Node Topology

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.80.1"]
  single["kafka-single-01<br/>broker<br/>10.0.80.50"]
  health["Health check<br/>Kafka"]
  workflow --> gateway
  gateway --> single
  single --> health
```

### Single-Node Inventory

| Node | Role | IP address | VM name | CPU | Memory MB | Disk GB |
| --- | --- | --- | --- | --- | --- | --- |
| kafka-single-01 | broker | `10.0.80.50` | kafka-single-01 | 4 | 8192 | 100 |

### Single-Node Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| single-node | provisioned | [kraft-single-node-provisioned.json](../../workflows/messaging/kafka/kraft-single-node-provisioned.json) |
| single-node | existing | [kraft-single-node-existing.json](../../workflows/messaging/kafka/kraft-single-node-existing.json) |

## High-Availability Topologies

### Kafka KRaft HA

```mermaid
flowchart LR
  workflow["OctaStack workflow<br/>provisioned or existing"]
  gateway["Gateway<br/>10.0.80.1"]
  subgraph stack_block["Kafka KRaft HA - 10.0.80.0/24"]
    direction LR
    subgraph role_0["broker"]
      direction TB
      n0["kafka-01<br/>10.0.80.11"]
      n1["kafka-02<br/>10.0.80.12"]
      n2["kafka-03<br/>10.0.80.13"]
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
| kafka-01 | broker | `10.0.80.11` | kafka-ha-01 | 4 | 8192 | 150 |
| kafka-02 | broker | `10.0.80.12` | kafka-ha-02 | 4 | 8192 | 150 |
| kafka-03 | broker | `10.0.80.13` | kafka-ha-03 | 4 | 8192 | 150 |

#### HA Workflows

| Pattern | Provisioning | Workflow |
| --- | --- | --- |
| high-availability | provisioned | [kraft-ha-provisioned.json](../../workflows/messaging/kafka/kraft-ha-provisioned.json) |
| high-availability | existing | [kraft-ha-existing.json](../../workflows/messaging/kafka/kraft-ha-existing.json) |

## Addressing Rules

- The stack receives one `/24` from the parent `10.0.0.0/16` plan.
- `.1` is the example gateway.
- `.11-.49` are reserved for HA members and grouped by role in blocks of ten.
- `.50` is reserved for the single-node target.
