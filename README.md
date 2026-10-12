# avena-net

[![GitHub Release](https://img.shields.io/github/v/release/oats-center/avena-net?logo=github)](https://github.com/oats-center/avena-net/releases)
[![Container Image](https://img.shields.io/badge/ghcr.io-oats--center%2Favena--net-blue?logo=podman)](https://github.com/oats-center/avena-net/pkgs/container/avena-net)
[![Rust](https://img.shields.io/badge/rust-2021-orange?logo=rust)](https://www.rust-lang.org/)

An encrypted, authenticated IPv6 mesh for devices at the edge.

avena-net gives every device a stable overlay address. The address is derived from the device's Ed25519 identity. The `avena-net` daemon discovers neighbors over mDNS, static endpoints, or a shared C-V2X radio, then authenticates each one against a common root certificate. For every authenticated neighbor it builds a WireGuard tunnel. [Babel](https://www.irif.fr/~jch/software/babel/) routes across those tunnels, so devices with no direct link can still reach each other through intermediate nodes.

It is built for farm equipment, roadside units, and other field devices on unreliable links, but runs on any Linux host with WireGuard and `babeld`.

---

## Table of Contents

- [How It Works](#how-it-works)
- [Use Cases](#use-cases)
- [Installation](#installation)
  - [Release Binary](#release-binary)
  - [Container Image](#container-image)
  - [Quadlet](#quadlet)
- [Quick Start](#quick-start)
  - [Create Credentials](#create-credentials)
  - [Configure](#configure)
  - [Run](#run)
  - [Verify](#verify)
- [Configuration at a Glance](#configuration-at-a-glance)
- [Ports](#ports)
- [Telemetry](#telemetry)
- [Building from Source](#building-from-source)
- [Repository Layout](#repository-layout)
- [More Details](#more-details)
- [Credits](#credits)

---

## How It Works

```
 Ed25519 identity ──▶ DeviceId ──▶ overlay IPv6 address (fd00:a0e0:a000::/48)

 Discovery ──▶ Authenticated Handshake ──▶ WireGuard Tunnel ──▶ Babel Routing
 (mDNS / static / ACME)   (TCP, cert-checked)    (per peer)        (multi-hop)
                                                     │
                                                     ▼
                                              NATS telemetry
```

1. **Identity**: Each device holds an Ed25519 keypair. Its 16-byte `DeviceId` determines its overlay address within a `/48` ULA prefix, so the address never changes, even when the underlay network does.
2. **Discovery**: Peers are found by mDNS on the local network, by statically configured endpoints, or by beacons sent over an ACME/C-V2X shared radio channel. Several methods can run at the same time.
3. **Handshake**: Neighbors exchange certificates (JWTs signed by a common root) over a TCP control channel. Peers that cannot prove a valid chain are rejected. A successful handshake yields the WireGuard keys for the pair.
4. **Tunnels**: Each authenticated neighbor gets its own WireGuard interface. avena-net uses the kernel WireGuard module when it can and falls back to `wireguard-go` in userspace when it can't (for example, inside containers).
5. **Routing**: avena-net runs `babeld` across the per-peer interfaces. Babel learns multi-hop routes and fails over between them when links change.
6. **Telemetry**: Peer, handshake, and routing events are published to NATS, if configured, for dashboards and experiments.

---

## Use Cases

### Field and Farm Networks

Tractors, implements, and edge gateways move in and out of radio range all the time. Each machine keeps the same overlay address, and Babel routes through whichever neighbors are in range. That lets services on one machine reach another without tracking changing underlay IPs.

### Mixed IP and C-V2X Deployments

A single node can talk to ordinary IP/mDNS neighbors and to ACME/C-V2X radio neighbors (for example, a Cohda MK6) at the same time. Both kinds become normal overlay peers, and Babel routes across both underlays. See [`docs/acme.md`](docs/acme.md).

### Secure Sidecar for Existing Services

Run avena-net as a container, then attach other containers, such as `nats-server`, to its network namespace. Those services become reachable over the encrypted overlay without changes. See [`docs/container.md`](docs/container.md).

### Network Experiments

The [`testbed/`](testbed/) harness runs multi-node topologies in Linux network namespaces, optionally driven by ns-3 radio and mobility models. Scenarios cover link churn, underlay failover, and multi-hop relays.

---

## Installation

All methods require Linux, root or `CAP_NET_ADMIN`, and `babeld` on the host or in the image.

### Release Binary

**Use this when:** you want a plain daemon on a physical host.

Install the runtime dependencies:

```bash
# Debian / Ubuntu
sudo apt-get install -y wireguard-tools babeld
# Fedora
sudo dnf install -y wireguard-tools babeld
```

Download the binary for your architecture from the latest release:

```bash
curl -LO https://github.com/oats-center/avena-net/releases/latest/download/avena-net-x86_64-unknown-linux-gnu.tar.gz
tar -xzf avena-net-x86_64-unknown-linux-gnu.tar.gz
sudo install -m 0755 avena-net /usr/local/bin/avena-net
```

For 64-bit ARM (Raspberry Pi, etc.), use `avena-net-aarch64-unknown-linux-gnu.tar.gz`.

Release archives contain only the daemon. Install `avena-keygen`, which you'll need to create credentials, with Cargo:

```bash
cargo install --git https://github.com/oats-center/avena-net avena-net --bin avena-keygen
```

### Container Image

**Use this when:** you already run services under Podman or Docker and want avena-net as a network sidecar.

GitHub Actions publishes images to GHCR. The image bundles `babeld`, `wireguard-tools`, and `wireguard-go`.

```bash
podman pull ghcr.io/oats-center/avena-net:latest
podman run --rm \
  --name avena-net \
  --cap-add NET_ADMIN \
  --device /dev/net/tun \
  -p 51820:51820/udp \
  -p 51821:51821/tcp \
  -v /etc/avena:/etc/avena:Z \
  ghcr.io/oats-center/avena-net:latest
```

To pin a version, use a release tag such as `ghcr.io/oats-center/avena-net:vX.Y.Z`.

Inside a container, set `routing.babel.skip_kernel_setup = true` and set the forwarding sysctls on the host. See [`docs/container.md`](docs/container.md).

### Quadlet

**Use this when:** you want systemd to manage the container.

```bash
sudo install -d /etc/containers/systemd
sudo curl -fsSL https://raw.githubusercontent.com/oats-center/avena-net/main/packaging/quadlet/avena-net.container \
  -o /etc/containers/systemd/avena-net.container
sudo sed -i 's#Image=localhost/avena-net:latest#Image=ghcr.io/oats-center/avena-net:latest#' \
  /etc/containers/systemd/avena-net.container
sudo systemctl daemon-reload
sudo systemctl start avena-net.service
```

The unit sets `Notify=true`, so systemd waits until the daemon reports it is ready. To run NATS (or any other service) inside the overlay's network namespace, see [`packaging/quadlet/avena-nats.container.example`](packaging/quadlet/avena-nats.container.example).

---

## Quick Start

This walkthrough brings up a small mesh on hosts that share a LAN, using mDNS discovery. For the full runbook, including troubleshooting, see [`docs/getting-started.md`](docs/getting-started.md).

### Create Credentials

Every node trusts one root certificate and holds its own device key and certificate. On an admin machine:

```bash
# Root CA
avena-keygen generate ca.key > ca.meta
avena-keygen cert init-ca ca.key root.cert

# One key + certificate per node
avena-keygen generate node1.key > node1.meta
avena-keygen cert issue ca.key root.cert node1.key node1.cert
```

Each `nodeX.meta` records that node's `device_id` and `overlay_ip`. Copy `root.cert`, plus that node's key and certificate, to `/etc/avena/` on each node:

```bash
sudo install -d -m 0700 /etc/avena
sudo install -m 0644 root.cert  /etc/avena/root.cert
sudo install -m 0600 node1.key  /etc/avena/device.key
sudo install -m 0600 node1.cert /etc/avena/device.cert
```

Keep `ca.key` off the nodes.

### Configure

Create `/etc/avena/avena-net.toml`:

```toml
# Overlay interface and WireGuard listen port.
# The handshake listener uses listen_port + 1 (TCP).
interface_name = "avena0"
listen_port = 51820
# Use kernel WireGuard if available, otherwise wireguard-go.
tunnel_mode = "prefer_kernel"

keypair_path = "/etc/avena/device.key"
trusted_root_cert = "/etc/avena/root.cert"
device_cert = "/etc/avena/device.cert"

persistent_keepalive = 5
dead_peer_timeout_secs = 30

[network]
# Every node in one mesh must use the same /48.
prefix = "fd00:a0e0:a000::"
prefix_len = 48

[discovery]
enable_mdns = true
# The underlay NIC(s) to discover peers on.
mdns_interfaces = ["eth0"]

[routing.babel]
binary_path = "/usr/sbin/babeld"

[telemetry]
# Set to true and add nats_url to stream events to NATS.
publish_nats = false
```

To reach peers on another subnet, or across a WAN where mDNS can't reach, add static peers:

```toml
[[discovery.static_peers]]
device_id = "<device_id from nodeX.meta>"
endpoint = "203.0.113.10:51820"
```

### Run

```bash
sudo RUST_LOG=info avena-net /etc/avena/avena-net.toml
```

If you omit the path, avena-net uses `/etc/avena/avena-net.toml`. Look for `Handshake listener bound`, `Started babeld for dynamic routing`, and then `Peer discovered` / `Peer connected` as neighbors appear.

### Verify

```bash
ip -6 addr show avena0      # this node's overlay address
sudo wg show                # one WireGuard peer per neighbor
ip -6 route show            # overlay routes installed by Babel
ping -6 <overlay_ip from another node's .meta>
```

---

## Configuration at a Glance

| Section | Purpose |
|---------|---------|
| top level | Interface name, WireGuard port, tunnel backend, credential paths, keepalive and dead-peer timeout. |
| `[network]` | Overlay ULA prefix. Must match on every node. |
| `[discovery]` | mDNS on/off and interfaces, static peers, re-announce and retry intervals. |
| `[routing.babel]` | `babeld` binary and socket paths, hello/update intervals, container mode. |
| `[telemetry]` | NATS publishing, run and node IDs used in subjects. |
| `[acme]` | Optional ACME/C-V2X shared-medium underlay. |

For every field and its default, see [`docs/config.md`](docs/config.md). A complete mixed IP + ACME example is in [`examples/mixed-ip-acme.toml`](examples/mixed-ip-acme.toml).

---

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `51820` (`listen_port`) | UDP | WireGuard data plane |
| `51821` (`listen_port + 1`) | TCP | Authenticated handshake / control plane |
| `5353` | UDP multicast | mDNS discovery, when enabled |

If you change `listen_port`, open both it and `listen_port + 1`.

---

## Telemetry

When `telemetry.publish_nats = true`, avena-net publishes JSON events to NATS under:

```text
avena.v1.<run_id>.node.<node_id>.overlay.<event>          # e.g. peer-connected
avena.v1.<run_id>.node.<node_id>.routing.babel.<event>    # e.g. neighbors-active
```

The NATS server is `telemetry.nats_url` or, if that is unset, the `AVENA_NATS_URL` environment variable. The dashboard in [`testbed/ui/`](testbed/ui/) consumes these subjects.

---

## Building from Source

```bash
cargo build --release --bin avena-net --bin avena-keygen
```

Cross-compile for 64-bit ARM:

```bash
cargo install cross --git https://github.com/cross-rs/cross
cross build --release --target aarch64-unknown-linux-gnu --bin avena-net
```

Build the container image locally:

```bash
podman build -t localhost/avena-net:latest -f packaging/Containerfile .
```

Run the tests:

```bash
cargo test --workspace
```

Some integration tests need root or `CAP_NET_ADMIN` and are `#[ignore]`d by default. See [`docs/reference.md`](docs/reference.md#testing).

---

## Repository Layout

```text
src/            avena-net library and binaries (avena-net, avena-keygen)
tests/          integration tests and helper scripts
examples/       example configurations
docs/           user documentation
packaging/      Containerfile and quadlet units
testbed/        avena-testbed: multi-node scenario harness (+ ns-3 driver, telemetry UI)
plans/          roadmap, tech debt, and design records
```

---

## More Details

- [`docs/getting-started.md`](docs/getting-started.md): step-by-step physical host bring-up and troubleshooting
- [`docs/config.md`](docs/config.md): full configuration reference
- [`docs/acme.md`](docs/acme.md): mixed IP + ACME/C-V2X deployments
- [`docs/container.md`](docs/container.md): container image, quadlets, sidecar networking
- [`docs/reference.md`](docs/reference.md): architecture, library API, `avena-keygen`, testing
- [`testbed/README.md`](testbed/README.md): running multi-node scenarios

---

## Credits

This work was supported by the [Open Ag Technologies and Systems (OATS) Center at Purdue University](https://oatscenter.org/).
