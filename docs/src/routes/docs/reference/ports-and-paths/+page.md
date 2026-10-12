---
title: "Ports and paths"
---

## Ports

| Port | Protocol | Used by | Configurable |
|---|---|---|---|
| `51820` | UDP | base WireGuard interface. Advertised as the peer's endpoint in discovery | `listen_port` |
| `51821` | TCP | handshake listener | `listen_port + 1`, or `listen_address` |
| `20000–59999` | UDP | per-peer WireGuard interfaces (one port each, hash of the interface name) | no |
| `5353` | UDP | mDNS | no |
| `6696` | UDP | Babel, inside the tunnels | no |
| `wg_proxy_port`, `tx_local_port`, `rx_local_port` | UDP, loopback | ACME proxy and helpers | `[acme]` |
| `4222` | TCP | NATS, outbound, if telemetry is used | `telemetry.nats_url` |

## Interfaces

| Name | What |
|---|---|
| `avena0` | base interface (`interface_name`) |
| `av-xxxxxxxx` | per-peer tunnel |
| `av-mgmt0` | testbed management bridge (testbed only) |

## Files

| Path | What | Set by |
|---|---|---|
| `/etc/avena/avena-net.toml` | configuration | CLI argument (this is the default) |
| `/etc/avena/device.key` | 32-byte Ed25519 seed, mode `0600` | `keypair_path` |
| `/etc/avena/device.cert` | device certificate (JWT) | `device_cert` |
| `/etc/avena/root.cert` | root certificate (JWT) | `trusted_root_cert` |
| `/run/avena/babel.sock` | babeld control socket | `routing.babel.socket_path` |
| `/run/avena/babel.state` | babeld state file | `routing.babel.state_path` |
| `/usr/sbin/babeld` | babeld binary | `routing.babel.binary_path` |
| `/var/run/wireguard/<iface>.sock` | wireguard-go control sockets | — |

## Addresses

| Item | Value |
|---|---|
| Default overlay prefix | `fd00:a0e0:a000::/48` |
| Device address | `<prefix>:<DeviceId[0..8]>:1` |
| Workload address | `<prefix>:<DeviceId[0..8]>:<0x100 + index>` |
| Testbed management subnet | `172.31.255.0/24` (NATS at `172.31.255.1:4222`) |
