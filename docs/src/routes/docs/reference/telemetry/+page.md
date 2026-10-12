---
title: "Telemetry subjects"
description: "NATS subjects, the envelope schema, and event payloads."
---

Schema version: **1** (`v` field). Background: [Telemetry](/docs/concepts/telemetry/).

## Subjects

| Subject | Payload `data` |
|---|---|
| `avena.v1.<run>.node.<node>.overlay.peer_discovered` | `peer_id`, `locator` |
| `avena.v1.<run>.node.<node>.overlay.handshake_started` | `peer_id`, `direction` (`outgoing`/`incoming`), `locator` |
| `avena.v1.<run>.node.<node>.overlay.peer_connected` | `peer_id`, `iface`, `direction`, `inserted` |
| `avena.v1.<run>.node.<node>.overlay.peer_disconnected` | `peer_id`, `reason` (`peer_lost`/`dead_peer_timeout`) |
| `avena.v1.<run>.node.<node>.routing.babel.routes` | Babel route table snapshot |
| `avena.v1.<run>.node.<node>.routing.babel.neighbors` | Babel neighbor snapshot |

`locator` is a human-readable description: `ip:port` for IP peers, and the underlay and node
name for ACME peers.

## Envelope

| Field | Type | Description |
|---|---|---|
| `v` | int | schema version, `1` |
| `subject` | string | the NATS subject |
| `ts_ms` | int | milliseconds since the publishing daemon started |
| `run_id` | string | sanitized run ID |
| `source` | string | `"avena-net"` |
| `node` | string | sanitized node ID |
| `radio` | string? | copied from `data.radio` if present |
| `peer` | string? | copied from `data.peer` or `data.peer_id` if present |
| `data` | object | event-specific payload |

## Token rules

`run_id` and `node_id` are lowercased. Any run of characters outside `[a-z0-9_-]` becomes one
`-`, and leading and trailing `-` are trimmed. Empty results fall back to `standalone` (run) or
`unknown` (node).

| Input | Token |
|---|---|
| `Field Trial #1` | `field-trial-1` |
| `RSU.047` | `rsu-047` |

## Subscribing

```bash
nats sub 'avena.v1.>'                              # everything
nats sub 'avena.v1.field-trial-1.>'                # one run
nats sub 'avena.v1.*.node.rsu-047.overlay.>'       # one node's overlay events
nats sub 'avena.v1.*.node.*.overlay.peer_disconnected'
```

The testbed also publishes `avena.v1.<run>.ns3.*` (ns-3 driver events) and its own scenario
events under the same run.
