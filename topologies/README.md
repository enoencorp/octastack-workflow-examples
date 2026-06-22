# Topology Documentation

This directory contains generated Mermaid topology diagrams for every stack in the workflow library. Each stack document includes the single-node topology, generated HA topologies when available, inventory tables, and links back to the workflow JSON packages.

## Network Plan

All diagrams use the parent network `10.0.0.0/16`. Each top-level domain receives a category block, and each stack receives one `/24` inside that block.

| Domain | Category block |
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

## Stack Index

| Domain | Stack | Stack block | HA status | Topology document |
| --- | --- | --- | --- | --- |
| databases | PostgreSQL | `10.0.0.0/24` | PostgreSQL Patroni etcd HA | [databases/postgresql](databases/postgresql.md) |
| cache | Redis | `10.0.64.0/24` | Redis Sentinel HA, Redis Cluster HA | [cache/redis](cache/redis.md) |
| messaging | Kafka | `10.0.80.0/24` | Kafka KRaft HA | [messaging/kafka](messaging/kafka.md) |
| messaging | RabbitMQ | `10.0.81.0/24` | RabbitMQ Quorum HA | [messaging/rabbitmq](messaging/rabbitmq.md) |
| kubernetes | Vanilla Kubernetes | `10.0.96.0/24` | Vanilla Kubernetes HA | [kubernetes/vanilla](kubernetes/vanilla.md) |
| kubernetes | Rancher RKE2 | `10.0.97.0/24` | Rancher RKE2 HA | [kubernetes/rancher-rke2](kubernetes/rancher-rke2.md) |
| monitoring | Prometheus Grafana | `10.0.112.0/24` | Prometheus Grafana HA | [monitoring/prometheus-grafana](monitoring/prometheus-grafana.md) |
| databases | MySQL | `10.0.1.0/24` | MySQL Group Replication HA | [databases/mysql](databases/mysql.md) |
| databases | MariaDB | `10.0.2.0/24` | MariaDB Galera HA | [databases/mariadb](databases/mariadb.md) |
| databases | MongoDB | `10.0.3.0/24` | MongoDB Replica Set HA | [databases/mongodb](databases/mongodb.md) |
| databases | Cassandra | `10.0.4.0/24` | Cassandra Native Ring HA | [databases/cassandra](databases/cassandra.md) |
| databases | ScyllaDB | `10.0.5.0/24` | ScyllaDB Native Ring HA | [databases/scylladb](databases/scylladb.md) |
| databases | ClickHouse | `10.0.6.0/24` | ClickHouse Replicated Keeper HA | [databases/clickhouse](databases/clickhouse.md) |
| databases | TimescaleDB | `10.0.7.0/24` | Not generated in this catalog scope; TimescaleDB HA should be built on the PostgreSQL Patroni pattern with extension/package hardening. | [databases/timescaledb](databases/timescaledb.md) |
| databases | CockroachDB | `10.0.8.0/24` | CockroachDB Native Cluster HA | [databases/cockroachdb](databases/cockroachdb.md) |
| databases | YugabyteDB | `10.0.9.0/24` | YugabyteDB RF3 Cluster HA | [databases/yugabytedb](databases/yugabytedb.md) |
| databases | Neo4j | `10.0.10.0/24` | Not generated for the community container profile; Neo4j clustering is an enterprise topology and not catalog-safe here. | [databases/neo4j](databases/neo4j.md) |
| databases | CouchDB | `10.0.11.0/24` | CouchDB Native Cluster HA | [databases/couchdb](databases/couchdb.md) |
| databases | InfluxDB | `10.0.12.0/24` | Not generated; the OSS InfluxDB v2 container profile does not provide a built-in clustered HA topology. | [databases/influxdb](databases/influxdb.md) |
| databases | VictoriaMetrics | `10.0.13.0/24` | VictoriaMetrics Cluster HA | [databases/victoriametrics](databases/victoriametrics.md) |
| databases | QuestDB | `10.0.14.0/24` | Not generated; this OSS single-node profile does not expose a catalog-safe native HA topology. | [databases/questdb](databases/questdb.md) |
| search | OpenSearch | `10.0.128.0/24` | OpenSearch Cluster HA | [search/opensearch](search/opensearch.md) |
| search | Elasticsearch | `10.0.129.0/24` | Elasticsearch Cluster HA | [search/elasticsearch](search/elasticsearch.md) |
| storage | MinIO | `10.0.144.0/24` | MinIO Distributed Erasure Coding HA | [storage/minio](storage/minio.md) |
| coordination | etcd | `10.0.160.0/24` | etcd Quorum Cluster HA | [coordination/etcd](coordination/etcd.md) |
| coordination | Consul | `10.0.161.0/24` | Consul Server Quorum HA | [coordination/consul](coordination/consul.md) |
| messaging | NATS JetStream | `10.0.82.0/24` | NATS JetStream Cluster HA | [messaging/nats](messaging/nats.md) |
| messaging | Redpanda | `10.0.83.0/24` | Redpanda Native Cluster HA | [messaging/redpanda](messaging/redpanda.md) |
| messaging | Apache Pulsar | `10.0.84.0/24` | Not generated from the standalone profile; production HA requires separate ZooKeeper, BookKeeper, broker, and proxy roles. | [messaging/pulsar](messaging/pulsar.md) |
| messaging | ActiveMQ Artemis | `10.0.85.0/24` | Not generated; live/backup or broker-cluster HA requires topology-specific storage and quorum decisions outside this generic container profile. | [messaging/activemq-artemis](messaging/activemq-artemis.md) |
| web | Nginx | `10.0.240.0/24` | Nginx Active-Active Web HA | [web/nginx](web/nginx.md) |
| web | Apache HTTPD | `10.0.241.0/24` | Apache HTTPD Active-Active Web HA | [web/apache-httpd](web/apache-httpd.md) |
| networking | HAProxy | `10.0.176.0/24` | HAProxy Active-Active Edge HA | [networking/haproxy](networking/haproxy.md) |
| networking | Traefik | `10.0.177.0/24` | Traefik Active-Active Ingress HA | [networking/traefik](networking/traefik.md) |
| devops | Jenkins | `10.0.208.0/24` | Not generated; Jenkins controller active-active HA is not appropriate for this single-controller OSS profile. | [devops/jenkins](devops/jenkins.md) |
| devops | GitLab CE | `10.0.209.0/24` | Not generated; GitLab CE HA requires a larger reference architecture with external PostgreSQL, Redis, Gitaly, Praefect, and load balancers. | [devops/gitlab-ce](devops/gitlab-ce.md) |
| devops | Nexus Repository | `10.0.210.0/24` | Not generated; Nexus Repository HA is not available for this OSS-style single-node catalog profile. | [devops/nexus-repository](devops/nexus-repository.md) |
| devops | SonarQube | `10.0.211.0/24` | Not generated; SonarQube HA requires Data Center style topology, not the community container profile. | [devops/sonarqube](devops/sonarqube.md) |
| identity | Keycloak | `10.0.224.0/24` | Not generated from the start-dev profile; production Keycloak HA requires external database/cache, TLS, and hostname hardening. | [identity/keycloak](identity/keycloak.md) |
| security | Vault | `10.0.228.0/24` | Vault Integrated Raft HA | [security/vault](security/vault.md) |
| observability | Loki | `10.0.192.0/24` | Not generated from the local-config profile; Loki HA requires distributed read/write/backend or simple-scalable mode plus object storage. | [observability/loki](observability/loki.md) |
| observability | Tempo | `10.0.193.0/24` | Not generated from the local single-binary profile; Tempo HA requires distributed roles and object storage. | [observability/tempo](observability/tempo.md) |
| databases | Microsoft SQL Server | `10.0.15.0/24` | Not generated; SQL Server Always On requires domain, listener, licensing, and storage decisions outside this container example. | [databases/mssql](databases/mssql.md) |
| databases | Oracle Database Free | `10.0.16.0/24` | Not generated; Oracle RAC/Data Guard style HA is not appropriate for the Oracle Free single-container profile. | [databases/oracle-free](databases/oracle-free.md) |
| databases | Firebird | `10.0.17.0/24` | Not generated; this Firebird container profile has no built-in catalog-safe HA clustering mode. | [databases/firebird](databases/firebird.md) |
| databases | ArangoDB | `10.0.18.0/24` | Not generated from the single-server profile; ArangoDB HA requires agency, coordinator, and DB-server role separation. | [databases/arangodb](databases/arangodb.md) |
| databases | RethinkDB | `10.0.19.0/24` | RethinkDB Native Cluster HA | [databases/rethinkdb](databases/rethinkdb.md) |
| cache | Memcached | `10.0.65.0/24` | Not generated; Memcached HA is client-side sharding/replication rather than a server-side clustered workflow. | [cache/memcached](cache/memcached.md) |
| cache | Valkey | `10.0.66.0/24` | Valkey Sentinel HA, Valkey Cluster HA | [cache/valkey](cache/valkey.md) |
| cache | DragonflyDB | `10.0.67.0/24` | Not generated; cluster/replication behavior is version and deployment-mode sensitive for this generic image. | [cache/dragonflydb](cache/dragonflydb.md) |
| search | Apache Solr | `10.0.130.0/24` | Not generated from the standalone profile; SolrCloud HA requires an explicit ZooKeeper ensemble and collection bootstrap plan. | [search/solr](search/solr.md) |
| search | Meilisearch | `10.0.131.0/24` | Not generated; this OSS single-node profile does not provide a built-in clustered HA topology. | [search/meilisearch](search/meilisearch.md) |
| search | Typesense | `10.0.132.0/24` | Typesense Native Cluster HA | [search/typesense](search/typesense.md) |
| vector | Qdrant | `10.0.232.0/24` | Not generated from the standalone profile; distributed Qdrant bootstrapping is version-sensitive and should be explicit per release. | [vector/qdrant](vector/qdrant.md) |
| vector | Weaviate | `10.0.233.0/24` | Weaviate Cluster HA | [vector/weaviate](vector/weaviate.md) |
| vector | Milvus | `10.0.234.0/24` | Not generated from the standalone profile; Milvus HA requires external etcd, object storage, and message-bus services. | [vector/milvus](vector/milvus.md) |
| vector | ChromaDB | `10.0.235.0/24` | Not generated; this ChromaDB profile does not provide a server-side clustered HA topology. | [vector/chromadb](vector/chromadb.md) |
| coordination | ZooKeeper | `10.0.162.0/24` | ZooKeeper Ensemble HA | [coordination/zookeeper](coordination/zookeeper.md) |
| storage | SeaweedFS | `10.0.145.0/24` | SeaweedFS Master Volume Filer HA | [storage/seaweedfs](storage/seaweedfs.md) |
| observability | Grafana | `10.0.194.0/24` | Not generated from the SQLite-backed profile; Grafana HA requires an external shared database and session/cache strategy. | [observability/grafana](observability/grafana.md) |
| devops | Gitea | `10.0.212.0/24` | Not generated from the single-node profile; Gitea HA requires external database, shared storage, and SSH/HTTP load balancing. | [devops/gitea](devops/gitea.md) |
| devops | Drone CI | `10.0.213.0/24` | Not generated; this Drone profile is tied to one server/data volume and does not express a catalog-safe HA topology. | [devops/drone](devops/drone.md) |
| observability | Jaeger | `10.0.195.0/24` | Not generated from the all-in-one profile; Jaeger HA requires collectors/query nodes plus external storage. | [observability/jaeger](observability/jaeger.md) |
