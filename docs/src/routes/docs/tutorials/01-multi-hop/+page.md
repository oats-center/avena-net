---
title: "Tutorial 1: Watch traffic take two hops"
---

**You will learn:** how to read a testbed scenario, how a node reaches a peer it has no link to,
and how to change a link while a scenario runs.

**You need:** the build from the [Quickstart](/docs/getting-started/quickstart/).

## The topology

`testbed/scenarios/linear_three_hop.toml` puts three nodes in a line. `nodeA` and `nodeC`
share no link, so the only way between them is through `nodeB`.

```text
nodeA ──10 ms── nodeB ──10 ms── nodeC
```

```toml
name = "linear-three-hop"
duration_secs = 45

[[nodes]]
id = "nodeA"
[[nodes]]
id = "nodeB"
[[nodes]]
id = "nodeC"

[[links]]
endpoints = ["nodeA", "nodeB"]
latency_ms = 10
bandwidth_kbps = 100000

[[links]]
endpoints = ["nodeB", "nodeC"]
latency_ms = 10
bandwidth_kbps = 100000

[[assertions]]
at_secs = 10.0
condition = { type = "NodesConnected", nodes = ["nodeA", "nodeB"] }

[[assertions]]
at_secs = 10.0
condition = { type = "NodesConnected", nodes = ["nodeB", "nodeC"] }

[[assertions]]
at_secs = 20.0
condition = { type = "Ping", from = "nodeA", to = "nodeC", timeout_ms = 2000 }
```

Each `[[links]]` entry becomes a veth pair with `netem` latency, bandwidth, and loss applied.
Assertions run at their `at_secs` times. If any assertion fails, the scenario fails.

## 1. Run it

```console
$ ./target/debug/avena-testbed run testbed/scenarios/linear_three_hop.toml
Running scenario: linear-three-hop
...
Starting 3 nodes... 3 running (0.3s)
Running timeline (45s, 0 events, 3 assertions)... done (20.1s)

✓ Scenario passed
  Assertions: 3/3 passed
```

The last assertion pings `nodeC`'s **overlay** address from `nodeA`. That packet goes into
`nodeA`'s tunnel to `nodeB`, and `nodeB` forwards it into its tunnel to `nodeC`.

## 2. See the tunnels

```bash
grep "Peer connected" /tmp/nodeB.stdout.log
```

`nodeB` reports two `Peer connected` lines, one for each neighbor, each on its own `av-…`
interface. `nodeA` and `nodeC` report one each. Neither ever connects to the other, but they
can still exchange traffic.

## 3. Change a link mid-run

Copy the scenario and degrade the B–C link after the network has formed:

```bash
cp testbed/scenarios/linear_three_hop.toml my-three-hop.toml
cat >> my-three-hop.toml <<'EOF'

[[events]]
at_secs = 25.0
action = { type = "ModifyLink", link = "nodeB-nodeC", latency_ms = 150, loss_percent = 5.0 }

[[assertions]]
at_secs = 35.0
condition = { type = "Ping", from = "nodeA", to = "nodeC", timeout_ms = 5000 }
EOF
./target/debug/avena-testbed validate my-three-hop.toml
./target/debug/avena-testbed run my-three-hop.toml
```

```text
✓ Scenario passed
  Assertions: 4/4 passed
  Events executed: 1
```

Links without an `id` are named `<first>-<second>` after their endpoints, which is why
`nodeB-nodeC` works here.

## What you learned

- A scenario is nodes, links, a timeline of events, and assertions.
- Every neighbor is a separate tunnel, and forwarding between tunnels gives you relaying.
- `ModifyLink`, `DisconnectLink`, `ConnectLink`, `StopNode`, and `StartNode` change the
  network while it runs. See the [scenario reference](/docs/reference/scenario/).

Next: [Tutorial 2: Survive a link failure](/docs/tutorials/02-failover/).
