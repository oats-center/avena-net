---
title: "Your first mesh on real hosts"
description: "Bring up avena-net on three Linux machines on one LAN and ping across the overlay."
---

**You will:** create a certificate authority, give three hosts their own identities, start
avena-net on each, and ping between overlay addresses.

**You need:** three Linux hosts on the same L2 network (same VLAN/subnet), root on each, and
`avena-net` [installed](/docs/getting-started/install/). You also need `avena-keygen` on an admin
machine. The hosts are called `node1`, `node2`, and `node3` below.

## 1. Open the firewall

On each host, allow:

| Port | Protocol | Purpose |
|---|---|---|
| `51821` | TCP | Handshake (`listen_port + 1`) |
| `20000–59999` | UDP | Per-peer WireGuard tunnels |
| `5353` | UDP multicast | mDNS discovery |

See [Configure the firewall](/docs/guides/firewall/) for why the tunnel range is so wide and for
`firewalld`/`nftables` examples.

## 2. Create the certificate authority and node credentials

On the admin machine:

```bash
mkdir avena-pki && cd avena-pki

# Root: one key, one self-signed certificate (valid 10 years)
avena-keygen generate ca.key
avena-keygen cert init-ca ca.key root.cert

# One key and certificate per node (valid 365 days by default)
for n in node1 node2 node3; do
  avena-keygen generate $n.key > $n.meta
  avena-keygen cert issue ca.key root.cert $n.key $n.cert
done
cat node2.meta
```

```text
device_id=phoxlu7memyidxhpq3sgcxgkbi
overlay_ip=fd00:a0e0:a000:79dd:75d3:ec23:3081:1
```

Each `.meta` file records a node's DeviceId and overlay address. Keep `ca.key` on the admin
machine. Nodes only need the root *certificate*.

## 3. Install credentials

For each node, copy the shared root certificate and that node's own key and certificate:

```bash
scp root.cert node1.key node1.cert node1:/tmp/
ssh node1 'sudo install -d -m 0700 /etc/avena &&
  sudo install -m 0644 /tmp/root.cert  /etc/avena/root.cert &&
  sudo install -m 0600 /tmp/node1.key  /etc/avena/device.key &&
  sudo install -m 0600 /tmp/node1.cert /etc/avena/device.cert &&
  rm /tmp/root.cert /tmp/node1.key /tmp/node1.cert'
```

Repeat for `node2` and `node3` with their own files.

## 4. Configure each node

Find the NIC that faces the LAN:

```bash
ip route get 1.1.1.1 | awk '/dev/ {print $5; exit}'
```

Create `/etc/avena/avena-net.toml` on each host, changing `mdns_interfaces` to match:

```toml
interface_name = "avena0"
tunnel_mode = "prefer_kernel"
listen_port = 51820
keypair_path = "/etc/avena/device.key"
trusted_root_cert = "/etc/avena/root.cert"
device_cert = "/etc/avena/device.cert"
persistent_keepalive = 5
dead_peer_timeout_secs = 30

[network]
prefix = "fd00:a0e0:a000::"
prefix_len = 48

[discovery]
enable_mdns = true
mdns_interfaces = ["eth0"]

[telemetry]
publish_nats = false
```

## 5. Start the daemons

```bash
sudo RUST_LOG=info avena-net /etc/avena/avena-net.toml
```

Watch for, in order:

- `Loaded device certificate`
- `Overlay address overlay_ip=…`
- `Handshake listener bound addr=[::]:51821`
- `Started babeld for dynamic routing`
- `Peer discovered` → `Peer connected` (once for each neighbor)

## 6. Verify

```bash
ip -6 addr show avena0        # this node's overlay address
sudo wg show                  # one av-… interface per neighbor
ip -6 route | grep fd00:a0e0  # overlay routes
ping -6 <overlay_ip from node2.meta>
```

## If it doesn't work

| Symptom | Likely cause |
|---|---|
| No `Peer discovered` | mDNS blocked, or wrong `mdns_interfaces` |
| Discovered but never `connected` | TCP 51821 blocked, or clocks more than 60 s apart |
| Connected but no ping | UDP 20000–59999 blocked |
| Exits at startup with a routing error | `babeld` missing or not at `/usr/sbin/babeld` |

The [Troubleshooting guide](/docs/guides/troubleshooting/) goes further.

## Next

- Make it permanent: [Run as a systemd service](/docs/guides/systemd/).
- Hosts on different subnets: [Connect across subnets](/docs/tutorials/03-static-peers/).
