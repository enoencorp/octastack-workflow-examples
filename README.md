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
| databases | MySQL | single-node | provisioned | [workflows/databases/mysql/single-node-provisioned.json](workflows/databases/mysql/single-node-provisioned.json) |
| databases | MySQL | single-node | existing | [workflows/databases/mysql/single-node-existing.json](workflows/databases/mysql/single-node-existing.json) |
| databases | MySQL | high-availability | provisioned | [workflows/databases/mysql/ha-cluster-provisioned.json](workflows/databases/mysql/ha-cluster-provisioned.json) |
| databases | MySQL | high-availability | existing | [workflows/databases/mysql/ha-cluster-existing.json](workflows/databases/mysql/ha-cluster-existing.json) |
| databases | MariaDB | single-node | provisioned | [workflows/databases/mariadb/single-node-provisioned.json](workflows/databases/mariadb/single-node-provisioned.json) |
| databases | MariaDB | single-node | existing | [workflows/databases/mariadb/single-node-existing.json](workflows/databases/mariadb/single-node-existing.json) |
| databases | MariaDB | high-availability | provisioned | [workflows/databases/mariadb/ha-cluster-provisioned.json](workflows/databases/mariadb/ha-cluster-provisioned.json) |
| databases | MariaDB | high-availability | existing | [workflows/databases/mariadb/ha-cluster-existing.json](workflows/databases/mariadb/ha-cluster-existing.json) |
| databases | MongoDB | single-node | provisioned | [workflows/databases/mongodb/single-node-provisioned.json](workflows/databases/mongodb/single-node-provisioned.json) |
| databases | MongoDB | single-node | existing | [workflows/databases/mongodb/single-node-existing.json](workflows/databases/mongodb/single-node-existing.json) |
| databases | MongoDB | high-availability | provisioned | [workflows/databases/mongodb/ha-cluster-provisioned.json](workflows/databases/mongodb/ha-cluster-provisioned.json) |
| databases | MongoDB | high-availability | existing | [workflows/databases/mongodb/ha-cluster-existing.json](workflows/databases/mongodb/ha-cluster-existing.json) |
| databases | Cassandra | single-node | provisioned | [workflows/databases/cassandra/single-node-provisioned.json](workflows/databases/cassandra/single-node-provisioned.json) |
| databases | Cassandra | single-node | existing | [workflows/databases/cassandra/single-node-existing.json](workflows/databases/cassandra/single-node-existing.json) |
| databases | Cassandra | high-availability | provisioned | [workflows/databases/cassandra/ha-cluster-provisioned.json](workflows/databases/cassandra/ha-cluster-provisioned.json) |
| databases | Cassandra | high-availability | existing | [workflows/databases/cassandra/ha-cluster-existing.json](workflows/databases/cassandra/ha-cluster-existing.json) |
| databases | ScyllaDB | single-node | provisioned | [workflows/databases/scylladb/single-node-provisioned.json](workflows/databases/scylladb/single-node-provisioned.json) |
| databases | ScyllaDB | single-node | existing | [workflows/databases/scylladb/single-node-existing.json](workflows/databases/scylladb/single-node-existing.json) |
| databases | ScyllaDB | high-availability | provisioned | [workflows/databases/scylladb/ha-cluster-provisioned.json](workflows/databases/scylladb/ha-cluster-provisioned.json) |
| databases | ScyllaDB | high-availability | existing | [workflows/databases/scylladb/ha-cluster-existing.json](workflows/databases/scylladb/ha-cluster-existing.json) |
| databases | ClickHouse | single-node | provisioned | [workflows/databases/clickhouse/single-node-provisioned.json](workflows/databases/clickhouse/single-node-provisioned.json) |
| databases | ClickHouse | single-node | existing | [workflows/databases/clickhouse/single-node-existing.json](workflows/databases/clickhouse/single-node-existing.json) |
| databases | ClickHouse | high-availability | provisioned | [workflows/databases/clickhouse/ha-cluster-provisioned.json](workflows/databases/clickhouse/ha-cluster-provisioned.json) |
| databases | ClickHouse | high-availability | existing | [workflows/databases/clickhouse/ha-cluster-existing.json](workflows/databases/clickhouse/ha-cluster-existing.json) |
| databases | TimescaleDB | single-node | provisioned | [workflows/databases/timescaledb/single-node-provisioned.json](workflows/databases/timescaledb/single-node-provisioned.json) |
| databases | TimescaleDB | single-node | existing | [workflows/databases/timescaledb/single-node-existing.json](workflows/databases/timescaledb/single-node-existing.json) |
| databases | TimescaleDB | high-availability | provisioned | [workflows/databases/timescaledb/ha-cluster-provisioned.json](workflows/databases/timescaledb/ha-cluster-provisioned.json) |
| databases | TimescaleDB | high-availability | existing | [workflows/databases/timescaledb/ha-cluster-existing.json](workflows/databases/timescaledb/ha-cluster-existing.json) |
| databases | CockroachDB | single-node | provisioned | [workflows/databases/cockroachdb/single-node-provisioned.json](workflows/databases/cockroachdb/single-node-provisioned.json) |
| databases | CockroachDB | single-node | existing | [workflows/databases/cockroachdb/single-node-existing.json](workflows/databases/cockroachdb/single-node-existing.json) |
| databases | CockroachDB | high-availability | provisioned | [workflows/databases/cockroachdb/ha-cluster-provisioned.json](workflows/databases/cockroachdb/ha-cluster-provisioned.json) |
| databases | CockroachDB | high-availability | existing | [workflows/databases/cockroachdb/ha-cluster-existing.json](workflows/databases/cockroachdb/ha-cluster-existing.json) |
| databases | YugabyteDB | single-node | provisioned | [workflows/databases/yugabytedb/single-node-provisioned.json](workflows/databases/yugabytedb/single-node-provisioned.json) |
| databases | YugabyteDB | single-node | existing | [workflows/databases/yugabytedb/single-node-existing.json](workflows/databases/yugabytedb/single-node-existing.json) |
| databases | YugabyteDB | high-availability | provisioned | [workflows/databases/yugabytedb/ha-cluster-provisioned.json](workflows/databases/yugabytedb/ha-cluster-provisioned.json) |
| databases | YugabyteDB | high-availability | existing | [workflows/databases/yugabytedb/ha-cluster-existing.json](workflows/databases/yugabytedb/ha-cluster-existing.json) |
| databases | Neo4j | single-node | provisioned | [workflows/databases/neo4j/single-node-provisioned.json](workflows/databases/neo4j/single-node-provisioned.json) |
| databases | Neo4j | single-node | existing | [workflows/databases/neo4j/single-node-existing.json](workflows/databases/neo4j/single-node-existing.json) |
| databases | Neo4j | high-availability | provisioned | [workflows/databases/neo4j/ha-cluster-provisioned.json](workflows/databases/neo4j/ha-cluster-provisioned.json) |
| databases | Neo4j | high-availability | existing | [workflows/databases/neo4j/ha-cluster-existing.json](workflows/databases/neo4j/ha-cluster-existing.json) |
| databases | CouchDB | single-node | provisioned | [workflows/databases/couchdb/single-node-provisioned.json](workflows/databases/couchdb/single-node-provisioned.json) |
| databases | CouchDB | single-node | existing | [workflows/databases/couchdb/single-node-existing.json](workflows/databases/couchdb/single-node-existing.json) |
| databases | CouchDB | high-availability | provisioned | [workflows/databases/couchdb/ha-cluster-provisioned.json](workflows/databases/couchdb/ha-cluster-provisioned.json) |
| databases | CouchDB | high-availability | existing | [workflows/databases/couchdb/ha-cluster-existing.json](workflows/databases/couchdb/ha-cluster-existing.json) |
| databases | InfluxDB | single-node | provisioned | [workflows/databases/influxdb/single-node-provisioned.json](workflows/databases/influxdb/single-node-provisioned.json) |
| databases | InfluxDB | single-node | existing | [workflows/databases/influxdb/single-node-existing.json](workflows/databases/influxdb/single-node-existing.json) |
| databases | InfluxDB | high-availability | provisioned | [workflows/databases/influxdb/ha-cluster-provisioned.json](workflows/databases/influxdb/ha-cluster-provisioned.json) |
| databases | InfluxDB | high-availability | existing | [workflows/databases/influxdb/ha-cluster-existing.json](workflows/databases/influxdb/ha-cluster-existing.json) |
| databases | VictoriaMetrics | single-node | provisioned | [workflows/databases/victoriametrics/single-node-provisioned.json](workflows/databases/victoriametrics/single-node-provisioned.json) |
| databases | VictoriaMetrics | single-node | existing | [workflows/databases/victoriametrics/single-node-existing.json](workflows/databases/victoriametrics/single-node-existing.json) |
| databases | VictoriaMetrics | high-availability | provisioned | [workflows/databases/victoriametrics/ha-cluster-provisioned.json](workflows/databases/victoriametrics/ha-cluster-provisioned.json) |
| databases | VictoriaMetrics | high-availability | existing | [workflows/databases/victoriametrics/ha-cluster-existing.json](workflows/databases/victoriametrics/ha-cluster-existing.json) |
| databases | QuestDB | single-node | provisioned | [workflows/databases/questdb/single-node-provisioned.json](workflows/databases/questdb/single-node-provisioned.json) |
| databases | QuestDB | single-node | existing | [workflows/databases/questdb/single-node-existing.json](workflows/databases/questdb/single-node-existing.json) |
| databases | QuestDB | high-availability | provisioned | [workflows/databases/questdb/ha-cluster-provisioned.json](workflows/databases/questdb/ha-cluster-provisioned.json) |
| databases | QuestDB | high-availability | existing | [workflows/databases/questdb/ha-cluster-existing.json](workflows/databases/questdb/ha-cluster-existing.json) |
| search | OpenSearch | single-node | provisioned | [workflows/search/opensearch/single-node-provisioned.json](workflows/search/opensearch/single-node-provisioned.json) |
| search | OpenSearch | single-node | existing | [workflows/search/opensearch/single-node-existing.json](workflows/search/opensearch/single-node-existing.json) |
| search | OpenSearch | high-availability | provisioned | [workflows/search/opensearch/ha-cluster-provisioned.json](workflows/search/opensearch/ha-cluster-provisioned.json) |
| search | OpenSearch | high-availability | existing | [workflows/search/opensearch/ha-cluster-existing.json](workflows/search/opensearch/ha-cluster-existing.json) |
| search | Elasticsearch | single-node | provisioned | [workflows/search/elasticsearch/single-node-provisioned.json](workflows/search/elasticsearch/single-node-provisioned.json) |
| search | Elasticsearch | single-node | existing | [workflows/search/elasticsearch/single-node-existing.json](workflows/search/elasticsearch/single-node-existing.json) |
| search | Elasticsearch | high-availability | provisioned | [workflows/search/elasticsearch/ha-cluster-provisioned.json](workflows/search/elasticsearch/ha-cluster-provisioned.json) |
| search | Elasticsearch | high-availability | existing | [workflows/search/elasticsearch/ha-cluster-existing.json](workflows/search/elasticsearch/ha-cluster-existing.json) |
| storage | MinIO | single-node | provisioned | [workflows/storage/minio/single-node-provisioned.json](workflows/storage/minio/single-node-provisioned.json) |
| storage | MinIO | single-node | existing | [workflows/storage/minio/single-node-existing.json](workflows/storage/minio/single-node-existing.json) |
| storage | MinIO | high-availability | provisioned | [workflows/storage/minio/ha-cluster-provisioned.json](workflows/storage/minio/ha-cluster-provisioned.json) |
| storage | MinIO | high-availability | existing | [workflows/storage/minio/ha-cluster-existing.json](workflows/storage/minio/ha-cluster-existing.json) |
| coordination | etcd | single-node | provisioned | [workflows/coordination/etcd/single-node-provisioned.json](workflows/coordination/etcd/single-node-provisioned.json) |
| coordination | etcd | single-node | existing | [workflows/coordination/etcd/single-node-existing.json](workflows/coordination/etcd/single-node-existing.json) |
| coordination | etcd | high-availability | provisioned | [workflows/coordination/etcd/ha-cluster-provisioned.json](workflows/coordination/etcd/ha-cluster-provisioned.json) |
| coordination | etcd | high-availability | existing | [workflows/coordination/etcd/ha-cluster-existing.json](workflows/coordination/etcd/ha-cluster-existing.json) |
| coordination | Consul | single-node | provisioned | [workflows/coordination/consul/single-node-provisioned.json](workflows/coordination/consul/single-node-provisioned.json) |
| coordination | Consul | single-node | existing | [workflows/coordination/consul/single-node-existing.json](workflows/coordination/consul/single-node-existing.json) |
| coordination | Consul | high-availability | provisioned | [workflows/coordination/consul/ha-cluster-provisioned.json](workflows/coordination/consul/ha-cluster-provisioned.json) |
| coordination | Consul | high-availability | existing | [workflows/coordination/consul/ha-cluster-existing.json](workflows/coordination/consul/ha-cluster-existing.json) |
| messaging | NATS JetStream | single-node | provisioned | [workflows/messaging/nats/single-node-provisioned.json](workflows/messaging/nats/single-node-provisioned.json) |
| messaging | NATS JetStream | single-node | existing | [workflows/messaging/nats/single-node-existing.json](workflows/messaging/nats/single-node-existing.json) |
| messaging | NATS JetStream | high-availability | provisioned | [workflows/messaging/nats/ha-cluster-provisioned.json](workflows/messaging/nats/ha-cluster-provisioned.json) |
| messaging | NATS JetStream | high-availability | existing | [workflows/messaging/nats/ha-cluster-existing.json](workflows/messaging/nats/ha-cluster-existing.json) |
| messaging | Redpanda | single-node | provisioned | [workflows/messaging/redpanda/single-node-provisioned.json](workflows/messaging/redpanda/single-node-provisioned.json) |
| messaging | Redpanda | single-node | existing | [workflows/messaging/redpanda/single-node-existing.json](workflows/messaging/redpanda/single-node-existing.json) |
| messaging | Redpanda | high-availability | provisioned | [workflows/messaging/redpanda/ha-cluster-provisioned.json](workflows/messaging/redpanda/ha-cluster-provisioned.json) |
| messaging | Redpanda | high-availability | existing | [workflows/messaging/redpanda/ha-cluster-existing.json](workflows/messaging/redpanda/ha-cluster-existing.json) |
| messaging | Apache Pulsar | single-node | provisioned | [workflows/messaging/pulsar/single-node-provisioned.json](workflows/messaging/pulsar/single-node-provisioned.json) |
| messaging | Apache Pulsar | single-node | existing | [workflows/messaging/pulsar/single-node-existing.json](workflows/messaging/pulsar/single-node-existing.json) |
| messaging | Apache Pulsar | high-availability | provisioned | [workflows/messaging/pulsar/ha-cluster-provisioned.json](workflows/messaging/pulsar/ha-cluster-provisioned.json) |
| messaging | Apache Pulsar | high-availability | existing | [workflows/messaging/pulsar/ha-cluster-existing.json](workflows/messaging/pulsar/ha-cluster-existing.json) |
| messaging | ActiveMQ Artemis | single-node | provisioned | [workflows/messaging/activemq-artemis/single-node-provisioned.json](workflows/messaging/activemq-artemis/single-node-provisioned.json) |
| messaging | ActiveMQ Artemis | single-node | existing | [workflows/messaging/activemq-artemis/single-node-existing.json](workflows/messaging/activemq-artemis/single-node-existing.json) |
| messaging | ActiveMQ Artemis | high-availability | provisioned | [workflows/messaging/activemq-artemis/ha-cluster-provisioned.json](workflows/messaging/activemq-artemis/ha-cluster-provisioned.json) |
| messaging | ActiveMQ Artemis | high-availability | existing | [workflows/messaging/activemq-artemis/ha-cluster-existing.json](workflows/messaging/activemq-artemis/ha-cluster-existing.json) |
| web | Nginx | single-node | provisioned | [workflows/web/nginx/single-node-provisioned.json](workflows/web/nginx/single-node-provisioned.json) |
| web | Nginx | single-node | existing | [workflows/web/nginx/single-node-existing.json](workflows/web/nginx/single-node-existing.json) |
| web | Nginx | high-availability | provisioned | [workflows/web/nginx/ha-cluster-provisioned.json](workflows/web/nginx/ha-cluster-provisioned.json) |
| web | Nginx | high-availability | existing | [workflows/web/nginx/ha-cluster-existing.json](workflows/web/nginx/ha-cluster-existing.json) |
| web | Apache HTTPD | single-node | provisioned | [workflows/web/apache-httpd/single-node-provisioned.json](workflows/web/apache-httpd/single-node-provisioned.json) |
| web | Apache HTTPD | single-node | existing | [workflows/web/apache-httpd/single-node-existing.json](workflows/web/apache-httpd/single-node-existing.json) |
| web | Apache HTTPD | high-availability | provisioned | [workflows/web/apache-httpd/ha-cluster-provisioned.json](workflows/web/apache-httpd/ha-cluster-provisioned.json) |
| web | Apache HTTPD | high-availability | existing | [workflows/web/apache-httpd/ha-cluster-existing.json](workflows/web/apache-httpd/ha-cluster-existing.json) |
| networking | HAProxy | single-node | provisioned | [workflows/networking/haproxy/single-node-provisioned.json](workflows/networking/haproxy/single-node-provisioned.json) |
| networking | HAProxy | single-node | existing | [workflows/networking/haproxy/single-node-existing.json](workflows/networking/haproxy/single-node-existing.json) |
| networking | HAProxy | high-availability | provisioned | [workflows/networking/haproxy/ha-cluster-provisioned.json](workflows/networking/haproxy/ha-cluster-provisioned.json) |
| networking | HAProxy | high-availability | existing | [workflows/networking/haproxy/ha-cluster-existing.json](workflows/networking/haproxy/ha-cluster-existing.json) |
| networking | Traefik | single-node | provisioned | [workflows/networking/traefik/single-node-provisioned.json](workflows/networking/traefik/single-node-provisioned.json) |
| networking | Traefik | single-node | existing | [workflows/networking/traefik/single-node-existing.json](workflows/networking/traefik/single-node-existing.json) |
| networking | Traefik | high-availability | provisioned | [workflows/networking/traefik/ha-cluster-provisioned.json](workflows/networking/traefik/ha-cluster-provisioned.json) |
| networking | Traefik | high-availability | existing | [workflows/networking/traefik/ha-cluster-existing.json](workflows/networking/traefik/ha-cluster-existing.json) |
| devops | Jenkins | single-node | provisioned | [workflows/devops/jenkins/single-node-provisioned.json](workflows/devops/jenkins/single-node-provisioned.json) |
| devops | Jenkins | single-node | existing | [workflows/devops/jenkins/single-node-existing.json](workflows/devops/jenkins/single-node-existing.json) |
| devops | Jenkins | high-availability | provisioned | [workflows/devops/jenkins/ha-cluster-provisioned.json](workflows/devops/jenkins/ha-cluster-provisioned.json) |
| devops | Jenkins | high-availability | existing | [workflows/devops/jenkins/ha-cluster-existing.json](workflows/devops/jenkins/ha-cluster-existing.json) |
| devops | GitLab CE | single-node | provisioned | [workflows/devops/gitlab-ce/single-node-provisioned.json](workflows/devops/gitlab-ce/single-node-provisioned.json) |
| devops | GitLab CE | single-node | existing | [workflows/devops/gitlab-ce/single-node-existing.json](workflows/devops/gitlab-ce/single-node-existing.json) |
| devops | GitLab CE | high-availability | provisioned | [workflows/devops/gitlab-ce/ha-cluster-provisioned.json](workflows/devops/gitlab-ce/ha-cluster-provisioned.json) |
| devops | GitLab CE | high-availability | existing | [workflows/devops/gitlab-ce/ha-cluster-existing.json](workflows/devops/gitlab-ce/ha-cluster-existing.json) |
| devops | Nexus Repository | single-node | provisioned | [workflows/devops/nexus-repository/single-node-provisioned.json](workflows/devops/nexus-repository/single-node-provisioned.json) |
| devops | Nexus Repository | single-node | existing | [workflows/devops/nexus-repository/single-node-existing.json](workflows/devops/nexus-repository/single-node-existing.json) |
| devops | Nexus Repository | high-availability | provisioned | [workflows/devops/nexus-repository/ha-cluster-provisioned.json](workflows/devops/nexus-repository/ha-cluster-provisioned.json) |
| devops | Nexus Repository | high-availability | existing | [workflows/devops/nexus-repository/ha-cluster-existing.json](workflows/devops/nexus-repository/ha-cluster-existing.json) |
| devops | SonarQube | single-node | provisioned | [workflows/devops/sonarqube/single-node-provisioned.json](workflows/devops/sonarqube/single-node-provisioned.json) |
| devops | SonarQube | single-node | existing | [workflows/devops/sonarqube/single-node-existing.json](workflows/devops/sonarqube/single-node-existing.json) |
| devops | SonarQube | high-availability | provisioned | [workflows/devops/sonarqube/ha-cluster-provisioned.json](workflows/devops/sonarqube/ha-cluster-provisioned.json) |
| devops | SonarQube | high-availability | existing | [workflows/devops/sonarqube/ha-cluster-existing.json](workflows/devops/sonarqube/ha-cluster-existing.json) |
| identity | Keycloak | single-node | provisioned | [workflows/identity/keycloak/single-node-provisioned.json](workflows/identity/keycloak/single-node-provisioned.json) |
| identity | Keycloak | single-node | existing | [workflows/identity/keycloak/single-node-existing.json](workflows/identity/keycloak/single-node-existing.json) |
| identity | Keycloak | high-availability | provisioned | [workflows/identity/keycloak/ha-cluster-provisioned.json](workflows/identity/keycloak/ha-cluster-provisioned.json) |
| identity | Keycloak | high-availability | existing | [workflows/identity/keycloak/ha-cluster-existing.json](workflows/identity/keycloak/ha-cluster-existing.json) |
| security | Vault | single-node | provisioned | [workflows/security/vault/single-node-provisioned.json](workflows/security/vault/single-node-provisioned.json) |
| security | Vault | single-node | existing | [workflows/security/vault/single-node-existing.json](workflows/security/vault/single-node-existing.json) |
| security | Vault | high-availability | provisioned | [workflows/security/vault/ha-cluster-provisioned.json](workflows/security/vault/ha-cluster-provisioned.json) |
| security | Vault | high-availability | existing | [workflows/security/vault/ha-cluster-existing.json](workflows/security/vault/ha-cluster-existing.json) |
| observability | Loki | single-node | provisioned | [workflows/observability/loki/single-node-provisioned.json](workflows/observability/loki/single-node-provisioned.json) |
| observability | Loki | single-node | existing | [workflows/observability/loki/single-node-existing.json](workflows/observability/loki/single-node-existing.json) |
| observability | Loki | high-availability | provisioned | [workflows/observability/loki/ha-cluster-provisioned.json](workflows/observability/loki/ha-cluster-provisioned.json) |
| observability | Loki | high-availability | existing | [workflows/observability/loki/ha-cluster-existing.json](workflows/observability/loki/ha-cluster-existing.json) |
| observability | Tempo | single-node | provisioned | [workflows/observability/tempo/single-node-provisioned.json](workflows/observability/tempo/single-node-provisioned.json) |
| observability | Tempo | single-node | existing | [workflows/observability/tempo/single-node-existing.json](workflows/observability/tempo/single-node-existing.json) |
| observability | Tempo | high-availability | provisioned | [workflows/observability/tempo/ha-cluster-provisioned.json](workflows/observability/tempo/ha-cluster-provisioned.json) |
| observability | Tempo | high-availability | existing | [workflows/observability/tempo/ha-cluster-existing.json](workflows/observability/tempo/ha-cluster-existing.json) |
| databases | Microsoft SQL Server | single-node | provisioned | [workflows/databases/mssql/single-node-provisioned.json](workflows/databases/mssql/single-node-provisioned.json) |
| databases | Microsoft SQL Server | single-node | existing | [workflows/databases/mssql/single-node-existing.json](workflows/databases/mssql/single-node-existing.json) |
| databases | Microsoft SQL Server | high-availability | provisioned | [workflows/databases/mssql/ha-cluster-provisioned.json](workflows/databases/mssql/ha-cluster-provisioned.json) |
| databases | Microsoft SQL Server | high-availability | existing | [workflows/databases/mssql/ha-cluster-existing.json](workflows/databases/mssql/ha-cluster-existing.json) |
| databases | Oracle Database Free | single-node | provisioned | [workflows/databases/oracle-free/single-node-provisioned.json](workflows/databases/oracle-free/single-node-provisioned.json) |
| databases | Oracle Database Free | single-node | existing | [workflows/databases/oracle-free/single-node-existing.json](workflows/databases/oracle-free/single-node-existing.json) |
| databases | Oracle Database Free | high-availability | provisioned | [workflows/databases/oracle-free/ha-cluster-provisioned.json](workflows/databases/oracle-free/ha-cluster-provisioned.json) |
| databases | Oracle Database Free | high-availability | existing | [workflows/databases/oracle-free/ha-cluster-existing.json](workflows/databases/oracle-free/ha-cluster-existing.json) |
| databases | Firebird | single-node | provisioned | [workflows/databases/firebird/single-node-provisioned.json](workflows/databases/firebird/single-node-provisioned.json) |
| databases | Firebird | single-node | existing | [workflows/databases/firebird/single-node-existing.json](workflows/databases/firebird/single-node-existing.json) |
| databases | Firebird | high-availability | provisioned | [workflows/databases/firebird/ha-cluster-provisioned.json](workflows/databases/firebird/ha-cluster-provisioned.json) |
| databases | Firebird | high-availability | existing | [workflows/databases/firebird/ha-cluster-existing.json](workflows/databases/firebird/ha-cluster-existing.json) |
| databases | ArangoDB | single-node | provisioned | [workflows/databases/arangodb/single-node-provisioned.json](workflows/databases/arangodb/single-node-provisioned.json) |
| databases | ArangoDB | single-node | existing | [workflows/databases/arangodb/single-node-existing.json](workflows/databases/arangodb/single-node-existing.json) |
| databases | ArangoDB | high-availability | provisioned | [workflows/databases/arangodb/ha-cluster-provisioned.json](workflows/databases/arangodb/ha-cluster-provisioned.json) |
| databases | ArangoDB | high-availability | existing | [workflows/databases/arangodb/ha-cluster-existing.json](workflows/databases/arangodb/ha-cluster-existing.json) |
| databases | RethinkDB | single-node | provisioned | [workflows/databases/rethinkdb/single-node-provisioned.json](workflows/databases/rethinkdb/single-node-provisioned.json) |
| databases | RethinkDB | single-node | existing | [workflows/databases/rethinkdb/single-node-existing.json](workflows/databases/rethinkdb/single-node-existing.json) |
| databases | RethinkDB | high-availability | provisioned | [workflows/databases/rethinkdb/ha-cluster-provisioned.json](workflows/databases/rethinkdb/ha-cluster-provisioned.json) |
| databases | RethinkDB | high-availability | existing | [workflows/databases/rethinkdb/ha-cluster-existing.json](workflows/databases/rethinkdb/ha-cluster-existing.json) |
| cache | Memcached | single-node | provisioned | [workflows/cache/memcached/single-node-provisioned.json](workflows/cache/memcached/single-node-provisioned.json) |
| cache | Memcached | single-node | existing | [workflows/cache/memcached/single-node-existing.json](workflows/cache/memcached/single-node-existing.json) |
| cache | Memcached | high-availability | provisioned | [workflows/cache/memcached/ha-cluster-provisioned.json](workflows/cache/memcached/ha-cluster-provisioned.json) |
| cache | Memcached | high-availability | existing | [workflows/cache/memcached/ha-cluster-existing.json](workflows/cache/memcached/ha-cluster-existing.json) |
| cache | Valkey | single-node | provisioned | [workflows/cache/valkey/single-node-provisioned.json](workflows/cache/valkey/single-node-provisioned.json) |
| cache | Valkey | single-node | existing | [workflows/cache/valkey/single-node-existing.json](workflows/cache/valkey/single-node-existing.json) |
| cache | Valkey | high-availability | provisioned | [workflows/cache/valkey/ha-cluster-provisioned.json](workflows/cache/valkey/ha-cluster-provisioned.json) |
| cache | Valkey | high-availability | existing | [workflows/cache/valkey/ha-cluster-existing.json](workflows/cache/valkey/ha-cluster-existing.json) |
| cache | DragonflyDB | single-node | provisioned | [workflows/cache/dragonflydb/single-node-provisioned.json](workflows/cache/dragonflydb/single-node-provisioned.json) |
| cache | DragonflyDB | single-node | existing | [workflows/cache/dragonflydb/single-node-existing.json](workflows/cache/dragonflydb/single-node-existing.json) |
| cache | DragonflyDB | high-availability | provisioned | [workflows/cache/dragonflydb/ha-cluster-provisioned.json](workflows/cache/dragonflydb/ha-cluster-provisioned.json) |
| cache | DragonflyDB | high-availability | existing | [workflows/cache/dragonflydb/ha-cluster-existing.json](workflows/cache/dragonflydb/ha-cluster-existing.json) |
| search | Apache Solr | single-node | provisioned | [workflows/search/solr/single-node-provisioned.json](workflows/search/solr/single-node-provisioned.json) |
| search | Apache Solr | single-node | existing | [workflows/search/solr/single-node-existing.json](workflows/search/solr/single-node-existing.json) |
| search | Apache Solr | high-availability | provisioned | [workflows/search/solr/ha-cluster-provisioned.json](workflows/search/solr/ha-cluster-provisioned.json) |
| search | Apache Solr | high-availability | existing | [workflows/search/solr/ha-cluster-existing.json](workflows/search/solr/ha-cluster-existing.json) |
| search | Meilisearch | single-node | provisioned | [workflows/search/meilisearch/single-node-provisioned.json](workflows/search/meilisearch/single-node-provisioned.json) |
| search | Meilisearch | single-node | existing | [workflows/search/meilisearch/single-node-existing.json](workflows/search/meilisearch/single-node-existing.json) |
| search | Meilisearch | high-availability | provisioned | [workflows/search/meilisearch/ha-cluster-provisioned.json](workflows/search/meilisearch/ha-cluster-provisioned.json) |
| search | Meilisearch | high-availability | existing | [workflows/search/meilisearch/ha-cluster-existing.json](workflows/search/meilisearch/ha-cluster-existing.json) |
| search | Typesense | single-node | provisioned | [workflows/search/typesense/single-node-provisioned.json](workflows/search/typesense/single-node-provisioned.json) |
| search | Typesense | single-node | existing | [workflows/search/typesense/single-node-existing.json](workflows/search/typesense/single-node-existing.json) |
| search | Typesense | high-availability | provisioned | [workflows/search/typesense/ha-cluster-provisioned.json](workflows/search/typesense/ha-cluster-provisioned.json) |
| search | Typesense | high-availability | existing | [workflows/search/typesense/ha-cluster-existing.json](workflows/search/typesense/ha-cluster-existing.json) |
| vector | Qdrant | single-node | provisioned | [workflows/vector/qdrant/single-node-provisioned.json](workflows/vector/qdrant/single-node-provisioned.json) |
| vector | Qdrant | single-node | existing | [workflows/vector/qdrant/single-node-existing.json](workflows/vector/qdrant/single-node-existing.json) |
| vector | Qdrant | high-availability | provisioned | [workflows/vector/qdrant/ha-cluster-provisioned.json](workflows/vector/qdrant/ha-cluster-provisioned.json) |
| vector | Qdrant | high-availability | existing | [workflows/vector/qdrant/ha-cluster-existing.json](workflows/vector/qdrant/ha-cluster-existing.json) |
| vector | Weaviate | single-node | provisioned | [workflows/vector/weaviate/single-node-provisioned.json](workflows/vector/weaviate/single-node-provisioned.json) |
| vector | Weaviate | single-node | existing | [workflows/vector/weaviate/single-node-existing.json](workflows/vector/weaviate/single-node-existing.json) |
| vector | Weaviate | high-availability | provisioned | [workflows/vector/weaviate/ha-cluster-provisioned.json](workflows/vector/weaviate/ha-cluster-provisioned.json) |
| vector | Weaviate | high-availability | existing | [workflows/vector/weaviate/ha-cluster-existing.json](workflows/vector/weaviate/ha-cluster-existing.json) |
| vector | Milvus | single-node | provisioned | [workflows/vector/milvus/single-node-provisioned.json](workflows/vector/milvus/single-node-provisioned.json) |
| vector | Milvus | single-node | existing | [workflows/vector/milvus/single-node-existing.json](workflows/vector/milvus/single-node-existing.json) |
| vector | Milvus | high-availability | provisioned | [workflows/vector/milvus/ha-cluster-provisioned.json](workflows/vector/milvus/ha-cluster-provisioned.json) |
| vector | Milvus | high-availability | existing | [workflows/vector/milvus/ha-cluster-existing.json](workflows/vector/milvus/ha-cluster-existing.json) |
| vector | ChromaDB | single-node | provisioned | [workflows/vector/chromadb/single-node-provisioned.json](workflows/vector/chromadb/single-node-provisioned.json) |
| vector | ChromaDB | single-node | existing | [workflows/vector/chromadb/single-node-existing.json](workflows/vector/chromadb/single-node-existing.json) |
| vector | ChromaDB | high-availability | provisioned | [workflows/vector/chromadb/ha-cluster-provisioned.json](workflows/vector/chromadb/ha-cluster-provisioned.json) |
| vector | ChromaDB | high-availability | existing | [workflows/vector/chromadb/ha-cluster-existing.json](workflows/vector/chromadb/ha-cluster-existing.json) |
| coordination | ZooKeeper | single-node | provisioned | [workflows/coordination/zookeeper/single-node-provisioned.json](workflows/coordination/zookeeper/single-node-provisioned.json) |
| coordination | ZooKeeper | single-node | existing | [workflows/coordination/zookeeper/single-node-existing.json](workflows/coordination/zookeeper/single-node-existing.json) |
| coordination | ZooKeeper | high-availability | provisioned | [workflows/coordination/zookeeper/ha-cluster-provisioned.json](workflows/coordination/zookeeper/ha-cluster-provisioned.json) |
| coordination | ZooKeeper | high-availability | existing | [workflows/coordination/zookeeper/ha-cluster-existing.json](workflows/coordination/zookeeper/ha-cluster-existing.json) |
| storage | SeaweedFS | single-node | provisioned | [workflows/storage/seaweedfs/single-node-provisioned.json](workflows/storage/seaweedfs/single-node-provisioned.json) |
| storage | SeaweedFS | single-node | existing | [workflows/storage/seaweedfs/single-node-existing.json](workflows/storage/seaweedfs/single-node-existing.json) |
| storage | SeaweedFS | high-availability | provisioned | [workflows/storage/seaweedfs/ha-cluster-provisioned.json](workflows/storage/seaweedfs/ha-cluster-provisioned.json) |
| storage | SeaweedFS | high-availability | existing | [workflows/storage/seaweedfs/ha-cluster-existing.json](workflows/storage/seaweedfs/ha-cluster-existing.json) |
| observability | Grafana | single-node | provisioned | [workflows/observability/grafana/single-node-provisioned.json](workflows/observability/grafana/single-node-provisioned.json) |
| observability | Grafana | single-node | existing | [workflows/observability/grafana/single-node-existing.json](workflows/observability/grafana/single-node-existing.json) |
| observability | Grafana | high-availability | provisioned | [workflows/observability/grafana/ha-cluster-provisioned.json](workflows/observability/grafana/ha-cluster-provisioned.json) |
| observability | Grafana | high-availability | existing | [workflows/observability/grafana/ha-cluster-existing.json](workflows/observability/grafana/ha-cluster-existing.json) |
| devops | Gitea | single-node | provisioned | [workflows/devops/gitea/single-node-provisioned.json](workflows/devops/gitea/single-node-provisioned.json) |
| devops | Gitea | single-node | existing | [workflows/devops/gitea/single-node-existing.json](workflows/devops/gitea/single-node-existing.json) |
| devops | Gitea | high-availability | provisioned | [workflows/devops/gitea/ha-cluster-provisioned.json](workflows/devops/gitea/ha-cluster-provisioned.json) |
| devops | Gitea | high-availability | existing | [workflows/devops/gitea/ha-cluster-existing.json](workflows/devops/gitea/ha-cluster-existing.json) |
| devops | Drone CI | single-node | provisioned | [workflows/devops/drone/single-node-provisioned.json](workflows/devops/drone/single-node-provisioned.json) |
| devops | Drone CI | single-node | existing | [workflows/devops/drone/single-node-existing.json](workflows/devops/drone/single-node-existing.json) |
| devops | Drone CI | high-availability | provisioned | [workflows/devops/drone/ha-cluster-provisioned.json](workflows/devops/drone/ha-cluster-provisioned.json) |
| devops | Drone CI | high-availability | existing | [workflows/devops/drone/ha-cluster-existing.json](workflows/devops/drone/ha-cluster-existing.json) |
| observability | Jaeger | single-node | provisioned | [workflows/observability/jaeger/single-node-provisioned.json](workflows/observability/jaeger/single-node-provisioned.json) |
| observability | Jaeger | single-node | existing | [workflows/observability/jaeger/single-node-existing.json](workflows/observability/jaeger/single-node-existing.json) |
| observability | Jaeger | high-availability | provisioned | [workflows/observability/jaeger/ha-cluster-provisioned.json](workflows/observability/jaeger/ha-cluster-provisioned.json) |
| observability | Jaeger | high-availability | existing | [workflows/observability/jaeger/ha-cluster-existing.json](workflows/observability/jaeger/ha-cluster-existing.json) |

