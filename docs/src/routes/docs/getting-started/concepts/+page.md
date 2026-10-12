---
title: "avena-net in five minutes"
description: "The handful of ideas you need before running anything."
---

## Six ideas

**1. A device is its key.** Each device has an Ed25519 keypair. The SHA-256 of the public
key, truncated to 16 bytes, is its **DeviceId**, written as 26 lowercase base32 characters
such as `k2qxkrr25jgc25yxbstxunjyiy`.

**2. The DeviceId is the address.** Each mesh shares one `/48` ULA prefix, by default
`fd00:a0e0:a000::/48`. A device's **overlay address** is that prefix plus the first 64 bits of
its DeviceId, ending in `::1`. Nobody assigns it, and it never changes.

```text
fd00:a0e0:a000 : 56a1:7546:3aea:4c2d : 0001
└── /48 prefix ┘ └─ DeviceId[0..8] ──┘ └ host
```

**3. A root decides who's in.** You create a root certificate once. Every device gets a
certificate signed by that root, as a JWT signed with EdDSA. During the handshake, each
side checks that the other's certificate chains to the root and matches its key.

**4. Neighbors find each other.** Each node advertises itself over mDNS, connects to the static
endpoints you configure, and, if it has an ACME radio, sends beacons on the shared channel.

**5. Every neighbor gets a tunnel.** After the handshake, avena-net creates a dedicated
WireGuard interface for that peer, named `av-` plus eight hex digits. A peer reachable over two
underlays, such as Wi-Fi and cellular, gets two interfaces.

**6. Babel connects the tunnels.** avena-net starts `babeld` and adds every tunnel interface to
it. Each node announces its own address, and Babel computes routes, including through
intermediate nodes.

## The moving parts on one node

```text
             ┌──────────────────────── avena-net ────────────────────────┐
  mDNS ─────▶│ discovery ─▶ handshake (TCP :51821) ─▶ tunnels (av-…)     │
  static ───▶│                      │                     │              │
  ACME ─────▶│              cert check vs root           babeld ◀──▶ peers│
             │                                                 telemetry ─┼─▶ NATS
             └────────────────────────────────────────────────────────────┘
```

| Thing | Where |
|---|---|
| Daemon | `avena-net`, config at `/etc/avena/avena-net.toml` |
| Credentials tool | `avena-keygen` |
| Base interface | `avena0`, which holds this node's overlay address |
| Per-peer tunnels | `av-xxxxxxxx`, each on its own UDP port in 20000–59999 |
| Handshake | TCP `listen_port + 1`, by default 51821 |
| Routing daemon | `babeld`, started and managed by avena-net |

## Where to go next

- Try it without hardware: [Quickstart: a mesh on one machine](/docs/getting-started/quickstart/).
- Go deeper: [Architecture overview](/docs/concepts/architecture/).
