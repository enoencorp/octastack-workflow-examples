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
  trigger: { x: 45, y: 75 },
  context: { x: 105, y: 465 },
  branchGapX: 705,
  branchStartX: 0,
  provisionBranchStartX: 855,
  commandInsetX: 180,
  singleProvisioned: {
    provision: { x: 855, y: 405 },
    wait: { x: 1545, y: 2985 },
    install: { x: 855, y: 4290 },
    health: { x: 1035, y: 5475 },
    end: { x: 1085, y: 5880 }
  },
  singleExisting: {
    server: { x: 0, y: 885 },
    wait: { x: 885, y: 885 },
    install: { x: 180, y: 2300 },
    health: { x: 180, y: 3600 },
    end: { x: 230, y: 4005 }
  },
  haProvisioned: {
    provisionY: 405,
    waitY: 3600,
    bootstrapY: 5000,
    healthY: 6200,
    endY: 6605
  },
  haExisting: {
    runner: { x: 0, y: 885 },
    wait: { x: 885, y: 885 },
    bootstrap: { x: 180, y: 2300 },
    health: { x: 180, y: 5000 },
    end: { x: 230, y: 5405 }
  },
  footprints: {
    triggerNode: { width: 520, height: 380 },
    proxmoxConfigNode: { width: 320, height: 260 },
    provisionNode: { width: 640, height: 3000 },
    waitUntilUpNode: { width: 420, height: 700 },
    serverNode: { width: 680, height: 1250 },
    customNode: { width: 640, height: 900 },
    configCommandNode: { width: 320, height: 300 },
    endNode: { width: 220, height: 200 },
    default: { width: 420, height: 320 }
  }
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

function commandData(label, command, sudo = true) {
  return {
    label,
    command: text(command),
    sudo
  };
}

