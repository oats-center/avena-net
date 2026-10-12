# Configuration Reference

`avena-net` reads a single TOML file. Pass its path as the only argument. If you omit it, the daemon uses `/etc/avena/avena-net.toml`.

```bash
avena-net /etc/avena/avena-net.toml
```

Every field has a default except `trusted_root_cert` and `device_cert`.

---

## Top Level

| Field | Default | Description |
|-------|---------|-------------|
| `interface_name` | `"avena0"` | Base overlay interface. It holds this node's overlay address. Per-peer WireGuard interfaces are named `av-<suffix>`. |
| `tunnel_mode` | `"prefer_kernel"` | `"kernel"`, `"userspace"` (`wireguard-go`), or `"prefer_kernel"` (kernel, falling back to userspace). |
| `listen_port` | `51820` | WireGuard UDP port. The handshake listener uses `listen_port + 1` over TCP. |
| `listen_address` | `[::]:<listen_port + 1>` | Explicit socket address for the TCP handshake listener. |
| `keypair_path` | none | Device Ed25519 keypair created by `avena-keygen generate`. |
| `trusted_root_cert` | **required** | Root certificate (single JWT) that every peer's certificate must chain to. |
| `device_cert` | **required** | This device's certificate (single JWT) issued by the root. |
| `persistent_keepalive` | `25` | WireGuard persistent keepalive, in seconds. |
| `dead_peer_timeout_secs` | `180` | Remove a peer after this many seconds without activity. |

## `[network]`

| Field | Default | Description |
|-------|---------|-------------|
| `prefix` | `"fd00:a0e0:a000::"` | Overlay ULA prefix. Every node in a mesh must use the same value. |
| `prefix_len` | `48` | Only `48` is supported. |

A node's overlay address is `prefix` plus bits derived from its `DeviceId`. `avena-keygen` prints the address for the default prefix.

## `[discovery]`

| Field | Default | Description |
|-------|---------|-------------|
| `enable_mdns` | `true` | Advertise and browse for peers over mDNS. |
| `mdns_interfaces` | `[]` | Interfaces to run mDNS on. Empty means the system default. |
| `mdns_interface` | none | Deprecated single-interface form of `mdns_interfaces`. |
| `presence_reannounce_interval_ms` | `1000` | How often to re-announce local presence. |
| `peer_retry_interval_ms` | `250` | How often to retry connecting to known but unconnected peers. |
| `static_peers` | `[]` | Peers at fixed endpoints. See below. |

### `[[discovery.static_peers]]`

Use static peers when mDNS can't reach a neighbor, for example across subnets or a WAN.

```toml
[[discovery.static_peers]]
device_id = "<device_id printed by avena-keygen>"
endpoint = "203.0.113.10:51820"   # peer's WireGuard port; hostnames are resolved
capabilities = ["Gateway"]        # optional: Relay, WorkloadSpawn, DeviceIssue, Gateway
```

`device_id` is required in practice. A static peer without one is logged and then skipped.

## `[routing.babel]`

avena-net starts and manages its own `babeld` process.

| Field | Default | Description |
|-------|---------|-------------|
| `binary_path` | `"/usr/sbin/babeld"` | Path to `babeld`. |
| `socket_path` | `"/run/avena/babel.sock"` | `babeld` control socket. |
| `state_path` | `"/run/avena/babel.state"` | `babeld` state file (`-S`). |
| `debug_level` | `0` | `babeld -d` level. `0` disables periodic table dumps. |
| `hello_interval` | `1000` | Hello interval, ms. |
| `update_interval` | `4000` | Update interval, ms. |
| `ipv6_subtrees` | auto | Force `babeld`'s `ipv6-subtrees` mode. When unset, it is turned on automatically if `ip -6 rule` is unsupported. |
| `skip_kernel_setup` | `false` | Don't write sysctls. Set this in containers, where `/proc/sys` is read-only. Missing settings are logged. See [`container.md`](container.md#container-config). |

## `[telemetry]`

| Field | Default | Description |
|-------|---------|-------------|
| `publish_nats` | `true` | Publish events to NATS. Set to `false` when you have no NATS server. |
| `nats_url` | none | NATS server URL. If unset, uses the `AVENA_NATS_URL` environment variable. |
| `run_id` | `$AVENA_RUN_ID`, else `"standalone"` | First token in telemetry subjects. Use it to separate experiment runs. |
| `node_id` | the node's `DeviceId` | Human-readable node name for subjects and ACME discovery. |
| `babel_snapshot_interval_secs` | `1` | How often to publish Babel route and neighbor snapshots. |

Subjects follow `avena.v1.<run_id>.node.<node_id>.overlay.<event>` and `avena.v1.<run_id>.node.<node_id>.routing.babel.<event>`.

## `[acme]`

Optional. When present, the node also uses an ACME/C-V2X shared radio channel as an underlay, in addition to IP. See [`acme.md`](acme.md) for a walkthrough.

| Field | Default | Description |
|-------|---------|-------------|
| `name` | `"acme"` | Logical name of this underlay inside avena-net. |
| `interface` | **required** | Radio interface passed to the `acme` helper, e.g. `cv2x0`. |
| `binary_path` | `"acme"` | Path to the external `acme` helper binary. |
| `destination` | `"ff02::1"` | Destination group address used by the helper. |
| `event_port` | `9000` | Over-the-air event port. Must match on every ACME node. |
| `proxy_ip` | `127.0.0.1` | Loopback address for the local proxy sockets. |
| `wg_proxy_port` | `51831` | Local UDP port that ACME-backed WireGuard peers target. |
| `tx_local_port` | `51841` | Local UDP port the TX helper listens on. |
| `rx_local_port` | `51842` | Local UDP port the RX helper delivers to. |
| `announce_interval_ms` | `5000` | ACME discovery rebroadcast interval. |
| `startup_delay_ms` | `1000` | Wait after spawning helpers before sending traffic. |
| `control_timeout_ms` | `10000` | Timeout for ACME handshake request/response exchanges. |

The port defaults above differ from the tuple in [`examples/mixed-ip-acme.toml`](../examples/mixed-ip-acme.toml), which matches the original demo scripts. The values just need to be consistent across your ACME nodes.

## Environment

| Variable | Effect |
|----------|--------|
| `RUST_LOG` | Log filter, e.g. `info`, `debug`, `avena_net=debug`. |
| `AVENA_NATS_URL` | NATS URL, used when `telemetry.nats_url` is unset. |
| `AVENA_RUN_ID` | Telemetry run ID, used when `telemetry.run_id` is unset. |
