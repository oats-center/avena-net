---
title: "Tutorial 5: Mix IP and C-V2X"
---

**You will learn:** how to add an ACME/C-V2X radio underlay to a node that also has ordinary IP
neighbors, and how to check that both kinds of peer join the same mesh.

**You need:** at least two ACME-capable nodes (for example Cohda MK6) with the `acme` helper
installed and the radio interface visible to Linux, plus one ordinary LAN node. Each node needs
credentials and the basic setup from [Your first mesh on real hosts](/docs/getting-started/physical-hosts/).

## How ACME differs

A shared radio channel isn't an IP network. There's no per-peer addressing and no mDNS, and
every node hears every frame. avena-net handles this by running exactly one `acme` **TX**
helper and one **RX** helper, and putting a local UDP proxy between them and WireGuard:

- discovery beacons, handshake requests and replies, and WireGuard packets all travel as
  framed messages on the same channel;
- frames carry source and destination DeviceIds, and each node drops frames addressed to
  someone else;
- each ACME peer still gets its own `av-…` WireGuard tunnel, and Babel treats it like any other
  neighbor.

The [ACME concept page](/docs/concepts/acme/) covers the frame format.

## 1. Start from the mixed example

Copy `examples/mixed-ip-acme.toml` to `/etc/avena/avena-net.toml` on each ACME node and
adjust:

```toml
[discovery]
enable_mdns = true
mdns_interfaces = ["eth0"]          # the node's ordinary LAN NIC(s)

[telemetry]
publish_nats = false
node_id = "mk6-node-01"             # human name, also sent in ACME beacons

[acme]
name = "cv2x"
interface = "cv2x0"                 # the radio interface
binary_path = "/usr/local/bin/acme" # the helper
destination = "ff02::1"
event_port = 9000                   # must match on every ACME node
proxy_ip = "127.0.0.1"
wg_proxy_port = 51821
tx_local_port = 51831
rx_local_port = 51832
announce_interval_ms = 5000
startup_delay_ms = 1000
control_timeout_ms = 10000
```

The example's port choices match the original `acme2wg.py` demo. The built-in defaults are
different (`51831`, `51841`, `51842`). Either set works, as long as it's the same on every
ACME node and doesn't collide with something else on the host.

For an ACME-only node, set `enable_mdns = false` and `mdns_interfaces = []`.

## 2. Bring nodes up

Start the LAN-only node as usual. Then, on each ACME node:

```bash
sudo RUST_LOG=debug avena-net /etc/avena/avena-net.toml
```

Look for `ACME runtime started` and the helper lines `starting ACME TX helper` and
`starting ACME RX helper`, then `Peer discovered` and `Peer connected` for both IP and ACME
neighbors.

## 3. Validate the mixed mesh

```bash
sudo wg show          # IP-backed and ACME-backed peers, each on its own av-… interface
ip -6 route           # overlay routes through both kinds of interface
ping -6 <overlay_ip of the other ACME node>
ping -6 <overlay_ip of the LAN-only node>
```

ACME-backed peers show `127.0.0.1:<wg_proxy_port>` as their WireGuard endpoint, because all of
their traffic goes through the local proxy.

## Troubleshooting

| Symptom | Check |
|---|---|
| No `ACME runtime started` | `acme.binary_path` exists and is executable |
| No ACME discovery | `acme.interface` is right, `event_port` matches, the radio is receiving |
| ACME discovers but doesn't connect | raise `control_timeout_ms`, and look for helper stderr in the avena-net log |
| IP peers work, ACME doesn't | the radio interface exists before avena-net starts |

Next: [Tutorial 6: Stream and watch telemetry](/docs/tutorials/06-telemetry/).
