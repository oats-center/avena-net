---
title: "Discovery"
---

Discovery answers one question: *where might device X be reachable?* It doesn't establish
trust. Every discovered peer still goes through the [handshake](/docs/concepts/handshake/).

avena-net runs all configured methods at once and feeds their results into one queue of
**discovered peers**. Each result is a DeviceId plus a *locator*: either a direct IP endpoint or
an ACME underlay.

## mDNS

| Item | Value |
|---|---|
| Service type | `_avena._udp.local.` |
| TXT `avena-id` | DeviceId (base32) |
| TXT `wg-endpoint` | `ip:port` of the announcing interface and `listen_port` |
| TXT `cap` | comma-separated capabilities, if any |

avena-net announces on each interface in `discovery.mdns_interfaces`. If that list is empty,
it announces on **every interface that is up**, except `lo`, the overlay interface, and `av-*`
tunnels. It re-announces every `presence_reannounce_interval_ms` (default 1 s).

mDNS is link-local, so it never crosses a router.

## Static peers

```toml
[[discovery.static_peers]]
device_id = "phoxlu7memyidxhpq3sgcxgkbi"
endpoint  = "203.0.113.10:51820"
capabilities = ["Gateway"]
```

The endpoint is resolved when the daemon starts (hostnames are allowed). Entries without a
`device_id` are skipped. Static peers are the way to reach nodes across subnets, VPNs, or the
internet.

## ACME beacons

With `[acme]` configured, the node broadcasts a discovery frame every
`announce_interval_ms` (default 5 s) on the shared radio channel. The frame carries its
DeviceId, `telemetry.node_id` (or the DeviceId), capabilities, and the ACME underlay name. Peers
found this way get an ACME locator, and their handshake runs over the radio. See
[ACME shared medium](/docs/concepts/acme/).

## Who dials whom

When a peer is discovered, **only the node with the larger DeviceId** starts the handshake. The
other one waits. This avoids two simultaneous handshakes racing to configure the same tunnel.
For static peers, it means the larger side must have the smaller side in its config.

Repeated discovery events are throttled. A peer that was active in the last 5 seconds isn't
re-handshaked, and attempts to the same peer path are spaced at least 10 seconds apart.
Peers that were discovered but never connected are retried every `peer_retry_interval_ms`.

## Capabilities

Peers can advertise capabilities: `relay`, `gateway`, `workload-spawn`, `device-issue` in
mDNS TXT records, or `Relay`, `Gateway`, `WorkloadSpawn`, `DeviceIssue` in TOML. They are
carried and recorded, but they don't change routing or admission yet.
