---
title: "Tunnels"
---

## Interfaces

A node has two kinds of WireGuard interface:

| Interface | Name | Purpose |
|---|---|---|
| **Base** | `interface_name` (default `avena0`) | Holds the node's overlay address, listens on `listen_port`, anchors babeld at startup |
| **Per-peer** | `av-` + 8 hex digits | One for each (peer, local underlay) pair. Carries that peer's traffic |

A per-peer interface name is the first four bytes of
`SHA-256(local DeviceId ‖ peer DeviceId ‖ local underlay)`, hex-encoded. For IP peers, the
underlay is the name of the local interface the handshake used. For ACME peers, it's the ACME
underlay name. So:

- the same peer over the same NIC always gets the same interface name;
- the same peer over **two** NICs gets **two** interfaces (see [Tutorial 2](/docs/tutorials/02-failover/)).

Each per-peer interface also carries the node's own overlay `/128`, and is added to babeld.

## Ports

Every per-peer interface listens on its own UDP port, derived from its name:

```text
port = 20000 + (u16_le(SHA-256(interface_name)[0..2]) mod 40000)    →  20000–59999
```

The port is sent to the peer in the handshake (`wg_listen_port`), so each side knows where to
send. That's why firewalls must allow the whole **UDP 20000–59999** range, not just
`listen_port`. See [Configure the firewall](/docs/guides/firewall/).

## Backends

| `tunnel_mode` | Behavior |
|---|---|
| `kernel` | Linux WireGuard via netlink only |
| `userspace` | `wireguard-go` only (found on `PATH`, controlled over its UAPI socket in `/var/run/wireguard`) |
| `prefer_kernel` (default) | try kernel, fall back to `wireguard-go` for each interface |

The fallback is decided per interface at creation time, so a kernel without the WireGuard module,
or a container without the needed privileges, still works if `wireguard-go` is installed.

## Peer configuration

Each per-peer interface has exactly one WireGuard peer:

- public key and endpoint from the [handshake](/docs/concepts/handshake/);
- a fresh preshared key from the ephemeral exchange;
- `AllowedIPs = ::/0`. Because each interface has only one peer, the kernel routing table
  decides which interface a packet uses, and WireGuard accepts it;
- `persistent_keepalive` from the config (default 25 s).

## Teardown

Every `dead_peer_timeout_secs` (default 180 s), avena-net reads each tunnel's counters. A
tunnel whose received bytes haven't changed for longer than the timeout is removed: its
interface is deleted, it's flushed from babeld, and a `peer_disconnected` event is published
with `reason: "dead_peer_timeout"`. On shutdown, all interfaces are removed.
