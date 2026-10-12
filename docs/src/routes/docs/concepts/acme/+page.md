---
title: "ACME shared medium"
---

ACME is the radio helper used with Cohda MK6-class C-V2X devices. It provides a **shared
broadcast channel**: every nearby node hears every frame, there is no per-peer addressing,
and mDNS doesn't work. avena-net adds this channel as one more underlay, next to ordinary IP.

## Constraints that shape the design

1. Only **one TX** and **one RX** helper process may run on a node.
2. Every transmission is broadcast. Only the intended receiver can decrypt WireGuard payloads,
   but everyone receives them.
3. The same node must keep talking to IP/mDNS peers at the same time.

## Components

```text
 WireGuard av-… (per ACME peer) ──▶ 127.0.0.1:wg_proxy_port ─┐
                                                             │  frame (WgData, dst=peer)
 discovery beacons ──────────────────────────────────────────┤──▶ acme TX helper ──▶ radio
 handshake requests / responses ─────────────────────────────┘

 radio ──▶ acme RX helper ──▶ 127.0.0.1:rx_local_port ──▶ demux by kind and destination
```

avena-net starts the helpers with the configured `destination`, `event_port`, and `interface`:

```text
acme -E    -D <destination> -t <event_port> -x <interface> -L <tx_local_port>
acme -E -R -D <destination> -p <event_port> -x <interface> -X <proxy_ip> -Y <rx_local_port>
```

## Frame format

Every message on the channel is wrapped in a frame:

| Bytes | Field |
|---|---|
| 4 | magic `A2WG` |
| 1 | version `1` |
| 1 | kind: `1` WireGuard data, `2` discovery, `3` control |
| 16 | source DeviceId |
| 16 | destination DeviceId (all zeros = broadcast) |
| 4 | payload length (big-endian) |
| n | payload |

Received frames addressed to a different DeviceId are dropped. Discovery frames are broadcast.
Control frames carry the same signed [handshake](/docs/concepts/handshake/) packets used over TCP.

## How ACME peers join

1. Each node broadcasts a discovery frame every `announce_interval_ms`.
2. On hearing one, the node with the larger DeviceId sends a control request, and waits up to
   `control_timeout_ms` for the response.
3. Both sides create a per-peer `av-…` tunnel whose WireGuard endpoint is the **local proxy**
   (`proxy_ip:wg_proxy_port`). The proxy maps that peer's tunnel port to its DeviceId, so
   outgoing packets are framed with the right destination.
4. Babel sees the tunnel like any other, so ACME and IP neighbors share one routing domain.

Configuration fields are in the [config reference](/docs/reference/config/). For a
walkthrough, see [Tutorial 5](/docs/tutorials/05-acme/).
