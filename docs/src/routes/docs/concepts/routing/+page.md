---
title: "Routing with Babel"
---

avena-net combines routes it installs itself with [babeld](https://www.irif.fr/~jch/software/babel/)
(RFC 8966), which it runs as a child process.

## How babeld is run

avena-net starts its own `babeld` and owns its whole configuration. It never reads
`/etc/babeld.conf`:

```text
babeld -c /dev/null -S /run/avena/babel.state -I "" \
       -G /run/avena/babel.sock -d 0 -h <hello> -H <hello> \
       -C "interface avena0 type tunnel unicast true split-horizon true"
```

- Tunnel interfaces are added as they appear, over the control socket, with the same
  `type tunnel unicast true split-horizon true` statement. Torn-down tunnels are flushed.
- `hello_interval` and `update_interval` come from `[routing.babel]`.
- On kernels without IPv6 policy rules (`ip -6 rule` fails), avena-net turns on
  `ipv6-subtrees` automatically. Override it with `routing.babel.ipv6_subtrees`.
- `skip_kernel_setup = true` stops babeld from writing sysctls (needed in containers).

If babeld can't start, avena-net exits. Routing is not optional.

## Routes avena-net installs itself

On top of Babel, avena-net keeps two kinds of routes in sync every two seconds:

| Route | When |
|---|---|
| **Direct peer** `/128` via its tunnel | for every connected peer reachable over exactly one tunnel |
| **Overlay prefix** `/48` via a tunnel | when all connected tunnels lead to a **single** peer. Picks the tunnel with recent received traffic |

The prefix route makes a node with one neighbor (a leaf, or a node with several underlays to
one gateway) send all overlay traffic to that neighbor. It's also what drives
[underlay failover](/docs/tutorials/02-failover/).

## What's validated today

| Topology | Status | Scenario |
|---|---|---|
| Direct neighbors | ✓ passes | `two_node_basic` |
| One relay (A–B–C) | ✓ passes | `linear_three_hop` |
| Star through a gateway | ✓ passes | `star_gateway` |
| Two underlays to one peer, failover | ✓ passes | `dual_underlay_failover` |
| Tunnel cleanup after repeated full disconnects | under validation | `dual_underlay_churn_cleanup` |
| Mobile relay (store-and-forward) | under validation | `mobile_relay` |
| Longer chains / meshes with alternate paths | under validation | |

:::caution[Important]
Paths that depend **only** on routes learned through Babel, such as A→D in A–B–C–D, or across a
mesh where the source has several neighbors, didn't pass in our unprivileged testbed runs.
Babel's control traffic over WireGuard is tracked as **TD-005** in `plans/tech-debt.md`. Until
it's resolved, design deployments so that each node has one upstream neighbor, or test your
topology in the [testbed](/docs/guides/scenarios/) first.
:::

## Telemetry

Every `babel_snapshot_interval_secs`, avena-net dumps babeld's state and publishes it to
`…routing.babel.routes` and `…routing.babel.neighbors`. See [Telemetry](/docs/concepts/telemetry/).
