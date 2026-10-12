---
title: "Tutorial 2: Survive a link failure"
---

**You will learn:** how one peer reachable over two underlays gets two tunnels, and how traffic
keeps flowing when one underlay goes away and comes back.

**You need:** the build from the [Quickstart](/docs/getting-started/quickstart/).

## Two links, one peer

Think of a vehicle with both Wi-Fi and a cellular modem talking to a base station. Both links
reach the same peer, so avena-net builds **one tunnel per underlay**. The tunnel name is
derived from the local DeviceId, the peer's DeviceId, and the local interface the handshake
went out on.

`testbed/scenarios/dual_underlay_failover.toml` models this:

```text
          ab-wifi   5 ms, 100 Mbit/s
nodeA ═══════════════════════════════ nodeB
          ab-cell  50 ms,  10 Mbit/s, 2% loss
```

```toml
[[links]]
id = "ab-wifi"
endpoints = ["nodeA", "nodeB"]
latency_ms = 5
bandwidth_kbps = 100000

[[links]]
id = "ab-cell"
endpoints = ["nodeA", "nodeB"]
latency_ms = 50
bandwidth_kbps = 10000
loss_percent = 2.0

[[assertions]]
at_secs = 20.0
condition = { type = "TunnelInterfaceCount", node = "nodeA", count = 2 }
```

The timeline:

| Time | What happens | Checked |
|---|---|---|
| 20 s | both links up | two tunnels on each node, ping both ways |
| 30 s | `ab-wifi` disconnected | ping both ways at 40 s |
| 55 s | `ab-wifi` reconnected | |
| 65 s | `ab-cell` disconnected | ping both ways at 75 s |
| 85 s | `ab-cell` reconnected | |

## 1. Run it

```console
$ ./target/debug/avena-testbed run testbed/scenarios/dual_underlay_failover.toml
Running scenario: dual-underlay-failover
...
Running timeline (95s, 4 events, 8 assertions)... done (85.0s)

✓ Scenario passed
  Assertions: 8/8 passed
  Events executed: 4
```

## 2. Read the metrics

```bash
grep -E "link_changed|convergence_metric" /tmp/avena-metrics.jsonl
```

```json
{"timestamp_ms":30341,"event_type":"link_changed","data":{"enabled":false,"link":"ab-wifi"}}
{"timestamp_ms":55090,"event_type":"link_changed","data":{"enabled":true,"link":"ab-wifi"}}
{"timestamp_ms":75380,"event_type":"convergence_metric","data":{"from":"nodeA","link":"ab-wifi","metric":"underlay_up_to_first_successful_overlay_ping_ms","to":"nodeB","value_ms":19985,...}}
```

`convergence_metric` records how long it took, after an underlay came back, before the next
successful overlay ping. Use it to compare tuning changes.

## How the switch happens

Both tunnels carry the same overlay addresses, so the question is which one to use. When a
single peer is reachable over several tunnels, avena-net points the overlay route at the tunnel
that is **currently receiving traffic**. It checks WireGuard's received-bytes counters every
two seconds. When an underlay disappears, its counter stops moving and the route moves to the
other tunnel. A tunnel with no activity for `dead_peer_timeout_secs` is torn down.

:::tip[Tip]
`persistent_keepalive` sets how quickly an idle-but-alive tunnel proves it's alive. The testbed
uses short values. On real radios, balance it against airtime.
:::

## What you learned

- Tunnels are per peer *and* per underlay.
- Underlay failover is driven by observed traffic, not configuration.
- `link_changed` and `convergence_metric` in the metrics file let you measure recovery.

Next: [Tutorial 3: Connect across subnets](/docs/tutorials/03-static-peers/).
