# OctaStack Workflow Example Library

This repository contains ready-to-adapt JSON workflow packages for OctaStack automation imports. The examples follow the package, canonical graph, and validation rules documented in `NODES.md`.

The library is organized by operational domain, then by technology. Every technology includes simple single-node examples. Technologies with a catalog-safe HA topology also include one or more high-availability variants, each available in provisioned and existing-infrastructure modes.

## Provisioning modes

- `*-provisioned.json`: starts with `proxmoxConfigNode`, provisions VMs through `provisionNode`, waits for reachability, then installs/configures the stack.
- `*-existing.json`: skips VM creation and starts from `serverNode`. Single-node examples target the application host directly. HA examples fan out to the existing member nodes and run bash command steps on each active node context.

## Topology documentation

Generated Mermaid topology documents are available in [topologies/README.md](topologies/README.md). Each stack document includes the single-node topology, generated HA topology diagrams when available, inventory tables, IP allocation, and links back to the workflow JSON packages.

## IP address plan

All generated examples use the parent network `10.0.0.0/16`. Each top-level workflow category receives a block inside that parent network, and each stack receives one `/24` from its category block.

Host conventions inside each stack `/24`:

- `.1`: gateway
- `.11-.49`: HA members, grouped by role in blocks of ten
- `.50`: single-node target; provisioned and existing variants reuse the same example address

| Category | Category block |
| --- | --- |
| databases | `10.0.0.0/18` |
| cache | `10.0.64.0/20` |
| messaging | `10.0.80.0/20` |
| kubernetes | `10.0.96.0/20` |
| monitoring | `10.0.112.0/20` |
| search | `10.0.128.0/20` |
| storage | `10.0.144.0/20` |
| coordination | `10.0.160.0/20` |
| networking | `10.0.176.0/20` |
| observability | `10.0.192.0/20` |
| devops | `10.0.208.0/20` |
| identity | `10.0.224.0/22` |
| security | `10.0.228.0/22` |
| vector | `10.0.232.0/21` |
| web | `10.0.240.0/21` |

