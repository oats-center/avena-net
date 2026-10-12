# Reference

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     avena-net                           │
├─────────────────────────────────────────────────────────────┤
│  identity   │  crypto    │  discovery  │  tunnel            │
│  ─────────  │  ────────  │  ─────────  │  ──────            │
│  DeviceId   │  Handshake │  mDNS       │  TunnelBackend     │
│  Keypair    │  Certs     │  Static     │  ├─ Kernel         │
│  Workload   │  Sessions  │  Events     │  └─ Userspace      │
├─────────────────────────────────────────────────────────────┤
│  routing (babeld)          │  acme (shared-medium proxy)    │
├─────────────────────────────────────────────────────────────┤
│                     wg (WireGuard)                          │
│  ─────────────────────────────────────────────────────────  │
│  Types │ UAPI │ Linux netlink │ Userspace (wireguard-go)    │
└─────────────────────────────────────────────────────────────┘
```

### Modules

| Module      | Purpose                                                    |
| ----------- | ---------------------------------------------------------- |
| `identity`  | Ed25519 device keypairs and stable 16-byte identifiers     |
| `address`   | Deterministic IPv6 overlay address derivation (ULA `/48`)  |
| `crypto`    | Handshakes, certificates (JWT), HKDF key derivation        |
| `discovery` | mDNS and static peer discovery with event broadcast        |
| `tunnel`    | Backend-agnostic WireGuard tunnel management               |
| `wg`        | Low-level WireGuard types, UAPI, kernel netlink            |
| `routing`   | `babeld` process supervision and control socket            |
| `acme`      | ACME/C-V2X helper processes, framing, and WireGuard proxy  |
| `daemon`    | Configuration and peer state for `avena-net`           |

The daemon entry point is `src/bin/avena_net.rs`.

## Library Usage

The crate also works as a library:

```rust
use avena_net::{DeviceKeypair, NetworkConfig, derive_wireguard_keypair};

// Generate or load device identity
let device = DeviceKeypair::generate();
let device_id = device.device_id();

// Derive overlay address
let network = NetworkConfig::default_ula();
let overlay_ip = network.device_address(&device_id);

// Derive WireGuard keys
let wg_keys = derive_wireguard_keypair(&device);
```

## `avena-keygen`

```bash
avena-keygen generate [output-file]          # random keypair; prints device_id and overlay_ip
avena-keygen from-seed <64-char-hex>         # deterministic keypair from a seed
avena-keygen from-file <keypair-file>        # show device_id / overlay_ip of an existing key
avena-keygen cert init-ca <keypair-file> <output-jwt>
avena-keygen cert issue <issuer-key> <issuer-jwt> <subject-key> <output-cert> [--days=N]
avena-keygen cert show <jwt-file>
```

The printed `overlay_ip` assumes the default `fd00:a0e0:a000::/48` prefix.

## `avena-net` CLI

```text
avena-net [--help] [--version] [config-path]
```

`config-path` defaults to `/etc/avena/avena-net.toml`. The daemon sends systemd `READY=1` (`sd_notify`) once it is up, so `Type=notify` units and `Notify=true` quadlets work.

## Release Artifacts

Pushing a `v*` tag runs two workflows:

- `.github/workflows/release-binaries.yml` attaches `avena-net-x86_64-unknown-linux-gnu.tar.gz` and `avena-net-aarch64-unknown-linux-gnu.tar.gz` to the GitHub release.
- `.github/workflows/publish-container.yml` pushes `ghcr.io/oats-center/avena-net:<tag>`. Pushes to `main` also update `:main` and `:latest`.

## Testing

```bash
cargo test --workspace
```

Tests that need privileges or a real network are `#[ignore]`d. Run them explicitly:

```bash
sudo -E cargo test -- --ignored
```

- Kernel tunnel tests need `CAP_NET_ADMIN` and the WireGuard kernel module.
- Userspace tunnel tests need `CAP_NET_ADMIN` and `wireguard-go`.
- The mDNS discovery test needs a network that allows multicast.

`tests/scripts/two_node_test.sh` brings up two userspace-backed nodes on one host. `tests/sudoers.d/avena-test` is an optional sudoers drop-in that lets the test cleanup commands run without a password prompt.

For multi-node scenarios (namespaces, link churn, ns-3 radio models), see [`../testbed/README.md`](../testbed/README.md).
