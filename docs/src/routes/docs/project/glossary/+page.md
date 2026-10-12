---
title: "Glossary"
---

| Term | Meaning |
|---|---|
| **ACME** | Radio helper for Cohda MK6-class C-V2X devices. In avena-net, the shared broadcast underlay. See [ACME shared medium](/docs/concepts/acme/) |
| **Babel** | Distance-vector routing protocol (RFC 8966). avena-net runs `babeld` |
| **Base interface** | `avena0` (or `interface_name`): holds the node's overlay address and listens on `listen_port` |
| **C-V2X** | Cellular vehicle-to-everything radio |
| **Capability** | Advertised role tag (`relay`, `gateway`, …). Informational today |
| **Device certificate** | JWT signed by the root, binding a DeviceId to a public key for a time window |
| **DeviceId** | First 16 bytes of SHA-256 of the device's Ed25519 public key, written in base32 |
| **Discovery** | Finding where a peer might be: mDNS, static peers, or ACME beacons |
| **Handshake** | Signed exchange that admits a peer and sets up its tunnel. See [Handshake](/docs/concepts/handshake/) |
| **Locator** | Where a discovered peer can be reached: an IP endpoint or an ACME underlay |
| **netem** | Linux traffic-control qdisc the testbed uses to emulate latency, rate, and loss |
| **Overlay address** | A device's permanent IPv6 address inside the mesh `/48` |
| **Per-peer tunnel** | `av-xxxxxxxx` WireGuard interface for one peer over one local underlay |
| **PSK** | WireGuard preshared key, derived fresh for each handshake |
| **Root** | Self-signed certificate that defines who may join a mesh |
| **Run ID** | First token of telemetry subjects. Groups the events of one experiment |
| **Scenario** | A testbed TOML file: nodes, links, events, assertions |
| **Static peer** | A peer configured by DeviceId and endpoint, used across routers |
| **Underlay** | The real network carrying tunnels: Ethernet, Wi-Fi, cellular, C-V2X |
| **wireguard-go** | Userspace WireGuard, used when the kernel module isn't available |
