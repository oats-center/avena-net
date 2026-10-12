---
title: "Overview"
description: "What avena-net is, what it gives you, and where to start."
---

avena-net is an encrypted, authenticated IPv6 mesh for devices at the edge. It is the overlay
network used by [Avena](https://oats-center.github.io/avena/), the OATS edge platform, and it
also runs on its own on any Linux host.

> **The key is the address. The certificate is the invitation. Babel finds the way.**

Each device has an Ed25519 keypair. The keypair determines the device's permanent overlay
address. The `avena-net` daemon discovers nearby devices, checks each one's certificate against a
root you control, builds a WireGuard tunnel to every peer it accepts, and runs Babel across those
tunnels. Devices that can't hear each other directly still reach each other through the ones in
between.

## What avena-net gives you

- **Addresses that never change.** An address is derived from the device's identity, not from the
  network it's on. A tractor keeps the same address on the yard Wi-Fi, a cellular modem, and an
  ad-hoc link to the combine.
- **Authentication you own.** Peers must present a certificate chained to *your* root. Without
  one, a device gets no tunnel, no route, and no traffic.
- **Discovery without infrastructure.** mDNS finds peers on the local network. Static endpoints
  reach peers across a WAN. Beacons find peers on a shared C-V2X radio channel.
- **Routing across tunnels.** Every peer gets its own WireGuard interface, and avena-net runs
  [Babel](https://www.irif.fr/~jch/software/babel/) across them, so traffic can be relayed through
  a neighbor. When one of several links to the same peer fails, traffic moves to another.
- **Several underlays at once.** One node can be reachable over Ethernet, Wi-Fi, and C-V2X
  at the same time, with a separate tunnel on each.
- **Telemetry.** Peer, handshake, and routing events can be published to NATS.
- **A testbed.** Real daemons, in network namespaces, with scripted link failures, without root.

## Who this documentation is for

| You are… | Start with |
|---|---|
| **Evaluating** avena-net | [avena-net in five minutes](/docs/getting-started/concepts/), then the [Quickstart](/docs/getting-started/quickstart/) |
| **Deploying** to real machines | [Install](/docs/getting-started/install/), [Your first mesh on real hosts](/docs/getting-started/physical-hosts/), [Run as a systemd service](/docs/guides/systemd/) |
| **Integrating** with containers or Avena | [Run as a container sidecar](/docs/tutorials/04-container-sidecar/), [Run in containers](/docs/guides/containers/) |
| **Researching** routing and radios | [Write testbed scenarios](/docs/guides/scenarios/), [Simulate radios with ns-3](/docs/guides/ns3/) |
| **Contributing** to avena-net | [Architecture overview](/docs/concepts/architecture/), [Development and testing](/docs/project/development/) |

## What avena-net is not

avena-net is not a VPN to a central concentrator, and it has no coordination server. It is
also not a general SD-WAN or a replacement for WireGuard or Babel. It configures those tools
and adds identity, admission, and discovery on top. It does not choose underlays for you
either: devices still need some IP link, or an ACME radio, to talk over.
