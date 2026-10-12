---
title: "Troubleshooting"
---

Start with logs at debug level:

```bash
sudo RUST_LOG=debug,mdns_sd=warn avena-net /etc/avena/avena-net.toml
```

## Startup

| Message | Cause and fix |
|---|---|
| `Configuration file not found at default path /etc/avena/avena-net.toml` | No config argument, and no file at the default path. Pass the path explicitly |
| `Failed to load config …` | TOML syntax error or wrong field type. The message names the field |
| `certificate expired at …` / `chain does not terminate at trusted root` | `device_cert` is expired or wasn't issued by `trusted_root_cert` |
| `invalid keypair file size` | `keypair_path` isn't a 32-byte seed from `avena-keygen` |
| routing / spawn error naming `babeld` | `babeld` isn't installed or not at `routing.babel.binary_path` |
| `interface … is already in use (existing WireGuard userspace control socket …)` | another avena-net or wireguard-go owns that interface. Stop it, or delete the interface |
| `Generated and saved new keypair` | **Warning sign:** `keypair_path` didn't exist. This key won't match your certificate (see below) |

## Peers never discovered

- mDNS is link-local. Peers on other subnets need [static peers](/docs/tutorials/03-static-peers/).
- Check `mdns_interfaces` names the NIC that faces the peers, and that UDP 5353 multicast is allowed.
- `ERROR mdns_sd::service_daemon: Failed to send to …` lines for tunnel or down interfaces are
  harmless noise. Set `mdns_interfaces` explicitly to avoid them.

## Discovered, never connected

| Look for | Meaning |
|---|---|
| `Waiting for peer to initiate` (debug) | normal for the smaller DeviceId. The *other* side must reach you |
| `Connection refused` / timeout | TCP `listen_port + 1` blocked, or nothing listening there |
| `message expired` / `message from the future` | clocks differ by more than 60 s. Fix NTP |
| `certificate validation failed` | the peer's certificate is expired, from another root, or for a different key |
| `device id mismatch` | the configured static `device_id` isn't the device answering at that endpoint |

### Key and certificate mismatch

If the node starts fine but **every** peer rejects it, compare the DeviceId of its key with its
certificate subject:

```bash
avena-keygen from-file /etc/avena/device.key | head -1
avena-keygen cert show /etc/avena/device.cert | grep sub
```

If they differ, issue a certificate for the key that's actually installed.

## Connected, but no traffic

- UDP 20000–59999 must be open both ways. Each tunnel uses its own port in that range. See
  [Configure the firewall](/docs/guides/firewall/).
- `sudo wg show`: a peer with no `latest handshake` never completed WireGuard's own handshake,
  which almost always means UDP is blocked or NATed away.
- Check routes: `ip -6 route | grep -E 'fd00:a0e0|av-'`.
- More than one hop away? See the validation status in [Routing with Babel](/docs/concepts/routing/).

## Testbed

| Symptom | Fix |
|---|---|
| `node startup failed: not ready` | read `nodeX.stdout.log` next to the metrics file |
| permission errors creating namespaces | unprivileged user namespaces disabled (e.g. Ubuntu AppArmor). Use `sudo` |
| `avena-net` not found / old behavior | rebuild with `cargo build --workspace` so both binaries are current |
| leftover `av-mgmt0` or namespaces after a crash | `sudo ip link del av-mgmt0`, then rerun |

## Still stuck

Open an issue at [github.com/oats-center/avena-net](https://github.com/oats-center/avena-net/issues)
with debug logs from both sides of a failing pair, and your config with keys removed.