function appendCommandSteps(nodes, edges, fromId, steps, options) {
  const gap = options.gap ?? 405;
  let previousId = fromId;
  let firstId = "";
  for (const [index, step] of steps.entries()) {
    const id = `${options.idPrefix}_${index + 1}`;
    const x = step.x ?? options.x;
    const y = step.y ?? options.y + index * gap;
    nodes.push(node(id, "configCommandNode", x, y, commandData(step.label, step.command, step.sudo ?? true)));
    if (!firstId) {
      firstId = id;
    }
    if (previousId) {
      edges.push(edge(`${options.edgePrefix}_${index + 1}`, previousId, id));
    }
    previousId = id;
  }
  return {
    firstId,
    lastId: previousId,
    nextY: options.y + steps.length * gap
  };
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

function branchX(index, startX = LAYOUT.branchStartX) {
  return startX + index * LAYOUT.branchGapX;
}

function branchCenterX(count, startX = LAYOUT.branchStartX) {
  return Math.round(startX + ((count - 1) * LAYOUT.branchGapX) / 2);
}

function createSingleProvisionedWorkflow(stack) {
  const target = stack.single.target;
  const nodes = [
    node("node_trigger", "triggerNode", LAYOUT.trigger.x, LAYOUT.trigger.y, triggerData(`${stack.displayName} single-node provisioned`, stack.variables)),
    node("node_context", "proxmoxConfigNode", LAYOUT.context.x, LAYOUT.context.y, {
      label: "Cluster Context",
      profileId: PROFILE_ID
    }),
    node("node_provision", "provisionNode", LAYOUT.singleProvisioned.provision.x, LAYOUT.singleProvisioned.provision.y, provisionData(target, stack)),
    node("node_wait", "waitUntilUpNode", LAYOUT.singleProvisioned.wait.x, LAYOUT.singleProvisioned.wait.y, waitData("Wait for provisioned host"))
  ];
  const edges = [
    edge("edge_trigger_context", "node_trigger", "node_context"),
    edge("edge_context_provision", "node_context", "node_provision"),
    edge("edge_provision_wait", "node_provision", "node_wait")
  ];
  let previousId = "node_wait";
  let healthY = LAYOUT.singleProvisioned.health.y;
  let endY = LAYOUT.singleProvisioned.end.y;

  if (stack.single.steps?.length) {
    const stepResult = appendCommandSteps(nodes, edges, "node_wait", stack.single.steps, {
      idPrefix: "node_step",
      edgePrefix: "edge_step",
      x: LAYOUT.singleProvisioned.install.x + LAYOUT.commandInsetX,
      y: LAYOUT.singleProvisioned.install.y
    });
    previousId = stepResult.lastId;
    healthY = Math.max(healthY, stepResult.nextY);
    endY = healthY + 405;
  } else {
    nodes.push(node("node_install", "customNode", LAYOUT.singleProvisioned.install.x, LAYOUT.singleProvisioned.install.y, {
      label: `Install ${stack.displayName}`,
      customNodeId: "",
      scriptType: "shell",
      scriptContent: stack.single.install,
      sudo: true,
      method: "GET",
      path: "",
      body: "{}"
    }));
    edges.push(edge("edge_wait_install", "node_wait", "node_install"));
    previousId = "node_install";
  }

  nodes.push(node("node_health", "configCommandNode", LAYOUT.singleProvisioned.health.x, healthY, {
    label: `${stack.displayName} health check`,
    command: stack.single.health,
    sudo: false
  }));
  nodes.push(node("node_end", "endNode", LAYOUT.singleProvisioned.end.x, endY, { label: "End" }));
  edges.push(edge("edge_install_health", previousId, "node_health"));
  edges.push(edge("edge_health_end", "node_health", "node_end"));
  return { nodes, edges };
}

function createSingleExistingWorkflow(stack) {
  const target = stack.single.target;
  const nodes = [
    node("node_trigger", "triggerNode", LAYOUT.trigger.x, LAYOUT.trigger.y, triggerData(`${stack.displayName} single-node existing`, stack.variables)),
    node("node_server", "serverNode", LAYOUT.singleExisting.server.x, LAYOUT.singleExisting.server.y, serverData(`${stack.displayName} Host`, stack.single.existingHost ?? target.ip)),
    node("node_wait", "waitUntilUpNode", LAYOUT.singleExisting.wait.x, LAYOUT.singleExisting.wait.y, waitData("Wait for existing host"))
  ];
  const edges = [
    edge("edge_trigger_server", "node_trigger", "node_server"),
    edge("edge_server_wait", "node_server", "node_wait")
  ];
  let previousId = "node_wait";
  let healthY = LAYOUT.singleExisting.health.y;
  let endY = LAYOUT.singleExisting.end.y;

  if (stack.single.steps?.length) {
    const stepResult = appendCommandSteps(nodes, edges, "node_wait", stack.single.steps, {
      idPrefix: "node_step",
      edgePrefix: "edge_step",
      x: LAYOUT.singleExisting.install.x,
      y: LAYOUT.singleExisting.install.y
    });
    previousId = stepResult.lastId;
    healthY = Math.max(healthY, stepResult.nextY);
    endY = healthY + 405;
  } else {
    nodes.push(node("node_install", "customNode", LAYOUT.singleExisting.install.x, LAYOUT.singleExisting.install.y, {
      label: `Install ${stack.displayName}`,
      customNodeId: "",
      scriptType: "shell",
      scriptContent: stack.single.install,
      sudo: true,
      method: "GET",
      path: "",
      body: "{}"
    }));
    edges.push(edge("edge_wait_install", "node_wait", "node_install"));
    previousId = "node_install";
  }

  nodes.push(node("node_health", "configCommandNode", LAYOUT.singleExisting.health.x, healthY, {
    label: `${stack.displayName} health check`,
    command: stack.single.health,
    sudo: false
  }));
  nodes.push(node("node_end", "endNode", LAYOUT.singleExisting.end.x, endY, { label: "End" }));
  edges.push(edge("edge_install_health", previousId, "node_health"));
  edges.push(edge("edge_health_end", "node_health", "node_end"));
  return { nodes, edges };
}

function createHaProvisionedWorkflow(stack) {
  const nodes = [
    node("node_trigger", "triggerNode", LAYOUT.trigger.x, LAYOUT.trigger.y, triggerData(`${stack.ha.title} provisioned`, stack.variables)),
    node("node_context", "proxmoxConfigNode", LAYOUT.context.x, LAYOUT.context.y, {
      label: "Cluster Context",
      profileId: PROFILE_ID
    })
  ];
  const edges = [edge("edge_trigger_context", "node_trigger", "node_context")];
  stack.ha.nodes.forEach((target, index) => {
    const x = branchX(index, LAYOUT.provisionBranchStartX);
    const provisionId = `node_provision_${slug(target.label)}`;
    const waitId = `node_wait_${slug(target.label)}`;
    nodes.push(node(provisionId, "provisionNode", x, LAYOUT.haProvisioned.provisionY, provisionData(target, stack)));
    nodes.push(node(waitId, "waitUntilUpNode", x, LAYOUT.haProvisioned.waitY, waitData(`Wait ${target.label}`)));
    edges.push(edge(`edge_context_${slug(target.label)}`, "node_context", provisionId, {
      mode: "parallel",
      order: index + 1
    }));
    edges.push(edge(`edge_${slug(target.label)}_wait`, provisionId, waitId));
  });
  const centerX = branchCenterX(stack.ha.nodes.length, LAYOUT.provisionBranchStartX);
  let previousId = "node_bootstrap";
  let firstBootstrapId = "node_bootstrap";
  let healthY = LAYOUT.haProvisioned.healthY;
  let endY = LAYOUT.haProvisioned.endY;

  if (stack.ha.steps?.length) {
    const stepResult = appendCommandSteps(nodes, edges, "", stack.ha.steps, {
      idPrefix: "node_step",
      edgePrefix: "edge_step",
      x: centerX + LAYOUT.commandInsetX,
      y: LAYOUT.haProvisioned.bootstrapY
    });
    firstBootstrapId = stepResult.firstId;
    previousId = stepResult.lastId;
    healthY = Math.max(healthY, stepResult.nextY);
    endY = healthY + 405;
  } else {
    nodes.push(node("node_bootstrap", "customNode", centerX, LAYOUT.haProvisioned.bootstrapY, {
      label: `Bootstrap ${stack.ha.title}`,
      customNodeId: "",
      scriptType: "shell",
      scriptContent: stack.ha.install,
      sudo: true,
      method: "GET",
      path: "",
      body: "{}"
    }));
  }

  for (const target of stack.ha.nodes) {
    edges.push(edge(`edge_${slug(target.label)}_bootstrap`, `node_wait_${slug(target.label)}`, firstBootstrapId));
  }
  nodes.push(node("node_health", "configCommandNode", centerX + LAYOUT.commandInsetX, healthY, {
    label: `${stack.ha.title} health check`,
    command: stack.ha.health,
    sudo: false
  }));
  nodes.push(node("node_end", "endNode", centerX + LAYOUT.commandInsetX + 50, endY, { label: "End" }));
  edges.push(edge("edge_bootstrap_health", previousId, "node_health"));
  edges.push(edge("edge_health_end", "node_health", "node_end"));
  return { nodes, edges };
}

function createHaExistingWorkflow(stack) {
  const nodes = [
    node("node_trigger", "triggerNode", LAYOUT.trigger.x, LAYOUT.trigger.y, triggerData(`${stack.ha.title} existing`, stack.variables)),
    node("node_runner", "serverNode", LAYOUT.haExisting.runner.x, LAYOUT.haExisting.runner.y, {
      label: "Automation Runner",
      hostname: stack.ha.runnerHost,
      targets: [serverTarget("target-runner", "Automation Runner", stack.ha.runnerHost)]
    }),
    node("node_wait_runner", "waitUntilUpNode", LAYOUT.haExisting.wait.x, LAYOUT.haExisting.wait.y, waitData("Wait for automation runner"))
  ];
  const edges = [
    edge("edge_trigger_runner", "node_trigger", "node_runner"),
    edge("edge_runner_wait", "node_runner", "node_wait_runner")
  ];
  let previousId = "node_wait_runner";
  let healthY = LAYOUT.haExisting.health.y;
  let endY = LAYOUT.haExisting.end.y;

  if (stack.ha.steps?.length) {
    const stepResult = appendCommandSteps(nodes, edges, "node_wait_runner", stack.ha.steps, {
      idPrefix: "node_step",
      edgePrefix: "edge_step",
      x: LAYOUT.haExisting.bootstrap.x,
      y: LAYOUT.haExisting.bootstrap.y
    });
    previousId = stepResult.lastId;
    healthY = Math.max(healthY, stepResult.nextY);
    endY = healthY + 405;
  } else {
    nodes.push(node("node_bootstrap", "customNode", LAYOUT.haExisting.bootstrap.x, LAYOUT.haExisting.bootstrap.y, {
      label: `Bootstrap ${stack.ha.title}`,
      customNodeId: "",
      scriptType: "shell",
      scriptContent: stack.ha.install,
      sudo: true,
      method: "GET",
      path: "",
      body: "{}"
    }));
    edges.push(edge("edge_wait_bootstrap", "node_wait_runner", "node_bootstrap"));
    previousId = "node_bootstrap";
  }

  nodes.push(node("node_health", "configCommandNode", LAYOUT.haExisting.health.x, healthY, {
    label: `${stack.ha.title} health check`,
    command: stack.ha.health,
    sudo: false
  }));
  nodes.push(node("node_end", "endNode", LAYOUT.haExisting.end.x, endY, { label: "End" }));
  edges.push(edge("edge_bootstrap_health", previousId, "node_health"));
  edges.push(edge("edge_health_end", "node_health", "node_end"));
  return { nodes, edges };
}

function hasNumericPosition(node) {
  return Number.isFinite(node?.position?.x) && Number.isFinite(node?.position?.y);
}

function nodeFootprint(node) {
  return LAYOUT.footprints[node.type] ?? LAYOUT.footprints.default;
}

function nodeRect(node) {
  const footprint = nodeFootprint(node);
  return {
    left: node.position.x,
    top: node.position.y,
    right: node.position.x + footprint.width,
    bottom: node.position.y + footprint.height
  };
}

function rectanglesOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function validateNodeLayout(nodes, fileName) {
  const errors = [];
  const positioned = nodes.filter(hasNumericPosition);
  for (let i = 0; i < positioned.length; i += 1) {
    for (let j = i + 1; j < positioned.length; j += 1) {
      const a = positioned[i];
      const b = positioned[j];
      if (rectanglesOverlap(nodeRect(a), nodeRect(b))) {
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

function shellQuote(value) {
  return String(value).replaceAll("'", "'\"'\"'");
}

function legacyScriptSteps(displayName, script) {
  const serviceSlug = slug(displayName);
  const scriptPath = `/opt/octastack/${serviceSlug}/install.sh`;
  return [
    {
      label: `Render ${displayName} installer`,
      command: `
set -euo pipefail
install -d -m 0750 /opt/octastack/${serviceSlug}
cat >${scriptPath} <<'OCTASTACK_INSTALLER'
${text(script)}
OCTASTACK_INSTALLER
chmod 0750 ${scriptPath}
`
    },
    {
      label: `Review ${displayName} installer`,
      command: `
set -euo pipefail
bash -n ${scriptPath}
wc -l ${scriptPath}
sed -n '1,120p' ${scriptPath}
`
    },
    {
      label: `Execute ${displayName} installer`,
      command: `
set -euo pipefail
${scriptPath}
`
    },
    {
      label: `Collect ${displayName} runtime status`,
      command: `
set -euo pipefail
systemctl --failed --no-pager || true
if command -v docker >/dev/null 2>&1; then docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}' || true; fi
if command -v kubectl >/dev/null 2>&1; then kubectl get nodes -o wide || true; kubectl get pods -A || true; fi
`
    }
  ];
}

function composePorts(ports = []) {
  return ports.map((port) => `      - "${port}"`).join("\n");
}

function composeEnvironment(env = {}) {
  const entries = Object.entries(env);
  if (!entries.length) {
    return "";
  }
  return [
    "    environment:",
    ...entries.map(([key, value]) => `      ${key}: "${String(value).replaceAll('"', '\\"')}"`)
  ].join("\n");
}

function composeVolumes(volumes = ["data:/data"]) {
  return volumes.map((volume) => `      - ${volume}`).join("\n");
}

function composeCommand(command) {
  if (!command) {
    return "";
  }
  return `    command: ${JSON.stringify(command)}`;
}

function composeManifest(def) {
  const parts = [
    "services:",
    `  ${def.serviceName}:`,
    `    image: ${def.image}`,
    `    container_name: octastack-${def.serviceName}`,
    "    restart: unless-stopped"
  ];
  if (def.command) {
    parts.push(composeCommand(def.command));
  }
  const env = composeEnvironment(def.env);
  if (env) {
    parts.push(env);
  }
  if (def.ports?.length) {
    parts.push("    ports:");
    parts.push(composePorts(def.ports));
  }
  if (def.volumes?.length) {
    parts.push("    volumes:");
    parts.push(composeVolumes(def.volumes));
  }
  parts.push("volumes:");
  parts.push("  data: {}");
  return parts.join("\n");
}

function containerRuntimeInstallCommand() {
  return `
set -euo pipefail
if command -v docker >/dev/null 2>&1; then
  docker --version
  exit 0
fi
if command -v apt-get >/dev/null 2>&1; then
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io docker-compose-plugin
elif command -v dnf >/dev/null 2>&1; then
  dnf install -y docker docker-compose-plugin
elif command -v yum >/dev/null 2>&1; then
  yum install -y docker docker-compose-plugin
else
  echo "Unsupported package manager. Install Docker manually." >&2
  exit 1
fi
systemctl enable --now docker
docker version
`;
}

function containerSingleSteps(def) {
  const serviceSlug = slug(def.displayName);
  const manifest = composeManifest(def);
  const envText = Object.entries(def.env ?? {}).map(([key, value]) => `${key}=${value}`).join("\n") || `OCTASTACK_SERVICE=${def.displayName}`;
  const steps = [
    {
      label: `Prepare ${def.displayName} runtime`,
      command: containerRuntimeInstallCommand()
    },
    {
      label: `Create ${def.displayName} directories`,
      command: `
set -euo pipefail
install -d -m 0750 /opt/octastack/${serviceSlug}
install -d -m 0750 /var/lib/octastack/${serviceSlug}
cat >/opt/octastack/${serviceSlug}/.env <<'EOF'
${envText}
EOF
chmod 0600 /opt/octastack/${serviceSlug}/.env
`
    },
    {
      label: `Render ${def.displayName} compose`,
      command: `
set -euo pipefail
cat >/opt/octastack/${serviceSlug}/compose.yml <<'COMPOSE'
${manifest}
COMPOSE
`
    },
    {
      label: `Deploy ${def.displayName}`,
      command: `
set -euo pipefail
docker compose -f /opt/octastack/${serviceSlug}/compose.yml pull
docker compose -f /opt/octastack/${serviceSlug}/compose.yml up -d
docker compose -f /opt/octastack/${serviceSlug}/compose.yml ps
`
    },
    {
      label: `Inspect ${def.displayName}`,
      command: `
set -euo pipefail
docker ps --filter name=octastack-${def.serviceName}
docker logs octastack-${def.serviceName} --tail=80 || true
`
    }
  ];
  if (def.initCommand) {
    steps.splice(4, 0, {
      label: `Initialize ${def.displayName}`,
      command: def.initCommand
    });
  }
  return steps;
}

function containerHaSteps(def, nodes) {
  const serviceSlug = slug(def.displayName);
  const manifest = composeManifest(def);
  return [
    {
      label: `Prepare ${def.displayName} inventory`,
      command: `
set -euo pipefail
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y ansible sshpass
cat >/tmp/${serviceSlug}-inventory.ini <<'INVENTORY'
[${serviceSlug}]
${inventory(nodes)}
INVENTORY
`
    },
    {
      label: `Install ${def.displayName} container runtime`,
      command: `
set -euo pipefail
cat >/tmp/${serviceSlug}-runtime.yml <<'PLAYBOOK'
- hosts: ${serviceSlug}
  become: true
  tasks:
    - ansible.builtin.shell: |
        if command -v docker >/dev/null 2>&1; then
          docker --version
          exit 0
        fi
        if command -v apt-get >/dev/null 2>&1; then
          apt-get update
          DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io docker-compose-plugin
        elif command -v dnf >/dev/null 2>&1; then
          dnf install -y docker docker-compose-plugin
        elif command -v yum >/dev/null 2>&1; then
          yum install -y docker docker-compose-plugin
        fi
        systemctl enable --now docker
PLAYBOOK
ansible-playbook -i /tmp/${serviceSlug}-inventory.ini /tmp/${serviceSlug}-runtime.yml
`
    },
    {
      label: `Render ${def.displayName} cluster manifests`,
      command: `
set -euo pipefail
cat >/tmp/${serviceSlug}-deploy.yml <<'PLAYBOOK'
- hosts: ${serviceSlug}
  become: true
  tasks:
    - ansible.builtin.file:
        path: /opt/octastack/${serviceSlug}
        state: directory
        mode: "0750"
    - ansible.builtin.copy:
        dest: /opt/octastack/${serviceSlug}/compose.yml
        mode: "0640"
        content: |
${manifest.split("\n").map((line) => `          ${line}`).join("\n")}
PLAYBOOK
`
    },
    {
      label: `Deploy ${def.displayName} cluster`,
      command: `
set -euo pipefail
cat >>/tmp/${serviceSlug}-deploy.yml <<'PLAYBOOK'
    - ansible.builtin.shell: docker compose -f /opt/octastack/${serviceSlug}/compose.yml pull
    - ansible.builtin.shell: docker compose -f /opt/octastack/${serviceSlug}/compose.yml up -d
    - ansible.builtin.shell: docker compose -f /opt/octastack/${serviceSlug}/compose.yml ps
PLAYBOOK
ansible-playbook -i /tmp/${serviceSlug}-inventory.ini /tmp/${serviceSlug}-deploy.yml
`
    },
    {
      label: `Document ${def.displayName} topology`,
      command: `
set -euo pipefail
cat >/tmp/${serviceSlug}-topology.md <<'EOF'
# ${def.displayName} HA topology

Members:
${nodes.map((n) => `- ${n.label}: ${n.ip} (${n.role})`).join("\n")}

This example deploys one ${def.displayName} container per member host. Replace the placeholder commands with vendor-supported clustering, TLS, backup, and failover automation before production use.
EOF
cat /tmp/${serviceSlug}-topology.md
`
    },
    {
      label: `Validate ${def.displayName} cluster`,
      command: def.haValidateCommand ?? `
set -euo pipefail
ansible -i /tmp/${serviceSlug}-inventory.ini ${serviceSlug} -b -m shell -a 'docker ps --format "{{.Names}} {{.Status}}"'
`
    }
  ];
}

function catalogTarget(def, index) {
  const tech = slug(def.displayName).replaceAll("_", "-");
  return {
    label: `${tech}-single-01`,
    role: def.role ?? "app",
    vmName: `${tech}-single-01`,
    ip: `10.31.${index}.50`,
    cores: def.cores ?? 4,
    memory: def.memory ?? 8192,
    diskGb: def.diskGb ?? "80"
  };
}

function catalogNodes(def, index) {
  const tech = slug(def.displayName).replaceAll("_", "-");
  const count = def.haCount ?? 3;
  return Array.from({ length: count }, (_, itemIndex) => ({
    label: `${tech}-${String(itemIndex + 1).padStart(2, "0")}`,
    role: def.role ?? "member",
    vmName: `${tech}-${String(itemIndex + 1).padStart(2, "0")}`,
    ip: `10.31.${index}.${11 + itemIndex}`,
    cores: def.haCores ?? def.cores ?? 4,
    memory: def.haMemory ?? def.memory ?? 8192,
    diskGb: def.haDiskGb ?? def.diskGb ?? "80"
  }));
}

function catalogStack(def, index) {
  const target = catalogTarget(def, index);
  const nodes = catalogNodes(def, index);
  return {
    displayName: def.displayName,
    category: def.category,
    domain: def.domain ?? "apps.example.internal",
    gateway: `10.31.${index}.1`,
    defaultCores: def.cores ?? 4,
    defaultMemory: def.memory ?? 8192,
    defaultDiskGb: def.diskGb ?? "80",
    variables: [
      variable("var-0", "environment", "payload.environment", "production"),
      variable("var-1", "service_name", "payload.service_name", slug(def.displayName).replaceAll("_", "-"))
    ],
    single: {
      filePrefix: def.singleFilePrefix ?? "single-node",
      target,
      existingHost: `10.21.${index}.50`,
      steps: containerSingleSteps(def),
      health: def.health
    },
    ha: {
      title: def.haTitle ?? `${def.displayName} HA`,
      filePrefix: def.haFilePrefix ?? "ha-cluster",
      runnerHost: `10.10.1.${index}`,
      nodes,
      steps: containerHaSteps(def, nodes),
      health: def.haHealth ?? def.health
    }
  };
}

function catalogStacks() {
  const definitions = [
    { displayName: "MySQL", category: "databases/mysql", serviceName: "mysql", image: "mysql:8.4", role: "mysql", ports: ["3306:3306"], env: { MYSQL_ROOT_PASSWORD: "change-me", MYSQL_DATABASE: "app_db", MYSQL_USER: "app_user", MYSQL_PASSWORD: "change-me" }, volumes: ["data:/var/lib/mysql"], health: "docker exec octastack-mysql mysqladmin ping -uroot -pchange-me" },
    { displayName: "MariaDB", category: "databases/mariadb", serviceName: "mariadb", image: "mariadb:11.4", role: "mariadb", ports: ["3306:3306"], env: { MARIADB_ROOT_PASSWORD: "change-me", MARIADB_DATABASE: "app_db", MARIADB_USER: "app_user", MARIADB_PASSWORD: "change-me" }, volumes: ["data:/var/lib/mysql"], health: "docker exec octastack-mariadb mariadb-admin ping -uroot -pchange-me" },
    { displayName: "MongoDB", category: "databases/mongodb", serviceName: "mongodb", image: "mongo:7", role: "mongodb", ports: ["27017:27017"], env: { MONGO_INITDB_ROOT_USERNAME: "root", MONGO_INITDB_ROOT_PASSWORD: "change-me" }, volumes: ["data:/data/db"], health: "docker exec octastack-mongodb mongosh --quiet --eval 'db.adminCommand({ ping: 1 })'" },
    { displayName: "Cassandra", category: "databases/cassandra", serviceName: "cassandra", image: "cassandra:5", role: "cassandra", ports: ["9042:9042"], env: { CASSANDRA_CLUSTER_NAME: "octastack-cassandra" }, volumes: ["data:/var/lib/cassandra"], health: "docker exec octastack-cassandra nodetool status" },
    { displayName: "ScyllaDB", category: "databases/scylladb", serviceName: "scylladb", image: "scylladb/scylla:6.1", role: "scylladb", ports: ["9042:9042"], command: "--smp 2 --memory 4G --overprovisioned 1", volumes: ["data:/var/lib/scylla"], health: "docker exec octastack-scylladb nodetool status" },
    { displayName: "ClickHouse", category: "databases/clickhouse", serviceName: "clickhouse", image: "clickhouse/clickhouse-server:24.8", role: "clickhouse", ports: ["8123:8123", "9000:9000"], env: { CLICKHOUSE_DB: "app_db", CLICKHOUSE_USER: "app_user", CLICKHOUSE_PASSWORD: "change-me" }, volumes: ["data:/var/lib/clickhouse"], health: "curl -fsS 'http://127.0.0.1:8123/ping'" },
    { displayName: "TimescaleDB", category: "databases/timescaledb", serviceName: "timescaledb", image: "timescale/timescaledb:latest-pg16", role: "timescaledb", ports: ["5432:5432"], env: { POSTGRES_PASSWORD: "change-me", POSTGRES_DB: "metrics" }, volumes: ["data:/var/lib/postgresql/data"], health: "docker exec octastack-timescaledb pg_isready -U postgres" },
    { displayName: "CockroachDB", category: "databases/cockroachdb", serviceName: "cockroachdb", image: "cockroachdb/cockroach:v24.2.0", role: "cockroach", ports: ["26257:26257", "8080:8080"], command: "start-single-node --insecure --store=/cockroach/cockroach-data", volumes: ["data:/cockroach/cockroach-data"], health: "docker exec octastack-cockroachdb cockroach sql --insecure --execute='select 1'" },
    { displayName: "YugabyteDB", category: "databases/yugabytedb", serviceName: "yugabytedb", image: "yugabytedb/yugabyte:2.23.0.0-b710", role: "yugabyte", ports: ["5433:5433", "7000:7000", "9000:9000"], command: "bin/yugabyted start --foreground", volumes: ["data:/root/var"], health: "docker exec octastack-yugabytedb bin/ysqlsh -h 127.0.0.1 -c 'select 1;'" },
    { displayName: "Neo4j", category: "databases/neo4j", serviceName: "neo4j", image: "neo4j:5", role: "neo4j", ports: ["7474:7474", "7687:7687"], env: { NEO4J_AUTH: "neo4j/change-me" }, volumes: ["data:/data"], health: "docker exec octastack-neo4j cypher-shell -u neo4j -p change-me 'RETURN 1;'" },
    { displayName: "CouchDB", category: "databases/couchdb", serviceName: "couchdb", image: "couchdb:3", role: "couchdb", ports: ["5984:5984"], env: { COUCHDB_USER: "admin", COUCHDB_PASSWORD: "change-me" }, volumes: ["data:/opt/couchdb/data"], health: "curl -fsS http://admin:change-me@127.0.0.1:5984/_up" },
    { displayName: "InfluxDB", category: "databases/influxdb", serviceName: "influxdb", image: "influxdb:2", role: "influxdb", ports: ["8086:8086"], env: { DOCKER_INFLUXDB_INIT_MODE: "setup", DOCKER_INFLUXDB_INIT_USERNAME: "admin", DOCKER_INFLUXDB_INIT_PASSWORD: "change-me-123", DOCKER_INFLUXDB_INIT_ORG: "octastack", DOCKER_INFLUXDB_INIT_BUCKET: "metrics" }, volumes: ["data:/var/lib/influxdb2"], health: "curl -fsS http://127.0.0.1:8086/health" },
    { displayName: "VictoriaMetrics", category: "databases/victoriametrics", serviceName: "victoriametrics", image: "victoriametrics/victoria-metrics:v1.103.0", role: "victoriametrics", ports: ["8428:8428"], command: "-storageDataPath=/storage", volumes: ["data:/storage"], health: "curl -fsS http://127.0.0.1:8428/health" },
    { displayName: "QuestDB", category: "databases/questdb", serviceName: "questdb", image: "questdb/questdb:8.1.0", role: "questdb", ports: ["9000:9000", "8812:8812", "9009:9009"], volumes: ["data:/var/lib/questdb"], health: "curl -fsS http://127.0.0.1:9000/" },
    { displayName: "OpenSearch", category: "search/opensearch", serviceName: "opensearch", image: "opensearchproject/opensearch:2.17.0", role: "opensearch", ports: ["9200:9200", "9600:9600"], env: { discovery_type: "single-node", OPENSEARCH_INITIAL_ADMIN_PASSWORD: "ChangeMe123!" }, volumes: ["data:/usr/share/opensearch/data"], health: "curl -kfsS -u admin:ChangeMe123! https://127.0.0.1:9200/_cluster/health" },
    { displayName: "Elasticsearch", category: "search/elasticsearch", serviceName: "elasticsearch", image: "docker.elastic.co/elasticsearch/elasticsearch:8.15.0", role: "elasticsearch", ports: ["9200:9200"], env: { discovery_type: "single-node", xpack_security_enabled: "false", ES_JAVA_OPTS: "-Xms1g -Xmx1g" }, volumes: ["data:/usr/share/elasticsearch/data"], health: "curl -fsS http://127.0.0.1:9200/_cluster/health" },
    { displayName: "MinIO", category: "storage/minio", serviceName: "minio", image: "minio/minio:RELEASE.2024-08-29T01-40-52Z", role: "minio", ports: ["9000:9000", "9001:9001"], env: { MINIO_ROOT_USER: "admin", MINIO_ROOT_PASSWORD: "change-me-123456" }, command: "server /data --console-address ':9001'", volumes: ["data:/data"], health: "curl -fsS http://127.0.0.1:9000/minio/health/live" },
    { displayName: "etcd", category: "coordination/etcd", serviceName: "etcd", image: "quay.io/coreos/etcd:v3.5.16", role: "etcd", ports: ["2379:2379", "2380:2380"], command: "etcd --advertise-client-urls=http://0.0.0.0:2379 --listen-client-urls=http://0.0.0.0:2379", volumes: ["data:/etcd-data"], health: "docker exec octastack-etcd etcdctl endpoint health" },
    { displayName: "Consul", category: "coordination/consul", serviceName: "consul", image: "hashicorp/consul:1.19", role: "consul", ports: ["8500:8500", "8600:8600/udp"], command: "agent -server -bootstrap-expect=1 -ui -client=0.0.0.0", volumes: ["data:/consul/data"], health: "curl -fsS http://127.0.0.1:8500/v1/status/leader" },
    { displayName: "NATS JetStream", category: "messaging/nats", serviceName: "nats", image: "nats:2.10", role: "nats", ports: ["4222:4222", "8222:8222"], command: "-js -m 8222", volumes: ["data:/data"], health: "curl -fsS http://127.0.0.1:8222/healthz" },
    { displayName: "Redpanda", category: "messaging/redpanda", serviceName: "redpanda", image: "redpandadata/redpanda:v24.2.3", role: "redpanda", ports: ["9092:9092", "9644:9644"], command: "redpanda start --overprovisioned --smp 1 --memory 2G --reserve-memory 0M --node-id 0 --check=false", volumes: ["data:/var/lib/redpanda/data"], health: "curl -fsS http://127.0.0.1:9644/v1/status/ready" },
    { displayName: "Apache Pulsar", category: "messaging/pulsar", serviceName: "pulsar", image: "apachepulsar/pulsar:3.3.0", role: "pulsar", ports: ["6650:6650", "8080:8080"], command: "bin/pulsar standalone", volumes: ["data:/pulsar/data"], health: "curl -fsS http://127.0.0.1:8080/admin/v2/clusters" },
    { displayName: "ActiveMQ Artemis", category: "messaging/activemq-artemis", serviceName: "artemis", image: "apache/activemq-artemis:latest", role: "artemis", ports: ["61616:61616", "8161:8161"], env: { ARTEMIS_USER: "admin", ARTEMIS_PASSWORD: "change-me" }, volumes: ["data:/var/lib/artemis-instance"], health: "curl -fsS http://127.0.0.1:8161/console/" },
    { displayName: "Nginx", category: "web/nginx", serviceName: "nginx", image: "nginx:1.27", role: "web", ports: ["80:80"], volumes: ["data:/usr/share/nginx/html"], health: "curl -fsS http://127.0.0.1/" },
    { displayName: "Apache HTTPD", category: "web/apache-httpd", serviceName: "httpd", image: "httpd:2.4", role: "web", ports: ["80:80"], volumes: ["data:/usr/local/apache2/htdocs"], health: "curl -fsS http://127.0.0.1/" },
    { displayName: "HAProxy", category: "networking/haproxy", serviceName: "haproxy", image: "haproxy:3.0", role: "load_balancer", ports: ["80:80", "8404:8404"], volumes: ["data:/usr/local/etc/haproxy"], health: "docker ps --filter name=octastack-haproxy" },
    { displayName: "Traefik", category: "networking/traefik", serviceName: "traefik", image: "traefik:v3.1", role: "ingress", ports: ["80:80", "8080:8080"], command: "--api.insecure=true --providers.docker=false --entrypoints.web.address=:80", volumes: ["data:/etc/traefik"], health: "curl -fsS http://127.0.0.1:8080/api/rawdata" },
    { displayName: "Jenkins", category: "devops/jenkins", serviceName: "jenkins", image: "jenkins/jenkins:lts", role: "ci", ports: ["8080:8080", "50000:50000"], volumes: ["data:/var/jenkins_home"], health: "curl -fsS http://127.0.0.1:8080/login" },
    { displayName: "GitLab CE", category: "devops/gitlab-ce", serviceName: "gitlab", image: "gitlab/gitlab-ce:17.3.0-ce.0", role: "gitlab", ports: ["80:80", "443:443", "2222:22"], env: { GITLAB_OMNIBUS_CONFIG: "external_url 'http://gitlab.example.internal'" }, volumes: ["data:/var/opt/gitlab"], health: "docker exec octastack-gitlab gitlab-ctl status" },
    { displayName: "Nexus Repository", category: "devops/nexus-repository", serviceName: "nexus", image: "sonatype/nexus3:3.72.0", role: "artifact_repo", ports: ["8081:8081"], volumes: ["data:/nexus-data"], health: "curl -fsS http://127.0.0.1:8081/service/rest/v1/status" },
    { displayName: "SonarQube", category: "devops/sonarqube", serviceName: "sonarqube", image: "sonarqube:10-community", role: "quality", ports: ["9000:9000"], env: { SONAR_ES_BOOTSTRAP_CHECKS_DISABLE: "true" }, volumes: ["data:/opt/sonarqube/data"], health: "curl -fsS http://127.0.0.1:9000/api/system/status" },
    { displayName: "Keycloak", category: "identity/keycloak", serviceName: "keycloak", image: "quay.io/keycloak/keycloak:25.0", role: "identity", ports: ["8080:8080"], env: { KEYCLOAK_ADMIN: "admin", KEYCLOAK_ADMIN_PASSWORD: "change-me" }, command: "start-dev", volumes: ["data:/opt/keycloak/data"], health: "curl -fsS http://127.0.0.1:8080/realms/master" },
    { displayName: "Vault", category: "security/vault", serviceName: "vault", image: "hashicorp/vault:1.17", role: "vault", ports: ["8200:8200"], env: { VAULT_DEV_ROOT_TOKEN_ID: "change-me", VAULT_DEV_LISTEN_ADDRESS: "0.0.0.0:8200" }, volumes: ["data:/vault/file"], health: "curl -fsS http://127.0.0.1:8200/v1/sys/health || true" },
    { displayName: "Loki", category: "observability/loki", serviceName: "loki", image: "grafana/loki:3.1.0", role: "logs", ports: ["3100:3100"], command: "-config.file=/etc/loki/local-config.yaml", volumes: ["data:/loki"], health: "curl -fsS http://127.0.0.1:3100/ready" },
    { displayName: "Tempo", category: "observability/tempo", serviceName: "tempo", image: "grafana/tempo:2.6.0", role: "traces", ports: ["3200:3200", "4317:4317"], command: "-config.file=/etc/tempo.yaml", volumes: ["data:/tmp/tempo"], health: "curl -fsS http://127.0.0.1:3200/ready" },
    { displayName: "Microsoft SQL Server", category: "databases/mssql", serviceName: "mssql", image: "mcr.microsoft.com/mssql/server:2022-latest", role: "mssql", ports: ["1433:1433"], env: { ACCEPT_EULA: "Y", MSSQL_SA_PASSWORD: "ChangeMe123!" }, volumes: ["data:/var/opt/mssql"], health: "docker exec octastack-mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P ChangeMe123! -C -Q 'SELECT 1'" },
    { displayName: "Oracle Database Free", category: "databases/oracle-free", serviceName: "oracle-free", image: "gvenzl/oracle-free:23-slim", role: "oracle", ports: ["1521:1521"], env: { ORACLE_PASSWORD: "ChangeMe123!" }, volumes: ["data:/opt/oracle/oradata"], health: "docker exec octastack-oracle-free healthcheck.sh" },
    { displayName: "Firebird", category: "databases/firebird", serviceName: "firebird", image: "firebirdsql/firebird:5.0", role: "firebird", ports: ["3050:3050"], env: { FIREBIRD_ROOT_PASSWORD: "change-me" }, volumes: ["data:/firebird/data"], health: "docker ps --filter name=octastack-firebird" },
    { displayName: "ArangoDB", category: "databases/arangodb", serviceName: "arangodb", image: "arangodb:3.12", role: "arangodb", ports: ["8529:8529"], env: { ARANGO_ROOT_PASSWORD: "change-me" }, volumes: ["data:/var/lib/arangodb3"], health: "curl -fsS http://root:change-me@127.0.0.1:8529/_api/version" },
    { displayName: "RethinkDB", category: "databases/rethinkdb", serviceName: "rethinkdb", image: "rethinkdb:2.4", role: "rethinkdb", ports: ["28015:28015", "8080:8080"], volumes: ["data:/data"], health: "curl -fsS http://127.0.0.1:8080/" },
    { displayName: "Memcached", category: "cache/memcached", serviceName: "memcached", image: "memcached:1.6", role: "cache", ports: ["11211:11211"], command: "memcached -m 256", volumes: ["data:/tmp"], health: "docker exec octastack-memcached sh -lc 'echo version | nc 127.0.0.1 11211 || true'" },
    { displayName: "Valkey", category: "cache/valkey", serviceName: "valkey", image: "valkey/valkey:8", role: "cache", ports: ["6379:6379"], volumes: ["data:/data"], health: "docker exec octastack-valkey valkey-cli ping" },
    { displayName: "DragonflyDB", category: "cache/dragonflydb", serviceName: "dragonflydb", image: "docker.dragonflydb.io/dragonflydb/dragonfly:latest", role: "cache", ports: ["6379:6379"], volumes: ["data:/data"], health: "docker exec octastack-dragonflydb redis-cli ping" },
    { displayName: "Apache Solr", category: "search/solr", serviceName: "solr", image: "solr:9", role: "search", ports: ["8983:8983"], volumes: ["data:/var/solr"], health: "curl -fsS http://127.0.0.1:8983/solr/admin/info/system" },
    { displayName: "Meilisearch", category: "search/meilisearch", serviceName: "meilisearch", image: "getmeili/meilisearch:v1.10", role: "search", ports: ["7700:7700"], env: { MEILI_MASTER_KEY: "change-me" }, volumes: ["data:/meili_data"], health: "curl -fsS http://127.0.0.1:7700/health" },
    { displayName: "Typesense", category: "search/typesense", serviceName: "typesense", image: "typesense/typesense:27.1", role: "search", ports: ["8108:8108"], command: "--data-dir /data --api-key=change-me --enable-cors", volumes: ["data:/data"], health: "curl -fsS http://127.0.0.1:8108/health" },
    { displayName: "Qdrant", category: "vector/qdrant", serviceName: "qdrant", image: "qdrant/qdrant:v1.11.0", role: "vector", ports: ["6333:6333", "6334:6334"], volumes: ["data:/qdrant/storage"], health: "curl -fsS http://127.0.0.1:6333/healthz" },
    { displayName: "Weaviate", category: "vector/weaviate", serviceName: "weaviate", image: "semitechnologies/weaviate:1.26.1", role: "vector", ports: ["8080:8080"], env: { QUERY_DEFAULTS_LIMIT: "25", AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: "true", PERSISTENCE_DATA_PATH: "/var/lib/weaviate", DEFAULT_VECTORIZER_MODULE: "none", CLUSTER_HOSTNAME: "node1" }, volumes: ["data:/var/lib/weaviate"], health: "curl -fsS http://127.0.0.1:8080/v1/.well-known/ready" },
    { displayName: "Milvus", category: "vector/milvus", serviceName: "milvus", image: "milvusdb/milvus:v2.4.6", role: "vector", ports: ["19530:19530", "9091:9091"], command: "milvus run standalone", volumes: ["data:/var/lib/milvus"], health: "curl -fsS http://127.0.0.1:9091/healthz" },
    { displayName: "ChromaDB", category: "vector/chromadb", serviceName: "chromadb", image: "chromadb/chroma:0.5.5", role: "vector", ports: ["8000:8000"], volumes: ["data:/chroma/chroma"], health: "curl -fsS http://127.0.0.1:8000/api/v1/heartbeat" },
    { displayName: "ZooKeeper", category: "coordination/zookeeper", serviceName: "zookeeper", image: "zookeeper:3.9", role: "zookeeper", ports: ["2181:2181"], volumes: ["data:/data"], health: "docker exec octastack-zookeeper zkServer.sh status || true" },
    { displayName: "SeaweedFS", category: "storage/seaweedfs", serviceName: "seaweedfs", image: "chrislusf/seaweedfs:3.73", role: "object_storage", ports: ["9333:9333", "8333:8333"], command: "server -dir=/data -s3", volumes: ["data:/data"], health: "curl -fsS http://127.0.0.1:9333/cluster/status" },
    { displayName: "Grafana", category: "observability/grafana", serviceName: "grafana", image: "grafana/grafana:11.1.0", role: "dashboard", ports: ["3000:3000"], env: { GF_SECURITY_ADMIN_PASSWORD: "change-me" }, volumes: ["data:/var/lib/grafana"], health: "curl -fsS http://127.0.0.1:3000/api/health" },
    { displayName: "Gitea", category: "devops/gitea", serviceName: "gitea", image: "gitea/gitea:1.22", role: "git", ports: ["3000:3000", "2222:22"], volumes: ["data:/data"], health: "curl -fsS http://127.0.0.1:3000/" },
    { displayName: "Drone CI", category: "devops/drone", serviceName: "drone", image: "drone/drone:2", role: "ci", ports: ["8080:80"], env: { DRONE_GITEA_SERVER: "http://gitea.example.internal", DRONE_RPC_SECRET: "change-me", DRONE_SERVER_HOST: "drone.example.internal", DRONE_SERVER_PROTO: "http" }, volumes: ["data:/data"], health: "curl -fsS http://127.0.0.1:8080/healthz" },
    { displayName: "Jaeger", category: "observability/jaeger", serviceName: "jaeger", image: "jaegertracing/all-in-one:1.60", role: "traces", ports: ["16686:16686", "4317:4317"], env: { COLLECTOR_OTLP_ENABLED: "true" }, volumes: ["data:/badger"], health: "curl -fsS http://127.0.0.1:16686/" }
  ];
  return definitions.map((definition, index) => catalogStack(definition, index + 80));
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
      get steps() { return legacyScriptSteps("PostgreSQL single-node", this.install); },
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
      get steps() { return legacyScriptSteps(this.title, this.install); },
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
      get steps() { return legacyScriptSteps("Redis single-node", this.install); },
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
      get steps() { return legacyScriptSteps(this.title, this.install); },
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
      get steps() { return legacyScriptSteps("Kafka single-node", this.install); },
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
      get steps() { return legacyScriptSteps(this.title, this.install); },
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
      get steps() { return legacyScriptSteps("RabbitMQ single-node", this.install); },
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
      get steps() { return legacyScriptSteps(this.title, this.install); },
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
      get steps() { return legacyScriptSteps("Vanilla Kubernetes single-node", this.install); },
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
      get steps() { return legacyScriptSteps(this.title, this.install); },
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
      get steps() { return legacyScriptSteps("Rancher RKE2 single-node", this.install); },
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
      get steps() { return legacyScriptSteps(this.title, this.install); },
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
      get steps() { return legacyScriptSteps("Prometheus Grafana single-node", this.install); },
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
      get steps() { return legacyScriptSteps(this.title, this.install); },
      health: "curl -fsS http://10.30.70.11:9090/-/ready && curl -fsS http://10.30.70.31:3000/api/health"
    }
  },
  ...catalogStacks()
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
  const categories = [...new Set(entries.map((entry) => entry.stack.category))].sort();
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
  for (const category of categories) {
    const stacksInCategory = [...new Set(entries.filter((entry) => entry.stack.category === category).map((entry) => entry.stack.displayName))].join(", ");
    lines.push(`- \`workflows/${category}\`: ${stacksInCategory} examples.`);
  }
  lines.push("");
  lines.push("## Standard conventions");
  lines.push("");
  lines.push("- Every JSON file is an importable workflow package with `kind: \"octastack.workflow.package\"`, `version: 1`, and the graph nested under `workflow.graphData`.");
  lines.push("- Every workflow uses `triggerNode` as the only root entry point.");
  lines.push("- Nodes are generated with a layered layout: linear flows use wide vertical spacing, and HA fan-out branches are distributed horizontally so nodes do not overlap in the editor.");
  lines.push("- Newer catalog examples break installation into multiple small `configCommandNode` steps so each phase can be inspected, retried, or replaced independently.");
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
  lines.push("The validator checks JSON parseability, unique node and edge IDs, valid edge references, trigger/end rules, context requirements for provision/wait/config nodes, sequential edge ordering, and approximate node layout overlap.");
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
