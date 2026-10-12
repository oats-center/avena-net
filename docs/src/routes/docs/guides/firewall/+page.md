---
title: "Configure the firewall"
---

## What to allow

| Port | Proto | Direction | Why |
|---|---|---|---|
| `listen_port + 1` (51821) | TCP | inbound | handshakes from peers with a larger DeviceId |
| `20000–59999` | UDP | inbound | per-peer WireGuard tunnels |
| `5353` | UDP | inbound, multicast `224.0.0.251` / `ff02::fb` | mDNS discovery |
| `listen_port` (51820) | UDP | inbound | the base interface. Its port is advertised in discovery |

Outbound traffic to the same ports on peers must be allowed too.

### Why such a wide UDP range?

Each peer has its own WireGuard interface, and each interface listens on a port derived from a
hash of its name, somewhere in 20000–59999. The port is sent to the peer during the handshake.
It's stable for a given pair of devices and local NIC, but you can't predict it without
computing the hash. See [Tunnels](/docs/concepts/tunnels/#Ports).

## firewalld

```bash
sudo firewall-cmd --permanent --add-port=51820/udp --add-port=51821/tcp
sudo firewall-cmd --permanent --add-port=20000-59999/udp
sudo firewall-cmd --permanent --add-service=mdns
sudo firewall-cmd --reload
```

## nftables

```text
table inet avena {
  chain input {
    type filter hook input priority 0; policy accept;
    tcp dport 51821 accept
    udp dport { 51820, 20000-59999 } accept
    udp dport 5353 accept
  }
}
```

Add these rules to your existing input chain, which presumably has `policy drop`.

## ufw

```bash
sudo ufw allow 51821/tcp
sudo ufw allow 51820/udp
sudo ufw allow 20000:59999/udp
sudo ufw allow 5353/udp
```

## Traffic inside the overlay

Overlay traffic arrives on `avena0` and the `av-*` interfaces. If your firewall filters by
interface, allow what you need on `av+`/`avena0`, including Babel (UDP 6696). Every peer on
those interfaces has already passed certificate checks, but you may still want per-service
rules.

## NAT

A node behind NAT can still dial *out* to peers with public endpoints. That works when it has
the larger DeviceId, or when the other side lists it as a static peer and can reach it. Two
nodes both behind NAT, with no port forwarding, can't connect. avena-net has no relay or hole-punching.
