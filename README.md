# OctaStack Workflow Example Library

This repository contains ready-to-adapt JSON workflow packages for OctaStack automation imports. The examples follow the package, canonical graph, and validation rules documented in `NODES.md`.

The library is organized by operational domain, then by technology. Each technology includes both simple single-node examples and high-availability examples, and each pattern is available in provisioned and existing-infrastructure variants.

## Provisioning modes

- `*-provisioned.json`: starts with `proxmoxConfigNode`, provisions VMs through `provisionNode`, waits for reachability, then installs/configures the stack.
- `*-existing.json`: skips VM creation and starts from a `serverNode`. Single-node examples target the application host directly. HA examples target an automation runner that executes an explicit inventory against pre-existing nodes.

## Catalog

| Domain | Stack | Pattern | Provisioning | File |
| --- | --- | --- | --- | --- |
| databases | PostgreSQL | single-node | provisioned | [workflows/databases/postgresql/single-node-provisioned.json](workflows/databases/postgresql/single-node-provisioned.json) |
| databases | PostgreSQL | single-node | existing | [workflows/databases/postgresql/single-node-existing.json](workflows/databases/postgresql/single-node-existing.json) |
| databases | PostgreSQL | high-availability | provisioned | [workflows/databases/postgresql/ha-patroni-etcd-provisioned.json](workflows/databases/postgresql/ha-patroni-etcd-provisioned.json) |
| databases | PostgreSQL | high-availability | existing | [workflows/databases/postgresql/ha-patroni-etcd-existing.json](workflows/databases/postgresql/ha-patroni-etcd-existing.json) |
| cache | Redis | single-node | provisioned | [workflows/cache/redis/single-node-provisioned.json](workflows/cache/redis/single-node-provisioned.json) |
| cache | Redis | single-node | existing | [workflows/cache/redis/single-node-existing.json](workflows/cache/redis/single-node-existing.json) |
| cache | Redis | high-availability | provisioned | [workflows/cache/redis/sentinel-ha-provisioned.json](workflows/cache/redis/sentinel-ha-provisioned.json) |
| cache | Redis | high-availability | existing | [workflows/cache/redis/sentinel-ha-existing.json](workflows/cache/redis/sentinel-ha-existing.json) |
| messaging | Kafka | single-node | provisioned | [workflows/messaging/kafka/kraft-single-node-provisioned.json](workflows/messaging/kafka/kraft-single-node-provisioned.json) |
| messaging | Kafka | single-node | existing | [workflows/messaging/kafka/kraft-single-node-existing.json](workflows/messaging/kafka/kraft-single-node-existing.json) |
| messaging | Kafka | high-availability | provisioned | [workflows/messaging/kafka/kraft-ha-provisioned.json](workflows/messaging/kafka/kraft-ha-provisioned.json) |
| messaging | Kafka | high-availability | existing | [workflows/messaging/kafka/kraft-ha-existing.json](workflows/messaging/kafka/kraft-ha-existing.json) |
| messaging | RabbitMQ | single-node | provisioned | [workflows/messaging/rabbitmq/single-node-provisioned.json](workflows/messaging/rabbitmq/single-node-provisioned.json) |
| messaging | RabbitMQ | single-node | existing | [workflows/messaging/rabbitmq/single-node-existing.json](workflows/messaging/rabbitmq/single-node-existing.json) |
| messaging | RabbitMQ | high-availability | provisioned | [workflows/messaging/rabbitmq/quorum-ha-provisioned.json](workflows/messaging/rabbitmq/quorum-ha-provisioned.json) |
| messaging | RabbitMQ | high-availability | existing | [workflows/messaging/rabbitmq/quorum-ha-existing.json](workflows/messaging/rabbitmq/quorum-ha-existing.json) |
| kubernetes | Vanilla Kubernetes | single-node | provisioned | [workflows/kubernetes/vanilla/single-control-plane-provisioned.json](workflows/kubernetes/vanilla/single-control-plane-provisioned.json) |
| kubernetes | Vanilla Kubernetes | single-node | existing | [workflows/kubernetes/vanilla/single-control-plane-existing.json](workflows/kubernetes/vanilla/single-control-plane-existing.json) |
| kubernetes | Vanilla Kubernetes | high-availability | provisioned | [workflows/kubernetes/vanilla/ha-control-plane-provisioned.json](workflows/kubernetes/vanilla/ha-control-plane-provisioned.json) |
| kubernetes | Vanilla Kubernetes | high-availability | existing | [workflows/kubernetes/vanilla/ha-control-plane-existing.json](workflows/kubernetes/vanilla/ha-control-plane-existing.json) |
| kubernetes | Rancher RKE2 | single-node | provisioned | [workflows/kubernetes/rancher-rke2/single-server-provisioned.json](workflows/kubernetes/rancher-rke2/single-server-provisioned.json) |
| kubernetes | Rancher RKE2 | single-node | existing | [workflows/kubernetes/rancher-rke2/single-server-existing.json](workflows/kubernetes/rancher-rke2/single-server-existing.json) |
| kubernetes | Rancher RKE2 | high-availability | provisioned | [workflows/kubernetes/rancher-rke2/ha-server-agent-provisioned.json](workflows/kubernetes/rancher-rke2/ha-server-agent-provisioned.json) |
| kubernetes | Rancher RKE2 | high-availability | existing | [workflows/kubernetes/rancher-rke2/ha-server-agent-existing.json](workflows/kubernetes/rancher-rke2/ha-server-agent-existing.json) |
| monitoring | Prometheus Grafana | single-node | provisioned | [workflows/monitoring/prometheus-grafana/single-node-provisioned.json](workflows/monitoring/prometheus-grafana/single-node-provisioned.json) |
| monitoring | Prometheus Grafana | single-node | existing | [workflows/monitoring/prometheus-grafana/single-node-existing.json](workflows/monitoring/prometheus-grafana/single-node-existing.json) |
| monitoring | Prometheus Grafana | high-availability | provisioned | [workflows/monitoring/prometheus-grafana/ha-stack-provisioned.json](workflows/monitoring/prometheus-grafana/ha-stack-provisioned.json) |
| monitoring | Prometheus Grafana | high-availability | existing | [workflows/monitoring/prometheus-grafana/ha-stack-existing.json](workflows/monitoring/prometheus-grafana/ha-stack-existing.json) |

