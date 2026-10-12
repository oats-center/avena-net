---
title: "Quickstart: a mesh on one machine"
description: "Run real avena-net nodes in network namespaces on one Linux host, without root."
---

**You will:** build avena-net and its testbed, start two nodes in isolated network namespaces,
and watch them discover each other, handshake, and pass traffic.

**You need:** a Linux host with a Rust toolchain, `babeld`, `wireguard-tools`, and `iproute2`.
`wireguard-go` on `PATH` is recommended. No root is needed if your kernel allows unprivileged
user namespaces; most distributions do.

## 1. Build

```bash
git clone https://github.com/oats-center/avena-net
cd avena-net
cargo build --workspace
```

This builds `avena-net`, `avena-keygen`, and `avena-testbed` into `target/debug/`. The testbed
starts the `avena-net` binary that sits next to it, so build both together.

## 2. Run a scenario

```console
$ ./target/debug/avena-testbed run testbed/scenarios/two_node_basic.toml
Running scenario: two-node-basic
Generating PKI... done (0.0s)
Setting up network topology... done (0.0s)
Starting 2 nodes... 2 running (0.3s)
Running timeline (30s, 0 events, 2 assertions)... done (20.1s)
Cleaning up... done (0.3s)

✓ Scenario passed
  Assertions: 2/2 passed
  Events executed: 0
  Duration: 20.07s
  Metrics written to: /tmp/avena-metrics.jsonl
```

Here's what happened:

1. **PKI.** The testbed generated a root certificate, plus a key and certificate for each node.
2. **Topology.** Each node got its own network namespace, joined by a virtual Ethernet link.
3. **Nodes.** A real `avena-net` daemon started in each namespace with a generated config.
4. **Timeline.** At fixed times, the testbed checked that the nodes were connected and that
   one could ping the other's overlay address.

## 3. Look at what the daemons did

Node logs are written next to the metrics file:

```bash
grep -E "Overlay address|Peer (discovered|connected)" /tmp/nodeA.stdout.log
```

```text
INFO avena_net: Overlay address overlay_ip=fd00:a0e0:a000:21ee:4d9c:ac0:9845:1
INFO avena_net: Peer discovered peer_id=… locator=10.1.0.2:51820
INFO avena_net: Peer connected peer_id=… iface=av-6bdf13bc
```

The metrics file is one JSON object per line:

```bash
head -3 /tmp/avena-metrics.jsonl
```

```json
{"timestamp_ms":0,"event_type":"scenario_started","data":{"name":"two-node-basic"}}
{"timestamp_ms":249,"event_type":"node_started","node":"nodeA","data":{"overlay_ip":"fd00:a0e0:a000:…:1"}}
```

Use `-o <path>` to write metrics and logs somewhere else.

:::tip[Tip]
If node startup fails with a permission error, your distribution may restrict unprivileged user
namespaces. Ubuntu 24.04 does this through AppArmor. Run the same command with `sudo`.
:::

## Next

- Add a third node and watch traffic relay: [Tutorial 1](/docs/tutorials/01-multi-hop/).
- Move to real hardware: [Your first mesh on real hosts](/docs/getting-started/physical-hosts/).
