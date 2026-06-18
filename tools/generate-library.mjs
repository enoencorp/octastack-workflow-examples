import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const WORKFLOW_ROOT = path.join(ROOT, "workflows");

const WORKFLOW_PACKAGE_KIND = "octastack.workflow.package";
const WORKFLOW_PACKAGE_VERSION = 1;
const EXPORTED_AT = "2026-06-19T00:00:00Z";
const PROFILE_ID = "replace-with-proxmox-profile-id";
const TEMPLATE_ID = "9000";
const LAYOUT = {
  centerX: 80,
  topY: 80,
  verticalGap: 280,
  branchGapX: 420,
  nodeWidthBudget: 320,
  nodeHeightBudget: 220
};

function text(value) {
  return value.trim().replace(/\n{3,}/g, "\n\n") + "\n";
}

function variable(id, key, source, value) {
  return { id, key, source, value };
}

function triggerData(label, variables = []) {
  return {
    label,
    triggerType: "manual",
    enabled: true,
    variables,
    webhookPath: "",
    secretRef: "",
    cronExpr: "",
    timezone: "UTC"
  };
}

function serverTarget(id, label, host) {
  return {
    id,
    source: "manual",
    host,
    label,
    ip: host,
    name: label.toLowerCase().replaceAll(" ", "-"),
    node: "",
    vmid: "",
    status: "existing",
    type: "manual"
  };
}

function serverData(label, host) {
  return {
    label,
    hostname: host,
    targets: [serverTarget("target-0", label, host)]
  };
}

function provisionData(target, stack) {
  const diskSize = target.diskGb ?? stack.defaultDiskGb ?? "40";
  return {
    label: `Provision ${target.label}`,
    node: target.proxmoxNode ?? "pve1",
    templateId: target.templateId ?? TEMPLATE_ID,
    instanceName: target.vmName,
    vmId: "",
    autoVmid: true,
    environment: stack.environment ?? "PROD",
    serverType: target.role.toUpperCase(),
    cores: String(target.cores ?? stack.defaultCores ?? 2),
    memory: String(target.memory ?? stack.defaultMemory ?? 4096),
    machine: "q35",
    ostype: "l26",
    bios: "seabios",
    onboot: true,
    agent: true,
    targetStorage: "local-lvm",
    cloudInitStorage: "local-lvm",
    cicustom: "",
    disks: [
      {
        id: "disk-0",
        slot: "scsi1",
        bus: "scsi",
        storage: "local-lvm",
        sizeGb: String(diskSize),
        cache: "",
        iothread: true,
        discard: true,
        ssd: true,
        backup: true
      }
    ],
    networks: [
      {
        id: "net-0",
        slot: "net0",
        model: "virtio",
        bridge: "vmbr0",
        vlanTag: stack.vlanTag ?? "",
        firewall: true,
        rateLimitMbps: "",
        macAddress: "",
        queues: "",
        ipAddress: `${target.ip}/24`,
        gw: stack.gateway,
        dns1: "1.1.1.1",
        dns2: "8.8.8.8",
        domain: stack.domain
      }
    ],
    ipAddress: `${target.ip}/24`,
    gw: stack.gateway,
    dns1: "1.1.1.1",
    dns2: "8.8.8.8",
    domain: stack.domain
  };
}

function waitData(label, probeLabel = "SSH reachability") {
  return {
    label,
    timeout: "20",
    interval: "10",
    probes: [
      {
        id: "probe-0",
        type: "ssh",
        host: "",
        port: "22",
        label: probeLabel
      }
    ]
  };
}

function node(id, type, x, y, data) {
  return { id, type, position: { x, y }, data };
}