## Directory guide

- `workflows/databases/postgresql`: PostgreSQL standalone and Patroni plus etcd plus HAProxy examples.
- `workflows/cache/redis`: Redis standalone and Redis Sentinel HA examples.
- `workflows/messaging/kafka`: Kafka KRaft standalone and 3-node HA examples.
- `workflows/messaging/rabbitmq`: RabbitMQ standalone and quorum-queue cluster examples.
- `workflows/kubernetes/vanilla`: kubeadm-based Kubernetes single control plane and HA control plane examples.
- `workflows/kubernetes/rancher-rke2`: RKE2 and Rancher single-server and HA server/agent examples.
- `workflows/monitoring/prometheus-grafana`: Prometheus, Alertmanager, Grafana, and node-exporter examples.

## Standard conventions

- Every JSON file is an importable workflow package with `kind: "octastack.workflow.package"`, `version: 1`, and the graph nested under `workflow.graphData`.
- Every workflow uses `triggerNode` as the only root entry point.
- Nodes are generated with a layered layout: linear flows use wide vertical spacing, and HA fan-out branches are distributed horizontally so nodes do not overlap in the editor.
- Provisioned examples use `profileId: "replace-with-proxmox-profile-id"`; replace it with the real Proxmox profile ID before importing.
- Template VM IDs default to `9000`; adjust `templateId`, CPU, memory, storage, network bridge, VLAN, and static IP values per environment.
- All example credentials and secrets use obvious placeholders such as `change-me` and `replace-with-rke2-token`.
- HA examples prefer odd-number quorum sets where relevant: 3 etcd nodes, 3 Redis Sentinel members, 3 Kafka KRaft voters, 3 RabbitMQ members, and 3 Kubernetes/RKE2 server nodes.
- Existing-infrastructure HA examples assume the automation runner already has SSH reachability to the target inventory and can run Ansible or shell orchestration.
- The scripts are intentionally explicit and readable. Treat them as production starting points, then harden package repositories, certificates, secrets, users, backups, firewalls, and storage classes for your environment.

## Validation

Run this after editing generated workflow JSON:

```bash
node tools/validate-workflows.mjs
```

The validator checks JSON parseability, unique node and edge IDs, valid edge references, trigger/end rules, context requirements for provision/wait/config nodes, and sequential edge ordering.

## Regeneration

The example files are generated from `tools/generate-library.mjs` so stack-wide naming and graph conventions stay consistent:

```bash
node tools/generate-library.mjs
node tools/validate-workflows.mjs
```
