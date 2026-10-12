---
title: "Write testbed scenarios"
---

`avena-testbed` runs real `avena-net` daemons, one per network namespace, connects them with
emulated links, runs a timeline of events, and checks assertions. Field reference:
[Scenario files](/docs/reference/scenario/).

## Requirements

- `cargo build --workspace`, so that `avena-testbed` and `avena-net` sit side by side in `target/…/`;
- `babeld`, `iproute2`, `unshare`/`nsenter`, and WireGuard (kernel or `wireguard-go`) on the host;
- unprivileged user namespaces, or run with `sudo`.

When it isn't root, the testbed re-runs itself inside a new user namespace, so ordinary users
can create namespaces, veths, and WireGuard interfaces.

## Anatomy

```toml
name = "my-scenario"
description = "What this proves"
duration_secs = 60

[[nodes]]                 # one avena-net daemon each
id = "nodeA"

[[links]]                 # a veth pair with netem shaping
id = "a-b"                # optional; defaults to "<first>-<second>"
endpoints = ["nodeA", "nodeB"]
latency_ms = 10
bandwidth_kbps = 100000
loss_percent = 0.0

[[events]]                # change the network at a time
at_secs = 30.0
action = { type = "DisconnectLink", link = "a-b" }

[[assertions]]            # check something at a time
at_secs = 20.0
condition = { type = "Ping", from = "nodeA", to = "nodeB", timeout_ms = 3000 }
```

The testbed generates a fresh PKI for every run. Neighbors on `[[links]]` (point-to-point
veths) are configured as static peers. Nodes sharing a `[[bridges]]` segment find each other
by mDNS.

## Workflow

```bash
./target/debug/avena-testbed validate my-scenario.toml
./target/debug/avena-testbed run my-scenario.toml -o results/run1.jsonl
ls results/            # run1.jsonl plus nodeX.stdout.log / nodeX.stderr.log
```

Use `--keep-namespaces` to leave the namespaces in place after the run for inspection. Use
`-v` for testbed debug logs.

## Choosing assertion times

Nodes start together, handshake within a second or two, and Babel needs a few hello intervals
after that. The bundled scenarios use **10 s** for direct connectivity and **20 s** for relayed
pings. After a `DisconnectLink`, allow at least `dead_peer_timeout_secs` plus a couple of seconds
before asserting that traffic moved.

A failed assertion ends the run immediately and prints which one failed:

```text
✗ Scenario execution failed: event error: assertion failed at 20s: ping from nodeA to nodeD failed after 5 probes
```

## Bundled scenarios

| Scenario | What it exercises |
|---|---|
| `two_node_basic` | direct connectivity |
| `linear_three_hop` | relaying through one node |
| `star_gateway` | five nodes, mixed links and a bridge, through a gateway |
| `mobile_relay` | store-and-forward through a moving relay |
| `dual_underlay_same_peer` | two parallel links to one peer |
| `dual_underlay_failover` | failover between parallel links |
| `dual_underlay_churn_cleanup` | repeated teardown and rebuild, checks for leaked interfaces |
| `*_ns3` | the same ideas over ns-3 Wi-Fi models (see [ns-3](/docs/guides/ns3/)) |

`avena-testbed examples` prints this list.
