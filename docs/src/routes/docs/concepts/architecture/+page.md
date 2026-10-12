---
title: "Architecture overview"
---

avena-net is one daemon per device. It owns the device's overlay identity, finds and admits
peers, and configures WireGuard and babeld to carry and route traffic. It has no central
server: every node runs the same code and makes its own decisions.

## Layers

```text
┌──────────────────────────────────────────────────────────────────┐
│ Telemetry     NATS: avena.v1.<run>.node.<node>.…                 │
├──────────────────────────────────────────────────────────────────┤
│ Routing       babeld (RFC 8966), started and fed by avena-net    │
├──────────────────────────────────────────────────────────────────┤
│ Tunnels       one WireGuard interface per (peer, local underlay) │
│               kernel module or wireguard-go                      │
├──────────────────────────────────────────────────────────────────┤
│ Handshake     TCP (IP peers) or ACME control frames              │
│               signed, timestamped, certificate-checked           │
├──────────────────────────────────────────────────────────────────┤
│ Discovery     mDNS · static peers · ACME beacons                 │
├──────────────────────────────────────────────────────────────────┤
│ Identity      Ed25519 keypair → DeviceId → overlay IPv6 address  │
└──────────────────────────────────────────────────────────────────┘
```

## What happens at startup

1. Load the config. Load the device keypair, or generate one if `keypair_path` doesn't exist yet.
2. Load the root and device certificates, and check that the device certificate chains to the root.
3. Create the **base interface** (`avena0`) with the selected tunnel backend, listening on
   `listen_port`, and assign this node's overlay address to it.
4. Start discovery (mDNS on the configured interfaces, or on every up interface if none are
   listed) and the ACME runtime if `[acme]` is set.
5. Bind the handshake listener on `listen_port + 1`.
6. Start `babeld` with the base interface and connect to its control socket.
7. Connect to NATS if telemetry is configured.
8. Announce presence, resolve static peers, and notify systemd `READY=1`.

## The run loop

Once running, the daemon reacts to events and timers:

| Trigger | Action |
|---|---|
| peer discovered | if our DeviceId is larger, open a handshake |
| incoming handshake | rate-limit, verify, reply, build the tunnel |
| every `presence_reannounce_interval_ms` | re-announce on mDNS (and ACME) |
| every `peer_retry_interval_ms` | retry known peers that aren't connected |
| every 2 s | pick the tunnel for the overlay prefix route when one peer has several |
| every `babel_snapshot_interval_secs` | publish Babel routes and neighbors |
| every `dead_peer_timeout_secs` | tear down tunnels with no traffic |
| SIGINT (Ctrl+C) | stop babeld and ACME helpers, remove interfaces and routes |

## Code map

| Module | Responsibility |
|---|---|
| `identity` | Ed25519 keypairs, DeviceId |
| `address` | DeviceId → IPv6 address in the `/48` |
| `crypto` | JWT certificates, handshake messages, HKDF key derivation |
| `discovery` | mDNS, static peers, discovery events |
| `tunnel` / `wg` | backend-agnostic tunnels, kernel netlink, wireguard-go UAPI |
| `routing` | babeld process and control socket |
| `acme` | ACME helpers, frame codec, WireGuard proxy |
| `daemon` | configuration types and peer state |
| `src/bin/avena_net.rs` | the daemon itself: handshake transport, run loop, telemetry |

## Related pages

- [Identity and addressing](/docs/concepts/identity/)
- [Handshake](/docs/concepts/handshake/)
- [Tunnels](/docs/concepts/tunnels/)
- [Routing with Babel](/docs/concepts/routing/)