## Directory guide

- `workflows/cache/dragonflydb`: DragonflyDB examples.
- `workflows/cache/memcached`: Memcached examples.
- `workflows/cache/redis`: Redis examples.
- `workflows/cache/valkey`: Valkey examples.
- `workflows/coordination/consul`: Consul examples.
- `workflows/coordination/etcd`: etcd examples.
- `workflows/coordination/zookeeper`: ZooKeeper examples.
- `workflows/databases/arangodb`: ArangoDB examples.
- `workflows/databases/cassandra`: Cassandra examples.
- `workflows/databases/clickhouse`: ClickHouse examples.
- `workflows/databases/cockroachdb`: CockroachDB examples.
- `workflows/databases/couchdb`: CouchDB examples.
- `workflows/databases/firebird`: Firebird examples.
- `workflows/databases/influxdb`: InfluxDB examples.
- `workflows/databases/mariadb`: MariaDB examples.
- `workflows/databases/mongodb`: MongoDB examples.
- `workflows/databases/mssql`: Microsoft SQL Server examples.
- `workflows/databases/mysql`: MySQL examples.
- `workflows/databases/neo4j`: Neo4j examples.
- `workflows/databases/oracle-free`: Oracle Database Free examples.
- `workflows/databases/postgresql`: PostgreSQL examples.
- `workflows/databases/questdb`: QuestDB examples.
- `workflows/databases/rethinkdb`: RethinkDB examples.
- `workflows/databases/scylladb`: ScyllaDB examples.
- `workflows/databases/timescaledb`: TimescaleDB examples.
- `workflows/databases/victoriametrics`: VictoriaMetrics examples.
- `workflows/databases/yugabytedb`: YugabyteDB examples.
- `workflows/devops/drone`: Drone CI examples.
- `workflows/devops/gitea`: Gitea examples.
- `workflows/devops/gitlab-ce`: GitLab CE examples.
- `workflows/devops/jenkins`: Jenkins examples.
- `workflows/devops/nexus-repository`: Nexus Repository examples.
- `workflows/devops/sonarqube`: SonarQube examples.
- `workflows/identity/keycloak`: Keycloak examples.
- `workflows/kubernetes/rancher-rke2`: Rancher RKE2 examples.
- `workflows/kubernetes/vanilla`: Vanilla Kubernetes examples.
- `workflows/messaging/activemq-artemis`: ActiveMQ Artemis examples.
- `workflows/messaging/kafka`: Kafka examples.
- `workflows/messaging/nats`: NATS JetStream examples.
- `workflows/messaging/pulsar`: Apache Pulsar examples.
- `workflows/messaging/rabbitmq`: RabbitMQ examples.
- `workflows/messaging/redpanda`: Redpanda examples.
- `workflows/monitoring/prometheus-grafana`: Prometheus Grafana examples.
- `workflows/networking/haproxy`: HAProxy examples.
- `workflows/networking/traefik`: Traefik examples.
- `workflows/observability/grafana`: Grafana examples.
- `workflows/observability/jaeger`: Jaeger examples.
- `workflows/observability/loki`: Loki examples.
- `workflows/observability/tempo`: Tempo examples.
- `workflows/search/elasticsearch`: Elasticsearch examples.
- `workflows/search/meilisearch`: Meilisearch examples.
- `workflows/search/opensearch`: OpenSearch examples.
- `workflows/search/solr`: Apache Solr examples.
- `workflows/search/typesense`: Typesense examples.
- `workflows/security/vault`: Vault examples.
- `workflows/storage/minio`: MinIO examples.
- `workflows/storage/seaweedfs`: SeaweedFS examples.
- `workflows/vector/chromadb`: ChromaDB examples.
- `workflows/vector/milvus`: Milvus examples.
- `workflows/vector/qdrant`: Qdrant examples.
- `workflows/vector/weaviate`: Weaviate examples.
- `workflows/web/apache-httpd`: Apache HTTPD examples.
- `workflows/web/nginx`: Nginx examples.

## Standard conventions

- Every JSON file is an importable workflow package with `kind: "octastack.workflow.package"`, `version: 1`, and the graph nested under `workflow.graphData`.
- Every workflow uses `triggerNode` as the only root entry point.
- Nodes are generated with a layered layout: linear flows use wide vertical spacing, and HA fan-out branches are distributed horizontally so nodes do not overlap in the editor.
- Newer catalog examples break installation into multiple small `configCommandNode` steps so each phase can be inspected, retried, or replaced independently.
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

The validator checks JSON parseability, unique node and edge IDs, valid edge references, trigger/end rules, context requirements for provision/wait/config nodes, sequential edge ordering, and approximate node layout overlap.

## Regeneration

The example files are generated from `tools/generate-library.mjs` so stack-wide naming and graph conventions stay consistent:

```bash
node tools/generate-library.mjs
node tools/validate-workflows.mjs
```