| Category | Stack | Stack block | Gateway | Single-node IP | HA variants and member IPs |
| --- | --- | --- | --- | --- | --- |
| databases | PostgreSQL | `10.0.0.0/24` | `10.0.0.1` | `10.0.0.50` | PostgreSQL Patroni etcd HA: `etcd-01:10.0.0.11`, `etcd-02:10.0.0.12`, `etcd-03:10.0.0.13`, `pg-01:10.0.0.21`, `pg-02:10.0.0.22`, `pg-03:10.0.0.23`, `pg-lb-01:10.0.0.31`, `pg-lb-02:10.0.0.32` |
| cache | Redis | `10.0.64.0/24` | `10.0.64.1` | `10.0.64.50` | Redis Sentinel HA: `redis-01:10.0.64.11`, `redis-02:10.0.64.12`, `redis-03:10.0.64.13`<br>Redis Cluster HA: `redis-cluster-01:10.0.64.11`, `redis-cluster-02:10.0.64.12`, `redis-cluster-03:10.0.64.13`, `redis-cluster-04:10.0.64.14`, `redis-cluster-05:10.0.64.15`, `redis-cluster-06:10.0.64.16` |
| messaging | Kafka | `10.0.80.0/24` | `10.0.80.1` | `10.0.80.50` | Kafka KRaft HA: `kafka-01:10.0.80.11`, `kafka-02:10.0.80.12`, `kafka-03:10.0.80.13` |
| messaging | RabbitMQ | `10.0.81.0/24` | `10.0.81.1` | `10.0.81.50` | RabbitMQ Quorum HA: `rabbitmq-01:10.0.81.11`, `rabbitmq-02:10.0.81.12`, `rabbitmq-03:10.0.81.13` |
| kubernetes | Vanilla Kubernetes | `10.0.96.0/24` | `10.0.96.1` | `10.0.96.50` | Vanilla Kubernetes HA: `k8s-cp-01:10.0.96.11`, `k8s-cp-02:10.0.96.12`, `k8s-cp-03:10.0.96.13`, `k8s-worker-01:10.0.96.21`, `k8s-worker-02:10.0.96.22` |
| kubernetes | Rancher RKE2 | `10.0.97.0/24` | `10.0.97.1` | `10.0.97.50` | Rancher RKE2 HA: `rke2-server-01:10.0.97.11`, `rke2-server-02:10.0.97.12`, `rke2-server-03:10.0.97.13`, `rke2-agent-01:10.0.97.21`, `rke2-agent-02:10.0.97.22` |
| monitoring | Prometheus Grafana | `10.0.112.0/24` | `10.0.112.1` | `10.0.112.50` | Prometheus Grafana HA: `prometheus-01:10.0.112.11`, `prometheus-02:10.0.112.12`, `alertmanager-01:10.0.112.21`, `alertmanager-02:10.0.112.22`, `alertmanager-03:10.0.112.23`, `grafana-01:10.0.112.31`, `grafana-02:10.0.112.32` |
| databases | MySQL | `10.0.1.0/24` | `10.0.1.1` | `10.0.1.50` | MySQL Group Replication HA: `mysql-01:10.0.1.11`, `mysql-02:10.0.1.12`, `mysql-03:10.0.1.13` |
| databases | MariaDB | `10.0.2.0/24` | `10.0.2.1` | `10.0.2.50` | MariaDB Galera HA: `mariadb-01:10.0.2.11`, `mariadb-02:10.0.2.12`, `mariadb-03:10.0.2.13` |
| databases | MongoDB | `10.0.3.0/24` | `10.0.3.1` | `10.0.3.50` | MongoDB Replica Set HA: `mongodb-01:10.0.3.11`, `mongodb-02:10.0.3.12`, `mongodb-03:10.0.3.13` |
| databases | Cassandra | `10.0.4.0/24` | `10.0.4.1` | `10.0.4.50` | Cassandra Native Ring HA: `cassandra-01:10.0.4.11`, `cassandra-02:10.0.4.12`, `cassandra-03:10.0.4.13` |
| databases | ScyllaDB | `10.0.5.0/24` | `10.0.5.1` | `10.0.5.50` | ScyllaDB Native Ring HA: `scylladb-01:10.0.5.11`, `scylladb-02:10.0.5.12`, `scylladb-03:10.0.5.13` |
| databases | ClickHouse | `10.0.6.0/24` | `10.0.6.1` | `10.0.6.50` | ClickHouse Replicated Keeper HA: `clickhouse-01:10.0.6.11`, `clickhouse-02:10.0.6.12`, `clickhouse-03:10.0.6.13` |
| databases | TimescaleDB | `10.0.7.0/24` | `10.0.7.1` | `10.0.7.50` | Not generated in this catalog scope; TimescaleDB HA should be built on the PostgreSQL Patroni pattern with extension/package hardening. |
| databases | CockroachDB | `10.0.8.0/24` | `10.0.8.1` | `10.0.8.50` | CockroachDB Native Cluster HA: `cockroachdb-01:10.0.8.11`, `cockroachdb-02:10.0.8.12`, `cockroachdb-03:10.0.8.13` |
| databases | YugabyteDB | `10.0.9.0/24` | `10.0.9.1` | `10.0.9.50` | YugabyteDB RF3 Cluster HA: `yugabytedb-01:10.0.9.11`, `yugabytedb-02:10.0.9.12`, `yugabytedb-03:10.0.9.13` |
| databases | Neo4j | `10.0.10.0/24` | `10.0.10.1` | `10.0.10.50` | Not generated for the community container profile; Neo4j clustering is an enterprise topology and not catalog-safe here. |
| databases | CouchDB | `10.0.11.0/24` | `10.0.11.1` | `10.0.11.50` | CouchDB Native Cluster HA: `couchdb-01:10.0.11.11`, `couchdb-02:10.0.11.12`, `couchdb-03:10.0.11.13` |
| databases | InfluxDB | `10.0.12.0/24` | `10.0.12.1` | `10.0.12.50` | Not generated; the OSS InfluxDB v2 container profile does not provide a built-in clustered HA topology. |
| databases | VictoriaMetrics | `10.0.13.0/24` | `10.0.13.1` | `10.0.13.50` | VictoriaMetrics Cluster HA: `victoriametrics-storage-01:10.0.13.11`, `victoriametrics-storage-02:10.0.13.12`, `victoriametrics-storage-03:10.0.13.13`, `victoriametrics-select-01:10.0.13.21`, `victoriametrics-select-02:10.0.13.22`, `victoriametrics-insert-01:10.0.13.31`, `victoriametrics-insert-02:10.0.13.32` |
| databases | QuestDB | `10.0.14.0/24` | `10.0.14.1` | `10.0.14.50` | Not generated; this OSS single-node profile does not expose a catalog-safe native HA topology. |
| search | OpenSearch | `10.0.128.0/24` | `10.0.128.1` | `10.0.128.50` | OpenSearch Cluster HA: `opensearch-01:10.0.128.11`, `opensearch-02:10.0.128.12`, `opensearch-03:10.0.128.13` |
| search | Elasticsearch | `10.0.129.0/24` | `10.0.129.1` | `10.0.129.50` | Elasticsearch Cluster HA: `elasticsearch-01:10.0.129.11`, `elasticsearch-02:10.0.129.12`, `elasticsearch-03:10.0.129.13` |
| storage | MinIO | `10.0.144.0/24` | `10.0.144.1` | `10.0.144.50` | MinIO Distributed Erasure Coding HA: `minio-01:10.0.144.11`, `minio-02:10.0.144.12`, `minio-03:10.0.144.13`, `minio-04:10.0.144.14` |
| coordination | etcd | `10.0.160.0/24` | `10.0.160.1` | `10.0.160.50` | etcd Quorum Cluster HA: `etcd-01:10.0.160.11`, `etcd-02:10.0.160.12`, `etcd-03:10.0.160.13` |
| coordination | Consul | `10.0.161.0/24` | `10.0.161.1` | `10.0.161.50` | Consul Server Quorum HA: `consul-01:10.0.161.11`, `consul-02:10.0.161.12`, `consul-03:10.0.161.13` |
| messaging | NATS JetStream | `10.0.82.0/24` | `10.0.82.1` | `10.0.82.50` | NATS JetStream Cluster HA: `nats-jetstream-01:10.0.82.11`, `nats-jetstream-02:10.0.82.12`, `nats-jetstream-03:10.0.82.13` |
| messaging | Redpanda | `10.0.83.0/24` | `10.0.83.1` | `10.0.83.50` | Redpanda Native Cluster HA: `redpanda-01:10.0.83.11`, `redpanda-02:10.0.83.12`, `redpanda-03:10.0.83.13` |
| messaging | Apache Pulsar | `10.0.84.0/24` | `10.0.84.1` | `10.0.84.50` | Not generated from the standalone profile; production HA requires separate ZooKeeper, BookKeeper, broker, and proxy roles. |
| messaging | ActiveMQ Artemis | `10.0.85.0/24` | `10.0.85.1` | `10.0.85.50` | Not generated; live/backup or broker-cluster HA requires topology-specific storage and quorum decisions outside this generic container profile. |
| web | Nginx | `10.0.240.0/24` | `10.0.240.1` | `10.0.240.50` | Nginx Active-Active Web HA: `nginx-01:10.0.240.11`, `nginx-02:10.0.240.12` |
| web | Apache HTTPD | `10.0.241.0/24` | `10.0.241.1` | `10.0.241.50` | Apache HTTPD Active-Active Web HA: `apache-httpd-01:10.0.241.11`, `apache-httpd-02:10.0.241.12` |
| networking | HAProxy | `10.0.176.0/24` | `10.0.176.1` | `10.0.176.50` | HAProxy Active-Active Edge HA: `haproxy-01:10.0.176.11`, `haproxy-02:10.0.176.12` |
| networking | Traefik | `10.0.177.0/24` | `10.0.177.1` | `10.0.177.50` | Traefik Active-Active Ingress HA: `traefik-01:10.0.177.11`, `traefik-02:10.0.177.12` |
| devops | Jenkins | `10.0.208.0/24` | `10.0.208.1` | `10.0.208.50` | Not generated; Jenkins controller active-active HA is not appropriate for this single-controller OSS profile. |
| devops | GitLab CE | `10.0.209.0/24` | `10.0.209.1` | `10.0.209.50` | Not generated; GitLab CE HA requires a larger reference architecture with external PostgreSQL, Redis, Gitaly, Praefect, and load balancers. |
| devops | Nexus Repository | `10.0.210.0/24` | `10.0.210.1` | `10.0.210.50` | Not generated; Nexus Repository HA is not available for this OSS-style single-node catalog profile. |
| devops | SonarQube | `10.0.211.0/24` | `10.0.211.1` | `10.0.211.50` | Not generated; SonarQube HA requires Data Center style topology, not the community container profile. |
| identity | Keycloak | `10.0.224.0/24` | `10.0.224.1` | `10.0.224.50` | Not generated from the start-dev profile; production Keycloak HA requires external database/cache, TLS, and hostname hardening. |
| security | Vault | `10.0.228.0/24` | `10.0.228.1` | `10.0.228.50` | Vault Integrated Raft HA: `vault-01:10.0.228.11`, `vault-02:10.0.228.12`, `vault-03:10.0.228.13` |
| observability | Loki | `10.0.192.0/24` | `10.0.192.1` | `10.0.192.50` | Not generated from the local-config profile; Loki HA requires distributed read/write/backend or simple-scalable mode plus object storage. |
| observability | Tempo | `10.0.193.0/24` | `10.0.193.1` | `10.0.193.50` | Not generated from the local single-binary profile; Tempo HA requires distributed roles and object storage. |
| databases | Microsoft SQL Server | `10.0.15.0/24` | `10.0.15.1` | `10.0.15.50` | Not generated; SQL Server Always On requires domain, listener, licensing, and storage decisions outside this container example. |
| databases | Oracle Database Free | `10.0.16.0/24` | `10.0.16.1` | `10.0.16.50` | Not generated; Oracle RAC/Data Guard style HA is not appropriate for the Oracle Free single-container profile. |
| databases | Firebird | `10.0.17.0/24` | `10.0.17.1` | `10.0.17.50` | Not generated; this Firebird container profile has no built-in catalog-safe HA clustering mode. |
| databases | ArangoDB | `10.0.18.0/24` | `10.0.18.1` | `10.0.18.50` | Not generated from the single-server profile; ArangoDB HA requires agency, coordinator, and DB-server role separation. |
| databases | RethinkDB | `10.0.19.0/24` | `10.0.19.1` | `10.0.19.50` | RethinkDB Native Cluster HA: `rethinkdb-01:10.0.19.11`, `rethinkdb-02:10.0.19.12`, `rethinkdb-03:10.0.19.13` |
| cache | Memcached | `10.0.65.0/24` | `10.0.65.1` | `10.0.65.50` | Not generated; Memcached HA is client-side sharding/replication rather than a server-side clustered workflow. |
| cache | Valkey | `10.0.66.0/24` | `10.0.66.1` | `10.0.66.50` | Valkey Sentinel HA: `valkey-01:10.0.66.11`, `valkey-02:10.0.66.12`, `valkey-03:10.0.66.13`<br>Valkey Cluster HA: `valkey-01:10.0.66.11`, `valkey-02:10.0.66.12`, `valkey-03:10.0.66.13`, `valkey-04:10.0.66.14`, `valkey-05:10.0.66.15`, `valkey-06:10.0.66.16` |
| cache | DragonflyDB | `10.0.67.0/24` | `10.0.67.1` | `10.0.67.50` | Not generated; cluster/replication behavior is version and deployment-mode sensitive for this generic image. |
| search | Apache Solr | `10.0.130.0/24` | `10.0.130.1` | `10.0.130.50` | Not generated from the standalone profile; SolrCloud HA requires an explicit ZooKeeper ensemble and collection bootstrap plan. |
| search | Meilisearch | `10.0.131.0/24` | `10.0.131.1` | `10.0.131.50` | Not generated; this OSS single-node profile does not provide a built-in clustered HA topology. |
| search | Typesense | `10.0.132.0/24` | `10.0.132.1` | `10.0.132.50` | Typesense Native Cluster HA: `typesense-01:10.0.132.11`, `typesense-02:10.0.132.12`, `typesense-03:10.0.132.13` |
| vector | Qdrant | `10.0.232.0/24` | `10.0.232.1` | `10.0.232.50` | Not generated from the standalone profile; distributed Qdrant bootstrapping is version-sensitive and should be explicit per release. |
| vector | Weaviate | `10.0.233.0/24` | `10.0.233.1` | `10.0.233.50` | Weaviate Cluster HA: `weaviate-01:10.0.233.11`, `weaviate-02:10.0.233.12`, `weaviate-03:10.0.233.13` |
| vector | Milvus | `10.0.234.0/24` | `10.0.234.1` | `10.0.234.50` | Not generated from the standalone profile; Milvus HA requires external etcd, object storage, and message-bus services. |
| vector | ChromaDB | `10.0.235.0/24` | `10.0.235.1` | `10.0.235.50` | Not generated; this ChromaDB profile does not provide a server-side clustered HA topology. |
| coordination | ZooKeeper | `10.0.162.0/24` | `10.0.162.1` | `10.0.162.50` | ZooKeeper Ensemble HA: `zookeeper-01:10.0.162.11`, `zookeeper-02:10.0.162.12`, `zookeeper-03:10.0.162.13` |
| storage | SeaweedFS | `10.0.145.0/24` | `10.0.145.1` | `10.0.145.50` | SeaweedFS Master Volume Filer HA: `seaweed-master-01:10.0.145.11`, `seaweed-master-02:10.0.145.12`, `seaweed-master-03:10.0.145.13`, `seaweed-volume-01:10.0.145.21`, `seaweed-volume-02:10.0.145.22`, `seaweed-filer-01:10.0.145.31`, `seaweed-filer-02:10.0.145.32` |
| observability | Grafana | `10.0.194.0/24` | `10.0.194.1` | `10.0.194.50` | Not generated from the SQLite-backed profile; Grafana HA requires an external shared database and session/cache strategy. |
| devops | Gitea | `10.0.212.0/24` | `10.0.212.1` | `10.0.212.50` | Not generated from the single-node profile; Gitea HA requires external database, shared storage, and SSH/HTTP load balancing. |
| devops | Drone CI | `10.0.213.0/24` | `10.0.213.1` | `10.0.213.50` | Not generated; this Drone profile is tied to one server/data volume and does not express a catalog-safe HA topology. |
| observability | Jaeger | `10.0.195.0/24` | `10.0.195.1` | `10.0.195.50` | Not generated from the all-in-one profile; Jaeger HA requires collectors/query nodes plus external storage. |