function edge(id, source, target, options = {}) {
  const mode = options.mode ?? "sequential";
  const out = {
    id,
    source,
    target,
    type: "workflowEdge",
    mode,
    order: options.order ?? 1,
    data: {
      mode,
      order: options.order ?? 1
    }
  };
  if (options.sourceHandle) {
    out.sourceHandle = options.sourceHandle;
  }
  return out;
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function inventory(nodes) {
  return nodes.map((target) => `${target.ip} role=${target.role} name=${target.label}`).join("\n");
}

function layer(index) {
  return LAYOUT.topY + index * LAYOUT.verticalGap;
}

function branchX(count, index) {
  return Math.round(LAYOUT.centerX + (index - (count - 1) / 2) * LAYOUT.branchGapX);
}

function createSingleProvisionedWorkflow(stack) {
  const target = stack.single.target;
  const nodes = [
    node("node_trigger", "triggerNode", LAYOUT.centerX, layer(0), triggerData(`${stack.displayName} single-node provisioned`, stack.variables)),
    node("node_context", "proxmoxConfigNode", LAYOUT.centerX, layer(1), {
      label: "Cluster Context",
      profileId: PROFILE_ID
    }),
    node("node_provision", "provisionNode", LAYOUT.centerX, layer(2), provisionData(target, stack)),
    node("node_wait", "waitUntilUpNode", LAYOUT.centerX, layer(3), waitData("Wait for provisioned host")),
    node("node_install", "customNode", LAYOUT.centerX, layer(4), {
      label: `Install ${stack.displayName}`,
      customNodeId: "",
      scriptType: "shell",
      scriptContent: stack.single.install,
      sudo: true,
      method: "GET",
      path: "",
      body: "{}"
    }),
    node("node_health", "configCommandNode", LAYOUT.centerX, layer(5), {
      label: `${stack.displayName} health check`,
      command: stack.single.health,
      sudo: false
    }),
    node("node_end", "endNode", LAYOUT.centerX, layer(6), { label: "End" })
  ];
  const edges = [
    edge("edge_trigger_context", "node_trigger", "node_context"),
    edge("edge_context_provision", "node_context", "node_provision"),
    edge("edge_provision_wait", "node_provision", "node_wait"),
    edge("edge_wait_install", "node_wait", "node_install"),
    edge("edge_install_health", "node_install", "node_health"),
    edge("edge_health_end", "node_health", "node_end")
  ];
  return { nodes, edges };
}

function createSingleExistingWorkflow(stack) {
  const target = stack.single.target;
  const nodes = [
    node("node_trigger", "triggerNode", LAYOUT.centerX, layer(0), triggerData(`${stack.displayName} single-node existing`, stack.variables)),
    node("node_server", "serverNode", LAYOUT.centerX, layer(1), serverData(`${stack.displayName} Host`, stack.single.existingHost ?? target.ip)),
    node("node_wait", "waitUntilUpNode", LAYOUT.centerX, layer(2), waitData("Wait for existing host")),
    node("node_install", "customNode", LAYOUT.centerX, layer(3), {
      label: `Install ${stack.displayName}`,
      customNodeId: "",
      scriptType: "shell",
      scriptContent: stack.single.install,
      sudo: true,
      method: "GET",
      path: "",
      body: "{}"
    }),
    node("node_health", "configCommandNode", LAYOUT.centerX, layer(4), {
      label: `${stack.displayName} health check`,
      command: stack.single.health,
      sudo: false
    }),
    node("node_end", "endNode", LAYOUT.centerX, layer(5), { label: "End" })
  ];
  const edges = [
    edge("edge_trigger_server", "node_trigger", "node_server"),
    edge("edge_server_wait", "node_server", "node_wait"),
    edge("edge_wait_install", "node_wait", "node_install"),
    edge("edge_install_health", "node_install", "node_health"),
    edge("edge_health_end", "node_health", "node_end")
  ];
  return { nodes, edges };
}

function createHaProvisionedWorkflow(stack) {
  const nodes = [
    node("node_trigger", "triggerNode", LAYOUT.centerX, layer(0), triggerData(`${stack.ha.title} provisioned`, stack.variables)),
    node("node_context", "proxmoxConfigNode", LAYOUT.centerX, layer(1), {
      label: "Cluster Context",
      profileId: PROFILE_ID
    })
  ];
  const edges = [edge("edge_trigger_context", "node_trigger", "node_context")];
  stack.ha.nodes.forEach((target, index) => {
    const x = branchX(stack.ha.nodes.length, index);
    const provisionId = `node_provision_${slug(target.label)}`;
    const waitId = `node_wait_${slug(target.label)}`;
    nodes.push(node(provisionId, "provisionNode", x, layer(2), provisionData(target, stack)));
    nodes.push(node(waitId, "waitUntilUpNode", x, layer(3), waitData(`Wait ${target.label}`)));
    edges.push(edge(`edge_context_${slug(target.label)}`, "node_context", provisionId, {
      mode: "parallel",
      order: index + 1
    }));
    edges.push(edge(`edge_${slug(target.label)}_wait`, provisionId, waitId));
    edges.push(edge(`edge_${slug(target.label)}_bootstrap`, waitId, "node_bootstrap"));
  });
  nodes.push(node("node_bootstrap", "customNode", LAYOUT.centerX, layer(4), {
    label: `Bootstrap ${stack.ha.title}`,
    customNodeId: "",
    scriptType: "shell",
    scriptContent: stack.ha.install,
    sudo: true,
    method: "GET",
    path: "",
    body: "{}"
  }));
  nodes.push(node("node_health", "configCommandNode", LAYOUT.centerX, layer(5), {
    label: `${stack.ha.title} health check`,
    command: stack.ha.health,
    sudo: false
  }));
  nodes.push(node("node_end", "endNode", LAYOUT.centerX, layer(6), { label: "End" }));
  edges.push(edge("edge_bootstrap_health", "node_bootstrap", "node_health"));
  edges.push(edge("edge_health_end", "node_health", "node_end"));
  return { nodes, edges };
}

function createHaExistingWorkflow(stack) {
  const nodes = [
    node("node_trigger", "triggerNode", LAYOUT.centerX, layer(0), triggerData(`${stack.ha.title} existing`, stack.variables)),
    node("node_runner", "serverNode", LAYOUT.centerX, layer(1), {
      label: "Automation Runner",
      hostname: stack.ha.runnerHost,
      targets: [serverTarget("target-runner", "Automation Runner", stack.ha.runnerHost)]
    }),
    node("node_wait_runner", "waitUntilUpNode", LAYOUT.centerX, layer(2), waitData("Wait for automation runner")),
    node("node_bootstrap", "customNode", LAYOUT.centerX, layer(3), {
      label: `Bootstrap ${stack.ha.title}`,
      customNodeId: "",
      scriptType: "shell",
      scriptContent: stack.ha.install,
      sudo: true,
      method: "GET",
      path: "",
      body: "{}"
    }),
    node("node_health", "configCommandNode", LAYOUT.centerX, layer(4), {
      label: `${stack.ha.title} health check`,
      command: stack.ha.health,
      sudo: false
    }),
    node("node_end", "endNode", LAYOUT.centerX, layer(5), { label: "End" })
  ];
  const edges = [
    edge("edge_trigger_runner", "node_trigger", "node_runner"),
    edge("edge_runner_wait", "node_runner", "node_wait_runner"),
    edge("edge_wait_bootstrap", "node_wait_runner", "node_bootstrap"),
    edge("edge_bootstrap_health", "node_bootstrap", "node_health"),
    edge("edge_health_end", "node_health", "node_end")
  ];
  return { nodes, edges };
}

function hasNumericPosition(node) {
  return Number.isFinite(node?.position?.x) && Number.isFinite(node?.position?.y);
}

function validateNodeLayout(nodes, fileName) {
  const errors = [];
  const positioned = nodes.filter(hasNumericPosition);
  for (let i = 0; i < positioned.length; i += 1) {
    for (let j = i + 1; j < positioned.length; j += 1) {
      const a = positioned[i];
      const b = positioned[j];
      const dx = Math.abs(a.position.x - b.position.x);
      const dy = Math.abs(a.position.y - b.position.y);
      if (dx < LAYOUT.nodeWidthBudget && dy < LAYOUT.nodeHeightBudget) {
        errors.push(`${fileName}: nodes ${a.id} and ${b.id} are too close at (${a.position.x}, ${a.position.y}) and (${b.position.x}, ${b.position.y})`);
      }
    }
  }
  return errors;
}

function pgSingleInstall() {
  return text(`
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
sudo sed -i "s/^#listen_addresses.*/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf
sudo tee -a /etc/postgresql/*/main/pg_hba.conf >/dev/null <<'EOF'
host all all 10.0.0.0/8 scram-sha-256
EOF
sudo systemctl enable --now postgresql
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='app_user'" | grep -q 1 || sudo -u postgres psql -c "CREATE ROLE app_user LOGIN PASSWORD 'change-me';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='app_db'" | grep -q 1 || sudo -u postgres createdb app_db -O app_user
`);
}

function pgHaInstall(nodes) {
  return text(`
set -euo pipefail
sudo apt-get update
sudo apt-get install -y ansible sshpass
cat >/tmp/postgresql-ha.ini <<'INVENTORY'
[etcd]
${nodes.filter((n) => n.role === "etcd").map((n) => `${n.ip} node_name=${n.label}`).join("\n")}

[postgres]
${nodes.filter((n) => n.role === "postgres").map((n) => `${n.ip} node_name=${n.label}`).join("\n")}

[load_balancer]
${nodes.filter((n) => n.role === "load_balancer").map((n) => `${n.ip} node_name=${n.label}`).join("\n")}
INVENTORY
cat >/tmp/postgresql-ha.yml <<'PLAYBOOK'
- hosts: all
  become: true
  tasks:
    - ansible.builtin.apt:
        name: [curl, jq, chrony]
        state: present
        update_cache: true
    - ansible.builtin.service:
        name: chrony
        state: started
        enabled: true

- hosts: etcd
  become: true
  tasks:
    - ansible.builtin.apt:
        name: etcd
        state: present
    - ansible.builtin.copy:
        dest: /etc/default/etcd
        mode: "0644"
        content: |
          ETCD_NAME="{{ inventory_hostname }}"
          ETCD_LISTEN_CLIENT_URLS="http://0.0.0.0:2379"
          ETCD_ADVERTISE_CLIENT_URLS="http://{{ inventory_hostname }}:2379"
    - ansible.builtin.service:
        name: etcd
        state: restarted
        enabled: true

- hosts: postgres
  become: true
  tasks:
    - ansible.builtin.apt:
        name: [postgresql, postgresql-contrib, python3-pip, patroni]
        state: present
    - ansible.builtin.copy:
        dest: /etc/patroni.yml
        mode: "0640"
        content: |
          scope: octastack-postgres
          namespace: /service/
          name: "{{ inventory_hostname }}"
          restapi:
            listen: 0.0.0.0:8008
            connect_address: "{{ inventory_hostname }}:8008"
          etcd3:
            hosts: ${nodes.filter((n) => n.role === "etcd").map((n) => `${n.ip}:2379`).join(",")}
          bootstrap:
            dcs:
              ttl: 30
              loop_wait: 10
              retry_timeout: 10
              maximum_lag_on_failover: 1048576
              postgresql:
                use_pg_rewind: true
            initdb:
              - encoding: UTF8
              - data-checksums
          postgresql:
            listen: 0.0.0.0:5432
            connect_address: "{{ inventory_hostname }}:5432"
            data_dir: /var/lib/postgresql/patroni
            authentication:
              superuser:
                username: postgres
                password: change-me
              replication:
                username: replicator
                password: change-me
    - ansible.builtin.service:
        name: patroni
        state: restarted
        enabled: true

- hosts: load_balancer
  become: true
  tasks:
    - ansible.builtin.apt:
        name: [haproxy, keepalived]
        state: present
    - ansible.builtin.copy:
        dest: /etc/haproxy/haproxy.cfg
        mode: "0644"
        content: |
          global
            daemon
            maxconn 4096
          defaults
            mode tcp
            timeout connect 5s
            timeout client 30s
            timeout server 30s
          listen postgres_rw
            bind *:5432
            option httpchk GET /primary
${nodes.filter((n) => n.role === "postgres").map((n) => `            server ${n.label} ${n.ip}:5432 check port 8008`).join("\n")}
    - ansible.builtin.service:
        name: haproxy
        state: restarted
        enabled: true
PLAYBOOK
ansible-playbook -i /tmp/postgresql-ha.ini /tmp/postgresql-ha.yml
`);
}

function redisSingleInstall() {
  return text(`
set -euo pipefail
sudo apt-get update
sudo apt-get install -y redis-server
sudo sed -i "s/^bind .*/bind 0.0.0.0 ::1/" /etc/redis/redis.conf
sudo sed -i "s/^supervised .*/supervised systemd/" /etc/redis/redis.conf
sudo systemctl enable --now redis-server
`);
}

function redisHaInstall(nodes) {
  const redisHosts = nodes.filter((n) => n.role === "redis");
  return text(`
set -euo pipefail
sudo apt-get update
sudo apt-get install -y ansible sshpass
cat >/tmp/redis-sentinel.ini <<'INVENTORY'
[redis]
${redisHosts.map((n) => `${n.ip} node_name=${n.label}`).join("\n")}
INVENTORY
cat >/tmp/redis-sentinel.yml <<'PLAYBOOK'
- hosts: redis
  become: true
  tasks:
    - ansible.builtin.apt:
        name: redis-server
        state: present
        update_cache: true
    - ansible.builtin.copy:
        dest: /etc/redis/redis.conf
        mode: "0644"
        content: |
          bind 0.0.0.0
          protected-mode no
          port 6379
          appendonly yes
          dir /var/lib/redis
    - ansible.builtin.lineinfile:
        path: /etc/redis/redis.conf
        line: "replicaof ${redisHosts[0].ip} 6379"
      when: inventory_hostname != "${redisHosts[0].ip}"
    - ansible.builtin.copy:
        dest: /etc/redis/sentinel.conf
        mode: "0644"
        content: |
          port 26379
          sentinel monitor redis-ha ${redisHosts[0].ip} 6379 2
          sentinel down-after-milliseconds redis-ha 5000
          sentinel failover-timeout redis-ha 60000
          sentinel parallel-syncs redis-ha 1
    - ansible.builtin.service:
        name: redis-server
        state: restarted
        enabled: true
    - ansible.builtin.shell: redis-server /etc/redis/sentinel.conf --sentinel
      async: 45
      poll: 0
PLAYBOOK
ansible-playbook -i /tmp/redis-sentinel.ini /tmp/redis-sentinel.yml
`);
}

function kafkaSingleInstall() {
  return text(`
set -euo pipefail
sudo apt-get update
sudo apt-get install -y openjdk-17-jre-headless curl tar
sudo useradd -r -m -U -d /opt/kafka kafka || true
curl -fsSL https://archive.apache.org/dist/kafka/3.7.0/kafka_2.13-3.7.0.tgz -o /tmp/kafka.tgz
sudo tar -xzf /tmp/kafka.tgz --strip-components=1 -C /opt/kafka
sudo chown -R kafka:kafka /opt/kafka
KAFKA_CLUSTER_ID="$(sudo -u kafka /opt/kafka/bin/kafka-storage.sh random-uuid)"
sudo -u kafka /opt/kafka/bin/kafka-storage.sh format -t "$KAFKA_CLUSTER_ID" -c /opt/kafka/config/kraft/server.properties --ignore-formatted
sudo tee /etc/systemd/system/kafka.service >/dev/null <<'EOF'
[Unit]
Description=Apache Kafka KRaft
After=network-online.target
[Service]
User=kafka
ExecStart=/opt/kafka/bin/kafka-server-start.sh /opt/kafka/config/kraft/server.properties
Restart=always
[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable --now kafka
`);
}

function kafkaHaInstall(nodes) {
  const brokers = nodes.filter((n) => n.role === "broker");
  return text(`
set -euo pipefail
sudo apt-get update
sudo apt-get install -y ansible sshpass
cat >/tmp/kafka-kraft.ini <<'INVENTORY'
[brokers]
${brokers.map((n, i) => `${n.ip} node_id=${i + 1} node_name=${n.label}`).join("\n")}
INVENTORY
cat >/tmp/kafka-kraft.yml <<'PLAYBOOK'
- hosts: brokers
  become: true
  vars:
    kafka_version: "3.7.0"
    cluster_id: "MkU3OEVBNTcwNTJENDM2Qk"
    controllers: "${brokers.map((n, i) => `${i + 1}@${n.ip}:9093`).join(",")}"
  tasks:
    - ansible.builtin.apt:
        name: [openjdk-17-jre-headless, curl, tar]
        state: present
        update_cache: true
    - ansible.builtin.user:
        name: kafka
        system: true
        create_home: true
        home: /opt/kafka
    - ansible.builtin.shell: |
        curl -fsSL https://archive.apache.org/dist/kafka/{{ kafka_version }}/kafka_2.13-{{ kafka_version }}.tgz -o /tmp/kafka.tgz
        tar -xzf /tmp/kafka.tgz --strip-components=1 -C /opt/kafka
        chown -R kafka:kafka /opt/kafka
    - ansible.builtin.copy:
        dest: /opt/kafka/config/kraft/server.properties
        owner: kafka
        group: kafka
        mode: "0644"
        content: |
          process.roles=broker,controller
          node.id={{ node_id }}
          controller.quorum.voters={{ controllers }}
          listeners=PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
          advertised.listeners=PLAINTEXT://{{ inventory_hostname }}:9092
          controller.listener.names=CONTROLLER
          listener.security.protocol.map=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
          log.dirs=/var/lib/kafka
          offsets.topic.replication.factor=3
          transaction.state.log.replication.factor=3
          transaction.state.log.min.isr=2
          min.insync.replicas=2
    - ansible.builtin.shell: /opt/kafka/bin/kafka-storage.sh format -t {{ cluster_id }} -c /opt/kafka/config/kraft/server.properties --ignore-formatted
      become_user: kafka
    - ansible.builtin.copy:
        dest: /etc/systemd/system/kafka.service
        mode: "0644"
        content: |
          [Unit]
          Description=Apache Kafka KRaft
          After=network-online.target
          [Service]
          User=kafka
          ExecStart=/opt/kafka/bin/kafka-server-start.sh /opt/kafka/config/kraft/server.properties
          Restart=always
          [Install]
          WantedBy=multi-user.target
    - ansible.builtin.systemd:
        name: kafka
        state: restarted
        enabled: true
        daemon_reload: true
PLAYBOOK
ansible-playbook -i /tmp/kafka-kraft.ini /tmp/kafka-kraft.yml
`);
}

function rabbitSingleInstall() {
  return text(`
set -euo pipefail
sudo apt-get update
sudo apt-get install -y rabbitmq-server
sudo systemctl enable --now rabbitmq-server
sudo rabbitmq-plugins enable rabbitmq_management
sudo rabbitmqctl add_user app_user change-me || true
sudo rabbitmqctl set_permissions -p / app_user ".*" ".*" ".*"
`);
}

function rabbitHaInstall(nodes) {
  const members = nodes.filter((n) => n.role === "rabbitmq");
  return text(`
set -euo pipefail
sudo apt-get update
sudo apt-get install -y ansible sshpass
cat >/tmp/rabbitmq-ha.ini <<'INVENTORY'
[rabbitmq]
${members.map((n) => `${n.ip} node_name=${n.label}`).join("\n")}
INVENTORY
cat >/tmp/rabbitmq-ha.yml <<'PLAYBOOK'
- hosts: rabbitmq
  become: true
  tasks:
    - ansible.builtin.apt:
        name: rabbitmq-server
        state: present
        update_cache: true
    - ansible.builtin.copy:
        dest: /var/lib/rabbitmq/.erlang.cookie
        owner: rabbitmq
        group: rabbitmq
        mode: "0400"
        content: "OCTASTACKRABBITMQCOOKIE"
    - ansible.builtin.service:
        name: rabbitmq-server
        state: restarted
        enabled: true
    - ansible.builtin.shell: rabbitmq-plugins enable rabbitmq_management
    - ansible.builtin.shell: |
        rabbitmqctl stop_app
        rabbitmqctl reset
        rabbitmqctl join_cluster rabbit@${members[0].ip}
        rabbitmqctl start_app
      when: inventory_hostname != "${members[0].ip}"
    - ansible.builtin.shell: |
        rabbitmqctl set_policy ha-quorum "^ha\\." '{"queue-type":"quorum"}' --apply-to queues
        rabbitmqctl add_user app_user change-me || true
        rabbitmqctl set_permissions -p / app_user ".*" ".*" ".*"
      when: inventory_hostname == "${members[0].ip}"
PLAYBOOK
ansible-playbook -i /tmp/rabbitmq-ha.ini /tmp/rabbitmq-ha.yml
`);
}

function vanillaSingleInstall() {
  return text(`
set -euo pipefail
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl gpg
sudo swapoff -a
sudo modprobe br_netfilter
sudo sysctl -w net.bridge.bridge-nf-call-iptables=1
sudo apt-get install -y containerd
sudo systemctl enable --now containerd
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.30/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.30/deb/ /" | sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo kubeadm init --pod-network-cidr=192.168.0.0/16
mkdir -p "$HOME/.kube"
sudo cp /etc/kubernetes/admin.conf "$HOME/.kube/config"
sudo chown "$(id -u):$(id -g)" "$HOME/.kube/config"
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.27.3/manifests/calico.yaml
`);
}

function vanillaHaInstall(nodes) {
  const controlPlanes = nodes.filter((n) => n.role === "control_plane");
  const workers = nodes.filter((n) => n.role === "worker");
  return text(`
set -euo pipefail
sudo apt-get update
sudo apt-get install -y ansible sshpass
cat >/tmp/vanilla-k8s-ha.ini <<'INVENTORY'
[control_plane]
${controlPlanes.map((n) => `${n.ip} node_name=${n.label}`).join("\n")}

[worker]
${workers.map((n) => `${n.ip} node_name=${n.label}`).join("\n")}
INVENTORY
cat >/tmp/vanilla-k8s-ha.yml <<'PLAYBOOK'
- hosts: all
  become: true
  tasks:
    - ansible.builtin.shell: |
        swapoff -a
        modprobe br_netfilter
        sysctl -w net.bridge.bridge-nf-call-iptables=1
        apt-get update
        apt-get install -y containerd apt-transport-https ca-certificates curl gpg
        systemctl enable --now containerd
    - ansible.builtin.shell: |
        mkdir -p /etc/apt/keyrings
        curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.30/deb/Release.key | gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
        echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.30/deb/ /" > /etc/apt/sources.list.d/kubernetes.list
        apt-get update
        apt-get install -y kubelet kubeadm kubectl

- hosts: control_plane[0]
  become: true
  tasks:
    - ansible.builtin.shell: kubeadm init --control-plane-endpoint "10.30.50.10:6443" --upload-certs --pod-network-cidr=192.168.0.0/16
    - ansible.builtin.shell: kubectl --kubeconfig /etc/kubernetes/admin.conf apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.27.3/manifests/calico.yaml

- hosts: control_plane:!control_plane[0]
  become: true
  tasks:
    - ansible.builtin.debug:
        msg: "Join additional control plane nodes using the kubeadm join command printed by the first control plane."

- hosts: worker
  become: true
  tasks:
    - ansible.builtin.debug:
        msg: "Join worker nodes using the kubeadm join command printed by the first control plane."
PLAYBOOK
ansible-playbook -i /tmp/vanilla-k8s-ha.ini /tmp/vanilla-k8s-ha.yml
`);
}

function rke2SingleInstall() {
  return text(`
set -euo pipefail
curl -sfL https://get.rke2.io | sudo INSTALL_RKE2_TYPE=server sh -
sudo systemctl enable --now rke2-server
mkdir -p "$HOME/.kube"
sudo cp /etc/rancher/rke2/rke2.yaml "$HOME/.kube/config"
sudo chown "$(id -u):$(id -g)" "$HOME/.kube/config"
export KUBECONFIG="$HOME/.kube/config"
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
kubectl create namespace cattle-system --dry-run=client -o yaml | kubectl apply -f -
helm repo add jetstack https://charts.jetstack.io
helm repo add rancher-latest https://releases.rancher.com/server-charts/latest
helm repo update
helm upgrade --install cert-manager jetstack/cert-manager --namespace cert-manager --create-namespace --set crds.enabled=true
helm upgrade --install rancher rancher-latest/rancher --namespace cattle-system --set hostname=rancher.example.internal --set bootstrapPassword=change-me
`);
}

function rke2HaInstall(nodes) {
  const servers = nodes.filter((n) => n.role === "rke2_server");
  const agents = nodes.filter((n) => n.role === "rke2_agent");
  return text(`
set -euo pipefail
sudo apt-get update
sudo apt-get install -y ansible sshpass
cat >/tmp/rke2-rancher-ha.ini <<'INVENTORY'
[rke2_server]
${servers.map((n) => `${n.ip} node_name=${n.label}`).join("\n")}

[rke2_agent]
${agents.map((n) => `${n.ip} node_name=${n.label}`).join("\n")}
INVENTORY
cat >/tmp/rke2-rancher-ha.yml <<'PLAYBOOK'
- hosts: rke2_server[0]
  become: true
  tasks:
    - ansible.builtin.shell: |
        curl -sfL https://get.rke2.io | INSTALL_RKE2_TYPE=server sh -
        systemctl enable --now rke2-server

- hosts: rke2_server:!rke2_server[0]
  become: true
  tasks:
    - ansible.builtin.shell: |
        mkdir -p /etc/rancher/rke2
        echo "server: https://${servers[0].ip}:9345" > /etc/rancher/rke2/config.yaml
        echo "token: replace-with-rke2-token" >> /etc/rancher/rke2/config.yaml
        curl -sfL https://get.rke2.io | INSTALL_RKE2_TYPE=server sh -
        systemctl enable --now rke2-server

- hosts: rke2_agent
  become: true
  tasks:
    - ansible.builtin.shell: |
        mkdir -p /etc/rancher/rke2
        echo "server: https://${servers[0].ip}:9345" > /etc/rancher/rke2/config.yaml
        echo "token: replace-with-rke2-token" >> /etc/rancher/rke2/config.yaml
        curl -sfL https://get.rke2.io | INSTALL_RKE2_TYPE=agent sh -
        systemctl enable --now rke2-agent

- hosts: rke2_server[0]
  become: true
  tasks:
    - ansible.builtin.shell: |
        export KUBECONFIG=/etc/rancher/rke2/rke2.yaml
        curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
        kubectl create namespace cattle-system --dry-run=client -o yaml | kubectl apply -f -
        helm repo add jetstack https://charts.jetstack.io
        helm repo add rancher-latest https://releases.rancher.com/server-charts/latest
        helm repo update
        helm upgrade --install cert-manager jetstack/cert-manager --namespace cert-manager --create-namespace --set crds.enabled=true
        helm upgrade --install rancher rancher-latest/rancher --namespace cattle-system --set hostname=rancher.example.internal --set bootstrapPassword=change-me
PLAYBOOK
ansible-playbook -i /tmp/rke2-rancher-ha.ini /tmp/rke2-rancher-ha.yml
`);
}

function monitoringSingleInstall() {
  return text(`
set -euo pipefail
sudo apt-get update
sudo apt-get install -y prometheus prometheus-node-exporter grafana
sudo systemctl enable --now prometheus prometheus-node-exporter grafana-server
sudo tee /etc/prometheus/rules/octastack.rules.yml >/dev/null <<'EOF'
groups:
  - name: octastack-base
    rules:
      - alert: InstanceDown
        expr: up == 0
        for: 2m
        labels:
          severity: critical
EOF
sudo systemctl restart prometheus
`);
}

function monitoringHaInstall(nodes) {
  const prometheus = nodes.filter((n) => n.role === "prometheus");
  const alertmanagers = nodes.filter((n) => n.role === "alertmanager");
  const grafanas = nodes.filter((n) => n.role === "grafana");
  return text(`
set -euo pipefail
sudo apt-get update
sudo apt-get install -y ansible sshpass
cat >/tmp/monitoring-ha.ini <<'INVENTORY'
[prometheus]
${prometheus.map((n) => `${n.ip} node_name=${n.label}`).join("\n")}

[alertmanager]
${alertmanagers.map((n) => `${n.ip} node_name=${n.label}`).join("\n")}

[grafana]
${grafanas.map((n) => `${n.ip} node_name=${n.label}`).join("\n")}
INVENTORY
cat >/tmp/monitoring-ha.yml <<'PLAYBOOK'
- hosts: prometheus
  become: true
  tasks:
    - ansible.builtin.apt:
        name: [prometheus, prometheus-node-exporter]
        state: present
        update_cache: true
    - ansible.builtin.service:
        name: "{{ item }}"
        state: restarted
        enabled: true
      loop: [prometheus, prometheus-node-exporter]

- hosts: alertmanager
  become: true
  tasks:
    - ansible.builtin.apt:
        name: prometheus-alertmanager
        state: present
    - ansible.builtin.copy:
        dest: /etc/prometheus/alertmanager.yml
        mode: "0644"
        content: |
          global:
            resolve_timeout: 5m
          route:
            receiver: default
          receivers:
            - name: default
    - ansible.builtin.service:
        name: prometheus-alertmanager
        state: restarted
        enabled: true

- hosts: grafana
  become: true
  tasks:
    - ansible.builtin.apt:
        name: grafana
        state: present
    - ansible.builtin.service:
        name: grafana-server
        state: restarted
        enabled: true
PLAYBOOK
ansible-playbook -i /tmp/monitoring-ha.ini /tmp/monitoring-ha.yml
`);
}

const stacks = [
  {
    displayName: "PostgreSQL",
    category: "databases/postgresql",
    domain: "db.example.internal",
    gateway: "10.30.10.1",
    defaultCores: 4,
    defaultMemory: 8192,
    defaultDiskGb: "100",
    variables: [
      variable("var-0", "cluster_name", "payload.cluster_name", "pg-prod"),
      variable("var-1", "environment", "payload.environment", "production")
    ],
    single: {
      filePrefix: "single-node",
      target: { label: "postgres-single-01", role: "postgres", vmName: "pg-single-01", ip: "10.30.10.50", cores: 4, memory: 8192, diskGb: "100" },
      existingHost: "10.20.10.50",
      install: pgSingleInstall(),
      health: "pg_isready -h 127.0.0.1 -p 5432 && sudo -u postgres psql -c 'SELECT version();'"
    },
    ha: {
      title: "PostgreSQL Patroni etcd HA",
      filePrefix: "ha-patroni-etcd",
      runnerHost: "10.10.0.21",
      nodes: [
        { label: "etcd-01", role: "etcd", vmName: "pg-etcd-01", ip: "10.30.10.11", cores: 2, memory: 4096, diskGb: "40" },
        { label: "etcd-02", role: "etcd", vmName: "pg-etcd-02", ip: "10.30.10.12", cores: 2, memory: 4096, diskGb: "40" },
        { label: "etcd-03", role: "etcd", vmName: "pg-etcd-03", ip: "10.30.10.13", cores: 2, memory: 4096, diskGb: "40" },
        { label: "pg-01", role: "postgres", vmName: "pg-ha-01", ip: "10.30.10.21", cores: 4, memory: 8192, diskGb: "150" },
        { label: "pg-02", role: "postgres", vmName: "pg-ha-02", ip: "10.30.10.22", cores: 4, memory: 8192, diskGb: "150" },
        { label: "pg-03", role: "postgres", vmName: "pg-ha-03", ip: "10.30.10.23", cores: 4, memory: 8192, diskGb: "150" },
        { label: "pg-lb-01", role: "load_balancer", vmName: "pg-lb-01", ip: "10.30.10.31", cores: 2, memory: 2048, diskGb: "30" },
        { label: "pg-lb-02", role: "load_balancer", vmName: "pg-lb-02", ip: "10.30.10.32", cores: 2, memory: 2048, diskGb: "30" }
      ],
      get install() { return pgHaInstall(this.nodes); },
      health: "curl -fsS http://10.30.10.21:8008/health && curl -fsS http://10.30.10.31:5432 || true"
    }
  },
  {
    displayName: "Redis",
    category: "cache/redis",
    domain: "cache.example.internal",
    gateway: "10.30.20.1",
    defaultCores: 2,
    defaultMemory: 4096,
    defaultDiskGb: "40",
    variables: [
      variable("var-0", "cluster_name", "payload.cluster_name", "redis-prod"),
      variable("var-1", "environment", "payload.environment", "production")
    ],
    single: {
      filePrefix: "single-node",
      target: { label: "redis-single-01", role: "redis", vmName: "redis-single-01", ip: "10.30.20.50", cores: 2, memory: 4096, diskGb: "40" },
      existingHost: "10.20.20.50",
      install: redisSingleInstall(),
      health: "redis-cli -h 127.0.0.1 -p 6379 PING"
    },
    ha: {
      title: "Redis Sentinel HA",
      filePrefix: "sentinel-ha",
      runnerHost: "10.10.0.22",
      nodes: [
        { label: "redis-01", role: "redis", vmName: "redis-ha-01", ip: "10.30.20.11", cores: 2, memory: 4096, diskGb: "50" },
        { label: "redis-02", role: "redis", vmName: "redis-ha-02", ip: "10.30.20.12", cores: 2, memory: 4096, diskGb: "50" },
        { label: "redis-03", role: "redis", vmName: "redis-ha-03", ip: "10.30.20.13", cores: 2, memory: 4096, diskGb: "50" }
      ],
      get install() { return redisHaInstall(this.nodes); },
      health: "redis-cli -h 10.30.20.11 -p 26379 sentinel master redis-ha"
    }
  },
  {
    displayName: "Kafka",
    category: "messaging/kafka",
    domain: "msg.example.internal",
    gateway: "10.30.30.1",
    defaultCores: 4,
    defaultMemory: 8192,
    defaultDiskGb: "100",
    variables: [
      variable("var-0", "cluster_name", "payload.cluster_name", "kafka-prod"),
      variable("var-1", "environment", "payload.environment", "production")
    ],
    single: {
      filePrefix: "kraft-single-node",
      target: { label: "kafka-single-01", role: "broker", vmName: "kafka-single-01", ip: "10.30.30.50", cores: 4, memory: 8192, diskGb: "100" },
      existingHost: "10.20.30.50",
      install: kafkaSingleInstall(),
      health: "/opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server 127.0.0.1:9092"
    },
    ha: {
      title: "Kafka KRaft HA",
      filePrefix: "kraft-ha",
      runnerHost: "10.10.0.23",
      nodes: [
        { label: "kafka-01", role: "broker", vmName: "kafka-ha-01", ip: "10.30.30.11", cores: 4, memory: 8192, diskGb: "150" },
        { label: "kafka-02", role: "broker", vmName: "kafka-ha-02", ip: "10.30.30.12", cores: 4, memory: 8192, diskGb: "150" },
        { label: "kafka-03", role: "broker", vmName: "kafka-ha-03", ip: "10.30.30.13", cores: 4, memory: 8192, diskGb: "150" }
      ],
      get install() { return kafkaHaInstall(this.nodes); },
      health: "/opt/kafka/bin/kafka-metadata-quorum.sh --bootstrap-server 10.30.30.11:9092 describe --status"
    }
  },
  {
    displayName: "RabbitMQ",
    category: "messaging/rabbitmq",
    domain: "msg.example.internal",
    gateway: "10.30.40.1",
    defaultCores: 2,
    defaultMemory: 4096,
    defaultDiskGb: "60",
    variables: [
      variable("var-0", "cluster_name", "payload.cluster_name", "rabbitmq-prod"),
      variable("var-1", "environment", "payload.environment", "production")
    ],
    single: {
      filePrefix: "single-node",
      target: { label: "rabbitmq-single-01", role: "rabbitmq", vmName: "rabbitmq-single-01", ip: "10.30.40.50", cores: 2, memory: 4096, diskGb: "60" },
      existingHost: "10.20.40.50",
      install: rabbitSingleInstall(),
      health: "sudo rabbitmq-diagnostics ping && sudo rabbitmqctl status"
    },
    ha: {
      title: "RabbitMQ Quorum HA",
      filePrefix: "quorum-ha",
      runnerHost: "10.10.0.24",
      nodes: [
        { label: "rabbitmq-01", role: "rabbitmq", vmName: "rabbitmq-ha-01", ip: "10.30.40.11", cores: 2, memory: 4096, diskGb: "80" },
        { label: "rabbitmq-02", role: "rabbitmq", vmName: "rabbitmq-ha-02", ip: "10.30.40.12", cores: 2, memory: 4096, diskGb: "80" },
        { label: "rabbitmq-03", role: "rabbitmq", vmName: "rabbitmq-ha-03", ip: "10.30.40.13", cores: 2, memory: 4096, diskGb: "80" }
      ],
      get install() { return rabbitHaInstall(this.nodes); },
      health: "sudo rabbitmq-diagnostics cluster_status"
    }
  },
  {
    displayName: "Vanilla Kubernetes",
    category: "kubernetes/vanilla",
    domain: "k8s.example.internal",
    gateway: "10.30.50.1",
    defaultCores: 4,
    defaultMemory: 8192,
    defaultDiskGb: "80",
    variables: [
      variable("var-0", "cluster_name", "payload.cluster_name", "k8s-prod"),
      variable("var-1", "pod_cidr", "payload.pod_cidr", "192.168.0.0/16")
    ],
    single: {
      filePrefix: "single-control-plane",
      target: { label: "k8s-cp-single-01", role: "control_plane", vmName: "k8s-single-cp-01", ip: "10.30.50.50", cores: 4, memory: 8192, diskGb: "80" },
      existingHost: "10.20.50.50",
      install: vanillaSingleInstall(),
      health: "kubectl get nodes -o wide && kubectl get pods -A"
    },
    ha: {
      title: "Vanilla Kubernetes HA",
      filePrefix: "ha-control-plane",
      runnerHost: "10.10.0.25",
      nodes: [
        { label: "k8s-cp-01", role: "control_plane", vmName: "k8s-cp-01", ip: "10.30.50.11", cores: 4, memory: 8192, diskGb: "100" },
        { label: "k8s-cp-02", role: "control_plane", vmName: "k8s-cp-02", ip: "10.30.50.12", cores: 4, memory: 8192, diskGb: "100" },
        { label: "k8s-cp-03", role: "control_plane", vmName: "k8s-cp-03", ip: "10.30.50.13", cores: 4, memory: 8192, diskGb: "100" },
        { label: "k8s-worker-01", role: "worker", vmName: "k8s-worker-01", ip: "10.30.50.21", cores: 4, memory: 8192, diskGb: "120" },
        { label: "k8s-worker-02", role: "worker", vmName: "k8s-worker-02", ip: "10.30.50.22", cores: 4, memory: 8192, diskGb: "120" }
      ],
      get install() { return vanillaHaInstall(this.nodes); },
      health: "kubectl --kubeconfig /etc/kubernetes/admin.conf get nodes -o wide"
    }
  },
  {
    displayName: "Rancher RKE2",
    category: "kubernetes/rancher-rke2",
    domain: "rancher.example.internal",
    gateway: "10.30.60.1",
    defaultCores: 4,
    defaultMemory: 8192,
    defaultDiskGb: "100",
    variables: [
      variable("var-0", "cluster_name", "payload.cluster_name", "rke2-prod"),
      variable("var-1", "rancher_hostname", "payload.rancher_hostname", "rancher.example.internal")
    ],
    single: {
      filePrefix: "single-server",
      target: { label: "rke2-single-01", role: "rke2_server", vmName: "rke2-single-01", ip: "10.30.60.50", cores: 4, memory: 8192, diskGb: "100" },
      existingHost: "10.20.60.50",
      install: rke2SingleInstall(),
      health: "sudo /var/lib/rancher/rke2/bin/kubectl --kubeconfig /etc/rancher/rke2/rke2.yaml get nodes -o wide"
    },
    ha: {
      title: "Rancher RKE2 HA",
      filePrefix: "ha-server-agent",
      runnerHost: "10.10.0.26",
      nodes: [
        { label: "rke2-server-01", role: "rke2_server", vmName: "rke2-server-01", ip: "10.30.60.11", cores: 4, memory: 8192, diskGb: "120" },
        { label: "rke2-server-02", role: "rke2_server", vmName: "rke2-server-02", ip: "10.30.60.12", cores: 4, memory: 8192, diskGb: "120" },
        { label: "rke2-server-03", role: "rke2_server", vmName: "rke2-server-03", ip: "10.30.60.13", cores: 4, memory: 8192, diskGb: "120" },
        { label: "rke2-agent-01", role: "rke2_agent", vmName: "rke2-agent-01", ip: "10.30.60.21", cores: 4, memory: 8192, diskGb: "120" },
        { label: "rke2-agent-02", role: "rke2_agent", vmName: "rke2-agent-02", ip: "10.30.60.22", cores: 4, memory: 8192, diskGb: "120" }
      ],
      get install() { return rke2HaInstall(this.nodes); },
      health: "sudo /var/lib/rancher/rke2/bin/kubectl --kubeconfig /etc/rancher/rke2/rke2.yaml get nodes -o wide"
    }
  },
  {
    displayName: "Prometheus Grafana",
    category: "monitoring/prometheus-grafana",
    domain: "monitoring.example.internal",
    gateway: "10.30.70.1",
    defaultCores: 2,
    defaultMemory: 4096,
    defaultDiskGb: "80",
    variables: [
      variable("var-0", "cluster_name", "payload.cluster_name", "monitoring-prod"),
      variable("var-1", "retention", "payload.retention", "30d")
    ],
    single: {
      filePrefix: "single-node",
      target: { label: "monitoring-single-01", role: "monitoring", vmName: "monitoring-single-01", ip: "10.30.70.50", cores: 2, memory: 4096, diskGb: "80" },
      existingHost: "10.20.70.50",
      install: monitoringSingleInstall(),
      health: "curl -fsS http://127.0.0.1:9090/-/ready && curl -fsS http://127.0.0.1:3000/api/health"
    },
    ha: {
      title: "Prometheus Grafana HA",
      filePrefix: "ha-stack",
      runnerHost: "10.10.0.27",
      nodes: [
        { label: "prometheus-01", role: "prometheus", vmName: "prometheus-01", ip: "10.30.70.11", cores: 4, memory: 8192, diskGb: "200" },
        { label: "prometheus-02", role: "prometheus", vmName: "prometheus-02", ip: "10.30.70.12", cores: 4, memory: 8192, diskGb: "200" },
        { label: "alertmanager-01", role: "alertmanager", vmName: "alertmanager-01", ip: "10.30.70.21", cores: 2, memory: 2048, diskGb: "40" },
        { label: "alertmanager-02", role: "alertmanager", vmName: "alertmanager-02", ip: "10.30.70.22", cores: 2, memory: 2048, diskGb: "40" },
        { label: "alertmanager-03", role: "alertmanager", vmName: "alertmanager-03", ip: "10.30.70.23", cores: 2, memory: 2048, diskGb: "40" },
        { label: "grafana-01", role: "grafana", vmName: "grafana-01", ip: "10.30.70.31", cores: 2, memory: 4096, diskGb: "60" },
        { label: "grafana-02", role: "grafana", vmName: "grafana-02", ip: "10.30.70.32", cores: 2, memory: 4096, diskGb: "60" }
      ],
      get install() { return monitoringHaInstall(this.nodes); },
      health: "curl -fsS http://10.30.70.11:9090/-/ready && curl -fsS http://10.30.70.31:3000/api/health"
    }
  }
];

function validateWorkflow(workflow, fileName) {
  const errors = [];
  const nodeIds = new Set();
  const nodesById = new Map();
  for (const n of workflow.nodes ?? []) {
    if (!n.id || !n.type || !n.position || n.data === undefined) {
      errors.push(`${fileName}: node is missing id/type/position/data`);
    }
    if (n.position && !hasNumericPosition(n)) {
      errors.push(`${fileName}: node ${n.id} position must contain numeric x/y`);
    }
    if (nodeIds.has(n.id)) {
      errors.push(`${fileName}: duplicate node id ${n.id}`);
    }
    nodeIds.add(n.id);
    nodesById.set(n.id, n);
  }
  errors.push(...validateNodeLayout(workflow.nodes ?? [], fileName));
  if (![...nodesById.values()].some((n) => n.type === "triggerNode")) {
    errors.push(`${fileName}: missing triggerNode`);
  }
  const incoming = new Map([...nodeIds].map((id) => [id, []]));
  const outgoing = new Map([...nodeIds].map((id) => [id, []]));
  const edgeIds = new Set();
  for (const e of workflow.edges ?? []) {
    if (!e.id || !e.source || !e.target || !e.type || !e.mode) {
      errors.push(`${fileName}: edge is missing id/source/target/type/mode`);
    }
    if (edgeIds.has(e.id)) {
      errors.push(`${fileName}: duplicate edge id ${e.id}`);
    }
    edgeIds.add(e.id);
    if (!nodeIds.has(e.source)) {
      errors.push(`${fileName}: edge ${e.id} source does not exist`);
    }
    if (!nodeIds.has(e.target)) {
      errors.push(`${fileName}: edge ${e.id} target does not exist`);
    }
    if (!["sequential", "parallel"].includes(e.mode)) {
      errors.push(`${fileName}: edge ${e.id} has invalid mode ${e.mode}`);
    }
    incoming.get(e.target)?.push(e);
    outgoing.get(e.source)?.push(e);
  }
  for (const n of nodesById.values()) {
    if (n.type === "triggerNode" && incoming.get(n.id)?.length) {
      errors.push(`${fileName}: triggerNode ${n.id} has incoming edge`);
    }
    if (n.type === "endNode" && outgoing.get(n.id)?.length) {
      errors.push(`${fileName}: endNode ${n.id} has outgoing edge`);
    }
  }
  for (const [source, edges] of outgoing.entries()) {
    const sequential = edges.filter((e) => e.mode === "sequential");
    const orders = new Set();
    for (const e of sequential) {
      if (!Number.isInteger(e.order) || e.order <= 0) {
        errors.push(`${fileName}: sequential edge ${e.id} has invalid order`);
      }
      if (orders.has(e.order)) {
        errors.push(`${fileName}: source ${source} has duplicate sequential order ${e.order}`);
      }
      orders.add(e.order);
    }
  }
  function hasUpstream(startId, type) {
    const seen = new Set();
    const stack = [...(incoming.get(startId) ?? []).map((e) => e.source)];
    while (stack.length) {
      const current = stack.pop();
      if (seen.has(current)) continue;
      seen.add(current);
      if (nodesById.get(current)?.type === type) return true;
      stack.push(...(incoming.get(current) ?? []).map((e) => e.source));
    }
    return false;
  }
  for (const n of nodesById.values()) {
    if (n.type === "provisionNode" && !hasUpstream(n.id, "proxmoxConfigNode")) {
      errors.push(`${fileName}: provisionNode ${n.id} lacks upstream proxmoxConfigNode`);
    }
    if (n.type === "destroyNode" && !hasUpstream(n.id, "provisionNode")) {
      errors.push(`${fileName}: destroyNode ${n.id} lacks upstream provisionNode`);
    }
    if (n.type === "waitUntilUpNode" && !hasUpstream(n.id, "provisionNode") && !hasUpstream(n.id, "serverNode")) {
      errors.push(`${fileName}: waitUntilUpNode ${n.id} lacks upstream provisionNode/serverNode`);
    }
    if (["configureNode", "actionNode", "configCommandNode", "configFileNode", "configPackageNode", "configServiceNode"].includes(n.type)) {
      if (!hasUpstream(n.id, "provisionNode") && !hasUpstream(n.id, "serverNode")) {
        errors.push(`${fileName}: ${n.type} ${n.id} lacks upstream provisionNode/serverNode`);
      }
    }
  }
  return errors;
}

function writeWorkflowPackage(filePath, entry) {
  const errors = validateWorkflow(entry.workflow, path.relative(ROOT, filePath));
  if (errors.length) {
    throw new Error(errors.join("\n"));
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(workflowPackage(entry), null, 2) + "\n");
}

function workflowEntries() {
  const entries = [];
  for (const stack of stacks) {
    entries.push({
      stack,
      mode: "single-node",
      provisioning: "provisioned",
      fileName: `${stack.single.filePrefix}-provisioned.json`,
      workflow: createSingleProvisionedWorkflow(stack),
      name: `${stack.displayName} single-node provisioned`,
      description: `Provision a single ${stack.displayName} node on Proxmox, wait for reachability, then install and validate the stack.`
    });
    entries.push({
      stack,
      mode: "single-node",
      provisioning: "existing",
      fileName: `${stack.single.filePrefix}-existing.json`,
      workflow: createSingleExistingWorkflow(stack),
      name: `${stack.displayName} single-node existing`,
      description: `Install and validate ${stack.displayName} on an existing single host.`
    });
    entries.push({
      stack,
      mode: "high-availability",
      provisioning: "provisioned",
      fileName: `${stack.ha.filePrefix}-provisioned.json`,
      workflow: createHaProvisionedWorkflow(stack),
      name: `${stack.ha.title} provisioned`,
      description: `Provision ${stack.ha.title} nodes on Proxmox, wait for reachability, then bootstrap and validate the HA stack.`
    });
    entries.push({
      stack,
      mode: "high-availability",
      provisioning: "existing",
      fileName: `${stack.ha.filePrefix}-existing.json`,
      workflow: createHaExistingWorkflow(stack),
      name: `${stack.ha.title} existing`,
      description: `Bootstrap and validate ${stack.ha.title} from an existing automation runner and target inventory.`
    });
  }
  return entries;
}

function workflowPackage(entry) {
  return {
    kind: WORKFLOW_PACKAGE_KIND,
    version: WORKFLOW_PACKAGE_VERSION,
    exportedAt: EXPORTED_AT,
    workflow: {
      name: entry.name,
      description: entry.description,
      graphData: entry.workflow
    },
    dependencies: {
      templates: [],
      customNodes: []
    }
  };
}

function makeReadme(entries) {
  const lines = [];
  lines.push("# OctaStack Workflow Example Library");
  lines.push("");
  lines.push("This repository contains ready-to-adapt JSON workflow packages for OctaStack automation imports. The examples follow the package, canonical graph, and validation rules documented in `NODES.md`.");
  lines.push("");
  lines.push("The library is organized by operational domain, then by technology. Each technology includes both simple single-node examples and high-availability examples, and each pattern is available in provisioned and existing-infrastructure variants.");
  lines.push("");
  lines.push("## Provisioning modes");
  lines.push("");
  lines.push("- `*-provisioned.json`: starts with `proxmoxConfigNode`, provisions VMs through `provisionNode`, waits for reachability, then installs/configures the stack.");
  lines.push("- `*-existing.json`: skips VM creation and starts from a `serverNode`. Single-node examples target the application host directly. HA examples target an automation runner that executes an explicit inventory against pre-existing nodes.");
  lines.push("");
  lines.push("## Catalog");
  lines.push("");
  lines.push("| Domain | Stack | Pattern | Provisioning | File |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const entry of entries) {
    const rel = path.posix.join("workflows", entry.stack.category, entry.fileName);
    lines.push(`| ${entry.stack.category.split("/")[0]} | ${entry.stack.displayName} | ${entry.mode} | ${entry.provisioning} | [${rel}](${rel}) |`);
  }
  lines.push("");
  lines.push("## Directory guide");
  lines.push("");
  lines.push("- `workflows/databases/postgresql`: PostgreSQL standalone and Patroni plus etcd plus HAProxy examples.");
  lines.push("- `workflows/cache/redis`: Redis standalone and Redis Sentinel HA examples.");
  lines.push("- `workflows/messaging/kafka`: Kafka KRaft standalone and 3-node HA examples.");
  lines.push("- `workflows/messaging/rabbitmq`: RabbitMQ standalone and quorum-queue cluster examples.");
  lines.push("- `workflows/kubernetes/vanilla`: kubeadm-based Kubernetes single control plane and HA control plane examples.");
  lines.push("- `workflows/kubernetes/rancher-rke2`: RKE2 and Rancher single-server and HA server/agent examples.");
  lines.push("- `workflows/monitoring/prometheus-grafana`: Prometheus, Alertmanager, Grafana, and node-exporter examples.");
  lines.push("");
  lines.push("## Standard conventions");
  lines.push("");
  lines.push("- Every JSON file is an importable workflow package with `kind: \"octastack.workflow.package\"`, `version: 1`, and the graph nested under `workflow.graphData`.");
  lines.push("- Every workflow uses `triggerNode` as the only root entry point.");
  lines.push("- Nodes are generated with a layered layout: linear flows use wide vertical spacing, and HA fan-out branches are distributed horizontally so nodes do not overlap in the editor.");
  lines.push("- Provisioned examples use `profileId: \"replace-with-proxmox-profile-id\"`; replace it with the real Proxmox profile ID before importing.");
  lines.push("- Template VM IDs default to `9000`; adjust `templateId`, CPU, memory, storage, network bridge, VLAN, and static IP values per environment.");
  lines.push("- All example credentials and secrets use obvious placeholders such as `change-me` and `replace-with-rke2-token`.");
  lines.push("- HA examples prefer odd-number quorum sets where relevant: 3 etcd nodes, 3 Redis Sentinel members, 3 Kafka KRaft voters, 3 RabbitMQ members, and 3 Kubernetes/RKE2 server nodes.");
  lines.push("- Existing-infrastructure HA examples assume the automation runner already has SSH reachability to the target inventory and can run Ansible or shell orchestration.");
  lines.push("- The scripts are intentionally explicit and readable. Treat them as production starting points, then harden package repositories, certificates, secrets, users, backups, firewalls, and storage classes for your environment.");
  lines.push("");
  lines.push("## Validation");
  lines.push("");
  lines.push("Run this after editing generated workflow JSON:");
  lines.push("");
  lines.push("```bash");
  lines.push("node tools/validate-workflows.mjs");
  lines.push("```");
  lines.push("");
  lines.push("The validator checks JSON parseability, unique node and edge IDs, valid edge references, trigger/end rules, context requirements for provision/wait/config nodes, and sequential edge ordering.");
  lines.push("");
  lines.push("## Regeneration");
  lines.push("");
  lines.push("The example files are generated from `tools/generate-library.mjs` so stack-wide naming and graph conventions stay consistent:");
  lines.push("");
  lines.push("```bash");
  lines.push("node tools/generate-library.mjs");
  lines.push("node tools/validate-workflows.mjs");
  lines.push("```");
  lines.push("");
  return lines.join("\n");
}

fs.rmSync(WORKFLOW_ROOT, { recursive: true, force: true });
const entries = workflowEntries();
for (const entry of entries) {
  writeWorkflowPackage(path.join(WORKFLOW_ROOT, entry.stack.category, entry.fileName), entry);
}
fs.writeFileSync(path.join(ROOT, "README.md"), makeReadme(entries));
console.log(`Generated ${entries.length} workflow examples.`);
