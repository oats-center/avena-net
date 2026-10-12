---
title: "Tutorial 3: Connect across subnets"
---

**You will learn:** how to join nodes that mDNS can't see, such as nodes on another subnet,
behind a VPN, or across the internet, using static peers.

**You need:** two nodes set up as in [Your first mesh on real hosts](/docs/getting-started/physical-hosts/),
on networks that can route to each other but don't share multicast.

## Why mDNS isn't enough

mDNS is link-local: announcements don't cross routers. A node on `10.1.0.0/24` will never hear
one on `10.2.0.0/24`, even if they can ping each other. Static peers tell avena-net where a
specific device lives.

## 1. Collect each peer's DeviceId and endpoint

The DeviceId is in the `.meta` file you saved when generating the key:

```bash
cat node2.meta
# device_id=phoxlu7memyidxhpq3sgcxgkbi
```

You can also print it from the key itself:

```bash
avena-keygen from-file /etc/avena/device.key
```

The endpoint is the peer's **underlay** address and its `listen_port` (default `51820`). You can
use a hostname. avena-net resolves it when it loads static peers.

## 2. Add the peer to each side

On `node1`:

```toml
[[discovery.static_peers]]
device_id = "phoxlu7memyidxhpq3sgcxgkbi"   # node2
endpoint  = "10.2.0.20:51820"
```

On `node2`:

```toml
[[discovery.static_peers]]
device_id = "ehxe3hakycmekcpbe64vxheymu"   # node1
endpoint  = "10.1.0.10:51820"
```

:::caution[Important]
`device_id` is required. A static peer without one is skipped, with a log line saying it
"will need handshake to identify".
:::

Configuring both sides is the safe default. Only the node with the **larger DeviceId** opens the
handshake. The other one waits for the call. So the side that dials must know about the side
that listens.

## 3. Open the ports between them

The handshake connects to `endpoint` port **+ 1** (TCP `51821`). WireGuard traffic then flows to
the per-peer tunnel port each side announced in the handshake, somewhere in UDP
`20000–59999`. Both directions must be allowed through every firewall in between. See
[Configure the firewall](/docs/guides/firewall/).

## 4. Restart and check

```bash
sudo systemctl restart avena-net     # or rerun avena-net by hand
journalctl -u avena-net -f | grep -E "static peer|Peer connected"
```

```text
INFO avena_net: Resolved static peer peer_id=phoxlu7memyidxhpq3sgcxgkbi locator=10.2.0.20:51820
INFO avena_net: Initiating handshake peer_id=phoxlu7memyidxhpq3sgcxgkbi
INFO avena_net: Peer connected peer_id=phoxlu7memyidxhpq3sgcxgkbi iface=av-b06e0342
```

You can keep mDNS on as well. Each node finds LAN neighbors by mDNS and the remote one statically.

## What you learned

- mDNS doesn't cross routers. Static peers do.
- A static peer is a `device_id` plus the peer's WireGuard `endpoint`. The handshake goes to
  `endpoint + 1`.
- The larger DeviceId always dials.

Next: [Tutorial 4: Run as a container sidecar](/docs/tutorials/04-container-sidecar/).