## HA support matrix

| Domain | Stack | HA workflow status | Variants |
| --- | --- | --- | --- |
| databases | PostgreSQL | Generated | PostgreSQL Patroni etcd HA |
| cache | Redis | Generated | Redis Sentinel HA, Redis Cluster HA |
| messaging | Kafka | Generated | Kafka KRaft HA |
| messaging | RabbitMQ | Generated | RabbitMQ Quorum HA |
| kubernetes | Vanilla Kubernetes | Generated | Vanilla Kubernetes HA |
| kubernetes | Rancher RKE2 | Generated | Rancher RKE2 HA |
| monitoring | Prometheus Grafana | Generated | Prometheus Grafana HA |
| databases | MySQL | Generated | MySQL Group Replication HA |
| databases | MariaDB | Generated | MariaDB Galera HA |
| databases | MongoDB | Generated | MongoDB Replica Set HA |
| databases | Cassandra | Generated | Cassandra Native Ring HA |
| databases | ScyllaDB | Generated | ScyllaDB Native Ring HA |
| databases | ClickHouse | Generated | ClickHouse Replicated Keeper HA |
| databases | TimescaleDB | Not generated | Not generated in this catalog scope; TimescaleDB HA should be built on the PostgreSQL Patroni pattern with extension/package hardening. |
| databases | CockroachDB | Generated | CockroachDB Native Cluster HA |
| databases | YugabyteDB | Generated | YugabyteDB RF3 Cluster HA |
| databases | Neo4j | Not generated | Not generated for the community container profile; Neo4j clustering is an enterprise topology and not catalog-safe here. |
| databases | CouchDB | Generated | CouchDB Native Cluster HA |
| databases | InfluxDB | Not generated | Not generated; the OSS InfluxDB v2 container profile does not provide a built-in clustered HA topology. |
| databases | VictoriaMetrics | Generated | VictoriaMetrics Cluster HA |
| databases | QuestDB | Not generated | Not generated; this OSS single-node profile does not expose a catalog-safe native HA topology. |
| search | OpenSearch | Generated | OpenSearch Cluster HA |
| search | Elasticsearch | Generated | Elasticsearch Cluster HA |
| storage | MinIO | Generated | MinIO Distributed Erasure Coding HA |
| coordination | etcd | Generated | etcd Quorum Cluster HA |
| coordination | Consul | Generated | Consul Server Quorum HA |
| messaging | NATS JetStream | Generated | NATS JetStream Cluster HA |
| messaging | Redpanda | Generated | Redpanda Native Cluster HA |
| messaging | Apache Pulsar | Not generated | Not generated from the standalone profile; production HA requires separate ZooKeeper, BookKeeper, broker, and proxy roles. |
| messaging | ActiveMQ Artemis | Not generated | Not generated; live/backup or broker-cluster HA requires topology-specific storage and quorum decisions outside this generic container profile. |
| web | Nginx | Generated | Nginx Active-Active Web HA |
| web | Apache HTTPD | Generated | Apache HTTPD Active-Active Web HA |
| networking | HAProxy | Generated | HAProxy Active-Active Edge HA |
| networking | Traefik | Generated | Traefik Active-Active Ingress HA |
| devops | Jenkins | Not generated | Not generated; Jenkins controller active-active HA is not appropriate for this single-controller OSS profile. |
| devops | GitLab CE | Not generated | Not generated; GitLab CE HA requires a larger reference architecture with external PostgreSQL, Redis, Gitaly, Praefect, and load balancers. |
| devops | Nexus Repository | Not generated | Not generated; Nexus Repository HA is not available for this OSS-style single-node catalog profile. |
| devops | SonarQube | Not generated | Not generated; SonarQube HA requires Data Center style topology, not the community container profile. |
| identity | Keycloak | Not generated | Not generated from the start-dev profile; production Keycloak HA requires external database/cache, TLS, and hostname hardening. |
| security | Vault | Generated | Vault Integrated Raft HA |
| observability | Loki | Not generated | Not generated from the local-config profile; Loki HA requires distributed read/write/backend or simple-scalable mode plus object storage. |
| observability | Tempo | Not generated | Not generated from the local single-binary profile; Tempo HA requires distributed roles and object storage. |
| databases | Microsoft SQL Server | Not generated | Not generated; SQL Server Always On requires domain, listener, licensing, and storage decisions outside this container example. |
| databases | Oracle Database Free | Not generated | Not generated; Oracle RAC/Data Guard style HA is not appropriate for the Oracle Free single-container profile. |
| databases | Firebird | Not generated | Not generated; this Firebird container profile has no built-in catalog-safe HA clustering mode. |
| databases | ArangoDB | Not generated | Not generated from the single-server profile; ArangoDB HA requires agency, coordinator, and DB-server role separation. |
| databases | RethinkDB | Generated | RethinkDB Native Cluster HA |
| cache | Memcached | Not generated | Not generated; Memcached HA is client-side sharding/replication rather than a server-side clustered workflow. |
| cache | Valkey | Generated | Valkey Sentinel HA, Valkey Cluster HA |
| cache | DragonflyDB | Not generated | Not generated; cluster/replication behavior is version and deployment-mode sensitive for this generic image. |
| search | Apache Solr | Not generated | Not generated from the standalone profile; SolrCloud HA requires an explicit ZooKeeper ensemble and collection bootstrap plan. |
| search | Meilisearch | Not generated | Not generated; this OSS single-node profile does not provide a built-in clustered HA topology. |
| search | Typesense | Generated | Typesense Native Cluster HA |
| vector | Qdrant | Not generated | Not generated from the standalone profile; distributed Qdrant bootstrapping is version-sensitive and should be explicit per release. |
| vector | Weaviate | Generated | Weaviate Cluster HA |
| vector | Milvus | Not generated | Not generated from the standalone profile; Milvus HA requires external etcd, object storage, and message-bus services. |
| vector | ChromaDB | Not generated | Not generated; this ChromaDB profile does not provide a server-side clustered HA topology. |
| coordination | ZooKeeper | Generated | ZooKeeper Ensemble HA |
| storage | SeaweedFS | Generated | SeaweedFS Master Volume Filer HA |
| observability | Grafana | Not generated | Not generated from the SQLite-backed profile; Grafana HA requires an external shared database and session/cache strategy. |
| devops | Gitea | Not generated | Not generated from the single-node profile; Gitea HA requires external database, shared storage, and SSH/HTTP load balancing. |
| devops | Drone CI | Not generated | Not generated; this Drone profile is tied to one server/data volume and does not express a catalog-safe HA topology. |
| observability | Jaeger | Not generated | Not generated from the all-in-one profile; Jaeger HA requires collectors/query nodes plus external storage. |

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
| cache | Redis | high-availability | provisioned | [workflows/cache/redis/cluster-ha-provisioned.json](workflows/cache/redis/cluster-ha-provisioned.json) |
| cache | Redis | high-availability | existing | [workflows/cache/redis/cluster-ha-existing.json](workflows/cache/redis/cluster-ha-existing.json) |
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
| databases | MySQL | high-availability | provisioned | [workflows/databases/mysql/group-replication-ha-provisioned.json](workflows/databases/mysql/group-replication-ha-provisioned.json) |
| databases | MySQL | high-availability | existing | [workflows/databases/mysql/group-replication-ha-existing.json](workflows/databases/mysql/group-replication-ha-existing.json) |
| databases | MariaDB | single-node | provisioned | [workflows/databases/mariadb/single-node-provisioned.json](workflows/databases/mariadb/single-node-provisioned.json) |
| databases | MariaDB | single-node | existing | [workflows/databases/mariadb/single-node-existing.json](workflows/databases/mariadb/single-node-existing.json) |
| databases | MariaDB | high-availability | provisioned | [workflows/databases/mariadb/galera-ha-provisioned.json](workflows/databases/mariadb/galera-ha-provisioned.json) |
| databases | MariaDB | high-availability | existing | [workflows/databases/mariadb/galera-ha-existing.json](workflows/databases/mariadb/galera-ha-existing.json) |
| databases | MongoDB | single-node | provisioned | [workflows/databases/mongodb/single-node-provisioned.json](workflows/databases/mongodb/single-node-provisioned.json) |
| databases | MongoDB | single-node | existing | [workflows/databases/mongodb/single-node-existing.json](workflows/databases/mongodb/single-node-existing.json) |
| databases | MongoDB | high-availability | provisioned | [workflows/databases/mongodb/replica-set-ha-provisioned.json](workflows/databases/mongodb/replica-set-ha-provisioned.json) |
| databases | MongoDB | high-availability | existing | [workflows/databases/mongodb/replica-set-ha-existing.json](workflows/databases/mongodb/replica-set-ha-existing.json) |
| databases | Cassandra | single-node | provisioned | [workflows/databases/cassandra/single-node-provisioned.json](workflows/databases/cassandra/single-node-provisioned.json) |
| databases | Cassandra | single-node | existing | [workflows/databases/cassandra/single-node-existing.json](workflows/databases/cassandra/single-node-existing.json) |
| databases | Cassandra | high-availability | provisioned | [workflows/databases/cassandra/native-ring-ha-provisioned.json](workflows/databases/cassandra/native-ring-ha-provisioned.json) |
| databases | Cassandra | high-availability | existing | [workflows/databases/cassandra/native-ring-ha-existing.json](workflows/databases/cassandra/native-ring-ha-existing.json) |
| databases | ScyllaDB | single-node | provisioned | [workflows/databases/scylladb/single-node-provisioned.json](workflows/databases/scylladb/single-node-provisioned.json) |
| databases | ScyllaDB | single-node | existing | [workflows/databases/scylladb/single-node-existing.json](workflows/databases/scylladb/single-node-existing.json) |
| databases | ScyllaDB | high-availability | provisioned | [workflows/databases/scylladb/native-ring-ha-provisioned.json](workflows/databases/scylladb/native-ring-ha-provisioned.json) |
| databases | ScyllaDB | high-availability | existing | [workflows/databases/scylladb/native-ring-ha-existing.json](workflows/databases/scylladb/native-ring-ha-existing.json) |
| databases | ClickHouse | single-node | provisioned | [workflows/databases/clickhouse/single-node-provisioned.json](workflows/databases/clickhouse/single-node-provisioned.json) |
| databases | ClickHouse | single-node | existing | [workflows/databases/clickhouse/single-node-existing.json](workflows/databases/clickhouse/single-node-existing.json) |
| databases | ClickHouse | high-availability | provisioned | [workflows/databases/clickhouse/replicated-keeper-ha-provisioned.json](workflows/databases/clickhouse/replicated-keeper-ha-provisioned.json) |
| databases | ClickHouse | high-availability | existing | [workflows/databases/clickhouse/replicated-keeper-ha-existing.json](workflows/databases/clickhouse/replicated-keeper-ha-existing.json) |
| databases | TimescaleDB | single-node | provisioned | [workflows/databases/timescaledb/single-node-provisioned.json](workflows/databases/timescaledb/single-node-provisioned.json) |
| databases | TimescaleDB | single-node | existing | [workflows/databases/timescaledb/single-node-existing.json](workflows/databases/timescaledb/single-node-existing.json) |
| databases | CockroachDB | single-node | provisioned | [workflows/databases/cockroachdb/single-node-provisioned.json](workflows/databases/cockroachdb/single-node-provisioned.json) |
| databases | CockroachDB | single-node | existing | [workflows/databases/cockroachdb/single-node-existing.json](workflows/databases/cockroachdb/single-node-existing.json) |
| databases | CockroachDB | high-availability | provisioned | [workflows/databases/cockroachdb/native-cluster-ha-provisioned.json](workflows/databases/cockroachdb/native-cluster-ha-provisioned.json) |
| databases | CockroachDB | high-availability | existing | [workflows/databases/cockroachdb/native-cluster-ha-existing.json](workflows/databases/cockroachdb/native-cluster-ha-existing.json) |
| databases | YugabyteDB | single-node | provisioned | [workflows/databases/yugabytedb/single-node-provisioned.json](workflows/databases/yugabytedb/single-node-provisioned.json) |
| databases | YugabyteDB | single-node | existing | [workflows/databases/yugabytedb/single-node-existing.json](workflows/databases/yugabytedb/single-node-existing.json) |
| databases | YugabyteDB | high-availability | provisioned | [workflows/databases/yugabytedb/rf3-cluster-ha-provisioned.json](workflows/databases/yugabytedb/rf3-cluster-ha-provisioned.json) |
| databases | YugabyteDB | high-availability | existing | [workflows/databases/yugabytedb/rf3-cluster-ha-existing.json](workflows/databases/yugabytedb/rf3-cluster-ha-existing.json) |
| databases | Neo4j | single-node | provisioned | [workflows/databases/neo4j/single-node-provisioned.json](workflows/databases/neo4j/single-node-provisioned.json) |
| databases | Neo4j | single-node | existing | [workflows/databases/neo4j/single-node-existing.json](workflows/databases/neo4j/single-node-existing.json) |
| databases | CouchDB | single-node | provisioned | [workflows/databases/couchdb/single-node-provisioned.json](workflows/databases/couchdb/single-node-provisioned.json) |
| databases | CouchDB | single-node | existing | [workflows/databases/couchdb/single-node-existing.json](workflows/databases/couchdb/single-node-existing.json) |
| databases | CouchDB | high-availability | provisioned | [workflows/databases/couchdb/native-cluster-ha-provisioned.json](workflows/databases/couchdb/native-cluster-ha-provisioned.json) |
| databases | CouchDB | high-availability | existing | [workflows/databases/couchdb/native-cluster-ha-existing.json](workflows/databases/couchdb/native-cluster-ha-existing.json) |
| databases | InfluxDB | single-node | provisioned | [workflows/databases/influxdb/single-node-provisioned.json](workflows/databases/influxdb/single-node-provisioned.json) |
| databases | InfluxDB | single-node | existing | [workflows/databases/influxdb/single-node-existing.json](workflows/databases/influxdb/single-node-existing.json) |
| databases | VictoriaMetrics | single-node | provisioned | [workflows/databases/victoriametrics/single-node-provisioned.json](workflows/databases/victoriametrics/single-node-provisioned.json) |
| databases | VictoriaMetrics | single-node | existing | [workflows/databases/victoriametrics/single-node-existing.json](workflows/databases/victoriametrics/single-node-existing.json) |
| databases | VictoriaMetrics | high-availability | provisioned | [workflows/databases/victoriametrics/cluster-ha-provisioned.json](workflows/databases/victoriametrics/cluster-ha-provisioned.json) |
| databases | VictoriaMetrics | high-availability | existing | [workflows/databases/victoriametrics/cluster-ha-existing.json](workflows/databases/victoriametrics/cluster-ha-existing.json) |
| databases | QuestDB | single-node | provisioned | [workflows/databases/questdb/single-node-provisioned.json](workflows/databases/questdb/single-node-provisioned.json) |
| databases | QuestDB | single-node | existing | [workflows/databases/questdb/single-node-existing.json](workflows/databases/questdb/single-node-existing.json) |
| search | OpenSearch | single-node | provisioned | [workflows/search/opensearch/single-node-provisioned.json](workflows/search/opensearch/single-node-provisioned.json) |
| search | OpenSearch | single-node | existing | [workflows/search/opensearch/single-node-existing.json](workflows/search/opensearch/single-node-existing.json) |
| search | OpenSearch | high-availability | provisioned | [workflows/search/opensearch/cluster-ha-provisioned.json](workflows/search/opensearch/cluster-ha-provisioned.json) |
| search | OpenSearch | high-availability | existing | [workflows/search/opensearch/cluster-ha-existing.json](workflows/search/opensearch/cluster-ha-existing.json) |
| search | Elasticsearch | single-node | provisioned | [workflows/search/elasticsearch/single-node-provisioned.json](workflows/search/elasticsearch/single-node-provisioned.json) |
| search | Elasticsearch | single-node | existing | [workflows/search/elasticsearch/single-node-existing.json](workflows/search/elasticsearch/single-node-existing.json) |
| search | Elasticsearch | high-availability | provisioned | [workflows/search/elasticsearch/cluster-ha-provisioned.json](workflows/search/elasticsearch/cluster-ha-provisioned.json) |
| search | Elasticsearch | high-availability | existing | [workflows/search/elasticsearch/cluster-ha-existing.json](workflows/search/elasticsearch/cluster-ha-existing.json) |
| storage | MinIO | single-node | provisioned | [workflows/storage/minio/single-node-provisioned.json](workflows/storage/minio/single-node-provisioned.json) |
| storage | MinIO | single-node | existing | [workflows/storage/minio/single-node-existing.json](workflows/storage/minio/single-node-existing.json) |
| storage | MinIO | high-availability | provisioned | [workflows/storage/minio/distributed-erasure-ha-provisioned.json](workflows/storage/minio/distributed-erasure-ha-provisioned.json) |
| storage | MinIO | high-availability | existing | [workflows/storage/minio/distributed-erasure-ha-existing.json](workflows/storage/minio/distributed-erasure-ha-existing.json) |
| coordination | etcd | single-node | provisioned | [workflows/coordination/etcd/single-node-provisioned.json](workflows/coordination/etcd/single-node-provisioned.json) |
| coordination | etcd | single-node | existing | [workflows/coordination/etcd/single-node-existing.json](workflows/coordination/etcd/single-node-existing.json) |
| coordination | etcd | high-availability | provisioned | [workflows/coordination/etcd/quorum-cluster-ha-provisioned.json](workflows/coordination/etcd/quorum-cluster-ha-provisioned.json) |
| coordination | etcd | high-availability | existing | [workflows/coordination/etcd/quorum-cluster-ha-existing.json](workflows/coordination/etcd/quorum-cluster-ha-existing.json) |
| coordination | Consul | single-node | provisioned | [workflows/coordination/consul/single-node-provisioned.json](workflows/coordination/consul/single-node-provisioned.json) |
| coordination | Consul | single-node | existing | [workflows/coordination/consul/single-node-existing.json](workflows/coordination/consul/single-node-existing.json) |
| coordination | Consul | high-availability | provisioned | [workflows/coordination/consul/server-quorum-ha-provisioned.json](workflows/coordination/consul/server-quorum-ha-provisioned.json) |
| coordination | Consul | high-availability | existing | [workflows/coordination/consul/server-quorum-ha-existing.json](workflows/coordination/consul/server-quorum-ha-existing.json) |
| messaging | NATS JetStream | single-node | provisioned | [workflows/messaging/nats/single-node-provisioned.json](workflows/messaging/nats/single-node-provisioned.json) |
| messaging | NATS JetStream | single-node | existing | [workflows/messaging/nats/single-node-existing.json](workflows/messaging/nats/single-node-existing.json) |
| messaging | NATS JetStream | high-availability | provisioned | [workflows/messaging/nats/jetstream-cluster-ha-provisioned.json](workflows/messaging/nats/jetstream-cluster-ha-provisioned.json) |
| messaging | NATS JetStream | high-availability | existing | [workflows/messaging/nats/jetstream-cluster-ha-existing.json](workflows/messaging/nats/jetstream-cluster-ha-existing.json) |
| messaging | Redpanda | single-node | provisioned | [workflows/messaging/redpanda/single-node-provisioned.json](workflows/messaging/redpanda/single-node-provisioned.json) |
| messaging | Redpanda | single-node | existing | [workflows/messaging/redpanda/single-node-existing.json](workflows/messaging/redpanda/single-node-existing.json) |
| messaging | Redpanda | high-availability | provisioned | [workflows/messaging/redpanda/native-cluster-ha-provisioned.json](workflows/messaging/redpanda/native-cluster-ha-provisioned.json) |
| messaging | Redpanda | high-availability | existing | [workflows/messaging/redpanda/native-cluster-ha-existing.json](workflows/messaging/redpanda/native-cluster-ha-existing.json) |
| messaging | Apache Pulsar | single-node | provisioned | [workflows/messaging/pulsar/single-node-provisioned.json](workflows/messaging/pulsar/single-node-provisioned.json) |
| messaging | Apache Pulsar | single-node | existing | [workflows/messaging/pulsar/single-node-existing.json](workflows/messaging/pulsar/single-node-existing.json) |
| messaging | ActiveMQ Artemis | single-node | provisioned | [workflows/messaging/activemq-artemis/single-node-provisioned.json](workflows/messaging/activemq-artemis/single-node-provisioned.json) |
| messaging | ActiveMQ Artemis | single-node | existing | [workflows/messaging/activemq-artemis/single-node-existing.json](workflows/messaging/activemq-artemis/single-node-existing.json) |
| web | Nginx | single-node | provisioned | [workflows/web/nginx/single-node-provisioned.json](workflows/web/nginx/single-node-provisioned.json) |
| web | Nginx | single-node | existing | [workflows/web/nginx/single-node-existing.json](workflows/web/nginx/single-node-existing.json) |
| web | Nginx | high-availability | provisioned | [workflows/web/nginx/active-active-ha-provisioned.json](workflows/web/nginx/active-active-ha-provisioned.json) |
| web | Nginx | high-availability | existing | [workflows/web/nginx/active-active-ha-existing.json](workflows/web/nginx/active-active-ha-existing.json) |
| web | Apache HTTPD | single-node | provisioned | [workflows/web/apache-httpd/single-node-provisioned.json](workflows/web/apache-httpd/single-node-provisioned.json) |
| web | Apache HTTPD | single-node | existing | [workflows/web/apache-httpd/single-node-existing.json](workflows/web/apache-httpd/single-node-existing.json) |
| web | Apache HTTPD | high-availability | provisioned | [workflows/web/apache-httpd/active-active-ha-provisioned.json](workflows/web/apache-httpd/active-active-ha-provisioned.json) |
| web | Apache HTTPD | high-availability | existing | [workflows/web/apache-httpd/active-active-ha-existing.json](workflows/web/apache-httpd/active-active-ha-existing.json) |
| networking | HAProxy | single-node | provisioned | [workflows/networking/haproxy/single-node-provisioned.json](workflows/networking/haproxy/single-node-provisioned.json) |
| networking | HAProxy | single-node | existing | [workflows/networking/haproxy/single-node-existing.json](workflows/networking/haproxy/single-node-existing.json) |
| networking | HAProxy | high-availability | provisioned | [workflows/networking/haproxy/active-active-ha-provisioned.json](workflows/networking/haproxy/active-active-ha-provisioned.json) |
| networking | HAProxy | high-availability | existing | [workflows/networking/haproxy/active-active-ha-existing.json](workflows/networking/haproxy/active-active-ha-existing.json) |
| networking | Traefik | single-node | provisioned | [workflows/networking/traefik/single-node-provisioned.json](workflows/networking/traefik/single-node-provisioned.json) |
| networking | Traefik | single-node | existing | [workflows/networking/traefik/single-node-existing.json](workflows/networking/traefik/single-node-existing.json) |
| networking | Traefik | high-availability | provisioned | [workflows/networking/traefik/active-active-ha-provisioned.json](workflows/networking/traefik/active-active-ha-provisioned.json) |
| networking | Traefik | high-availability | existing | [workflows/networking/traefik/active-active-ha-existing.json](workflows/networking/traefik/active-active-ha-existing.json) |
| devops | Jenkins | single-node | provisioned | [workflows/devops/jenkins/single-node-provisioned.json](workflows/devops/jenkins/single-node-provisioned.json) |
| devops | Jenkins | single-node | existing | [workflows/devops/jenkins/single-node-existing.json](workflows/devops/jenkins/single-node-existing.json) |
| devops | GitLab CE | single-node | provisioned | [workflows/devops/gitlab-ce/single-node-provisioned.json](workflows/devops/gitlab-ce/single-node-provisioned.json) |
| devops | GitLab CE | single-node | existing | [workflows/devops/gitlab-ce/single-node-existing.json](workflows/devops/gitlab-ce/single-node-existing.json) |
| devops | Nexus Repository | single-node | provisioned | [workflows/devops/nexus-repository/single-node-provisioned.json](workflows/devops/nexus-repository/single-node-provisioned.json) |
| devops | Nexus Repository | single-node | existing | [workflows/devops/nexus-repository/single-node-existing.json](workflows/devops/nexus-repository/single-node-existing.json) |
| devops | SonarQube | single-node | provisioned | [workflows/devops/sonarqube/single-node-provisioned.json](workflows/devops/sonarqube/single-node-provisioned.json) |
| devops | SonarQube | single-node | existing | [workflows/devops/sonarqube/single-node-existing.json](workflows/devops/sonarqube/single-node-existing.json) |
| identity | Keycloak | single-node | provisioned | [workflows/identity/keycloak/single-node-provisioned.json](workflows/identity/keycloak/single-node-provisioned.json) |
| identity | Keycloak | single-node | existing | [workflows/identity/keycloak/single-node-existing.json](workflows/identity/keycloak/single-node-existing.json) |
| security | Vault | single-node | provisioned | [workflows/security/vault/single-node-provisioned.json](workflows/security/vault/single-node-provisioned.json) |
| security | Vault | single-node | existing | [workflows/security/vault/single-node-existing.json](workflows/security/vault/single-node-existing.json) |
| security | Vault | high-availability | provisioned | [workflows/security/vault/raft-ha-provisioned.json](workflows/security/vault/raft-ha-provisioned.json) |
| security | Vault | high-availability | existing | [workflows/security/vault/raft-ha-existing.json](workflows/security/vault/raft-ha-existing.json) |
| observability | Loki | single-node | provisioned | [workflows/observability/loki/single-node-provisioned.json](workflows/observability/loki/single-node-provisioned.json) |
| observability | Loki | single-node | existing | [workflows/observability/loki/single-node-existing.json](workflows/observability/loki/single-node-existing.json) |
| observability | Tempo | single-node | provisioned | [workflows/observability/tempo/single-node-provisioned.json](workflows/observability/tempo/single-node-provisioned.json) |
| observability | Tempo | single-node | existing | [workflows/observability/tempo/single-node-existing.json](workflows/observability/tempo/single-node-existing.json) |
| databases | Microsoft SQL Server | single-node | provisioned | [workflows/databases/mssql/single-node-provisioned.json](workflows/databases/mssql/single-node-provisioned.json) |
| databases | Microsoft SQL Server | single-node | existing | [workflows/databases/mssql/single-node-existing.json](workflows/databases/mssql/single-node-existing.json) |
| databases | Oracle Database Free | single-node | provisioned | [workflows/databases/oracle-free/single-node-provisioned.json](workflows/databases/oracle-free/single-node-provisioned.json) |
| databases | Oracle Database Free | single-node | existing | [workflows/databases/oracle-free/single-node-existing.json](workflows/databases/oracle-free/single-node-existing.json) |
| databases | Firebird | single-node | provisioned | [workflows/databases/firebird/single-node-provisioned.json](workflows/databases/firebird/single-node-provisioned.json) |
| databases | Firebird | single-node | existing | [workflows/databases/firebird/single-node-existing.json](workflows/databases/firebird/single-node-existing.json) |
| databases | ArangoDB | single-node | provisioned | [workflows/databases/arangodb/single-node-provisioned.json](workflows/databases/arangodb/single-node-provisioned.json) |
| databases | ArangoDB | single-node | existing | [workflows/databases/arangodb/single-node-existing.json](workflows/databases/arangodb/single-node-existing.json) |
| databases | RethinkDB | single-node | provisioned | [workflows/databases/rethinkdb/single-node-provisioned.json](workflows/databases/rethinkdb/single-node-provisioned.json) |
| databases | RethinkDB | single-node | existing | [workflows/databases/rethinkdb/single-node-existing.json](workflows/databases/rethinkdb/single-node-existing.json) |
| databases | RethinkDB | high-availability | provisioned | [workflows/databases/rethinkdb/native-cluster-ha-provisioned.json](workflows/databases/rethinkdb/native-cluster-ha-provisioned.json) |
| databases | RethinkDB | high-availability | existing | [workflows/databases/rethinkdb/native-cluster-ha-existing.json](workflows/databases/rethinkdb/native-cluster-ha-existing.json) |
| cache | Memcached | single-node | provisioned | [workflows/cache/memcached/single-node-provisioned.json](workflows/cache/memcached/single-node-provisioned.json) |
| cache | Memcached | single-node | existing | [workflows/cache/memcached/single-node-existing.json](workflows/cache/memcached/single-node-existing.json) |
| cache | Valkey | single-node | provisioned | [workflows/cache/valkey/single-node-provisioned.json](workflows/cache/valkey/single-node-provisioned.json) |
| cache | Valkey | single-node | existing | [workflows/cache/valkey/single-node-existing.json](workflows/cache/valkey/single-node-existing.json) |
| cache | Valkey | high-availability | provisioned | [workflows/cache/valkey/sentinel-ha-provisioned.json](workflows/cache/valkey/sentinel-ha-provisioned.json) |
| cache | Valkey | high-availability | existing | [workflows/cache/valkey/sentinel-ha-existing.json](workflows/cache/valkey/sentinel-ha-existing.json) |
| cache | Valkey | high-availability | provisioned | [workflows/cache/valkey/cluster-ha-provisioned.json](workflows/cache/valkey/cluster-ha-provisioned.json) |
| cache | Valkey | high-availability | existing | [workflows/cache/valkey/cluster-ha-existing.json](workflows/cache/valkey/cluster-ha-existing.json) |
| cache | DragonflyDB | single-node | provisioned | [workflows/cache/dragonflydb/single-node-provisioned.json](workflows/cache/dragonflydb/single-node-provisioned.json) |
| cache | DragonflyDB | single-node | existing | [workflows/cache/dragonflydb/single-node-existing.json](workflows/cache/dragonflydb/single-node-existing.json) |
| search | Apache Solr | single-node | provisioned | [workflows/search/solr/single-node-provisioned.json](workflows/search/solr/single-node-provisioned.json) |
| search | Apache Solr | single-node | existing | [workflows/search/solr/single-node-existing.json](workflows/search/solr/single-node-existing.json) |
| search | Meilisearch | single-node | provisioned | [workflows/search/meilisearch/single-node-provisioned.json](workflows/search/meilisearch/single-node-provisioned.json) |
| search | Meilisearch | single-node | existing | [workflows/search/meilisearch/single-node-existing.json](workflows/search/meilisearch/single-node-existing.json) |
| search | Typesense | single-node | provisioned | [workflows/search/typesense/single-node-provisioned.json](workflows/search/typesense/single-node-provisioned.json) |
| search | Typesense | single-node | existing | [workflows/search/typesense/single-node-existing.json](workflows/search/typesense/single-node-existing.json) |
| search | Typesense | high-availability | provisioned | [workflows/search/typesense/native-cluster-ha-provisioned.json](workflows/search/typesense/native-cluster-ha-provisioned.json) |
| search | Typesense | high-availability | existing | [workflows/search/typesense/native-cluster-ha-existing.json](workflows/search/typesense/native-cluster-ha-existing.json) |
| vector | Qdrant | single-node | provisioned | [workflows/vector/qdrant/single-node-provisioned.json](workflows/vector/qdrant/single-node-provisioned.json) |
| vector | Qdrant | single-node | existing | [workflows/vector/qdrant/single-node-existing.json](workflows/vector/qdrant/single-node-existing.json) |
| vector | Weaviate | single-node | provisioned | [workflows/vector/weaviate/single-node-provisioned.json](workflows/vector/weaviate/single-node-provisioned.json) |
| vector | Weaviate | single-node | existing | [workflows/vector/weaviate/single-node-existing.json](workflows/vector/weaviate/single-node-existing.json) |
| vector | Weaviate | high-availability | provisioned | [workflows/vector/weaviate/cluster-ha-provisioned.json](workflows/vector/weaviate/cluster-ha-provisioned.json) |
| vector | Weaviate | high-availability | existing | [workflows/vector/weaviate/cluster-ha-existing.json](workflows/vector/weaviate/cluster-ha-existing.json) |
| vector | Milvus | single-node | provisioned | [workflows/vector/milvus/single-node-provisioned.json](workflows/vector/milvus/single-node-provisioned.json) |
| vector | Milvus | single-node | existing | [workflows/vector/milvus/single-node-existing.json](workflows/vector/milvus/single-node-existing.json) |
| vector | ChromaDB | single-node | provisioned | [workflows/vector/chromadb/single-node-provisioned.json](workflows/vector/chromadb/single-node-provisioned.json) |
| vector | ChromaDB | single-node | existing | [workflows/vector/chromadb/single-node-existing.json](workflows/vector/chromadb/single-node-existing.json) |
| coordination | ZooKeeper | single-node | provisioned | [workflows/coordination/zookeeper/single-node-provisioned.json](workflows/coordination/zookeeper/single-node-provisioned.json) |
| coordination | ZooKeeper | single-node | existing | [workflows/coordination/zookeeper/single-node-existing.json](workflows/coordination/zookeeper/single-node-existing.json) |
| coordination | ZooKeeper | high-availability | provisioned | [workflows/coordination/zookeeper/ensemble-ha-provisioned.json](workflows/coordination/zookeeper/ensemble-ha-provisioned.json) |
| coordination | ZooKeeper | high-availability | existing | [workflows/coordination/zookeeper/ensemble-ha-existing.json](workflows/coordination/zookeeper/ensemble-ha-existing.json) |
| storage | SeaweedFS | single-node | provisioned | [workflows/storage/seaweedfs/single-node-provisioned.json](workflows/storage/seaweedfs/single-node-provisioned.json) |
| storage | SeaweedFS | single-node | existing | [workflows/storage/seaweedfs/single-node-existing.json](workflows/storage/seaweedfs/single-node-existing.json) |
| storage | SeaweedFS | high-availability | provisioned | [workflows/storage/seaweedfs/master-volume-filer-ha-provisioned.json](workflows/storage/seaweedfs/master-volume-filer-ha-provisioned.json) |
| storage | SeaweedFS | high-availability | existing | [workflows/storage/seaweedfs/master-volume-filer-ha-existing.json](workflows/storage/seaweedfs/master-volume-filer-ha-existing.json) |
| observability | Grafana | single-node | provisioned | [workflows/observability/grafana/single-node-provisioned.json](workflows/observability/grafana/single-node-provisioned.json) |
| observability | Grafana | single-node | existing | [workflows/observability/grafana/single-node-existing.json](workflows/observability/grafana/single-node-existing.json) |
| devops | Gitea | single-node | provisioned | [workflows/devops/gitea/single-node-provisioned.json](workflows/devops/gitea/single-node-provisioned.json) |
| devops | Gitea | single-node | existing | [workflows/devops/gitea/single-node-existing.json](workflows/devops/gitea/single-node-existing.json) |
| devops | Drone CI | single-node | provisioned | [workflows/devops/drone/single-node-provisioned.json](workflows/devops/drone/single-node-provisioned.json) |
| devops | Drone CI | single-node | existing | [workflows/devops/drone/single-node-existing.json](workflows/devops/drone/single-node-existing.json) |
| observability | Jaeger | single-node | provisioned | [workflows/observability/jaeger/single-node-provisioned.json](workflows/observability/jaeger/single-node-provisioned.json) |
| observability | Jaeger | single-node | existing | [workflows/observability/jaeger/single-node-existing.json](workflows/observability/jaeger/single-node-existing.json) |

## Directory guide

- `topologies/`: generated Markdown documentation with Mermaid diagrams for every stack topology.
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
- HA command steps are plain bash scripts that run on the active target node. They do not install external orchestration tools inside command nodes or wrap shell logic in generated orchestration files.
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
