---
title: "Telemetry"
---

avena-net can publish what it's doing to [NATS](https://nats.io) as JSON. Use it for live
dashboards, for experiment logs, and for correlating events across nodes. Telemetry is optional:
without NATS, the overlay works the same.

## When it publishes

| `publish_nats` | URL available? | Result |
|---|---|---|
| unset (default) | `nats_url` or `$AVENA_NATS_URL` | connects at startup and publishes |
| unset (default) | neither | nothing is published, nothing logged |
| `true` | yes | connects at startup and publishes |
| `true` | neither | warning logged, nothing published |
| unset or `true` | yes, but unreachable | warning logged, nothing published |
| `false` | any | nothing is published |

Telemetry never stops the overlay. It connects once, at startup, so a server that comes up
later isn't picked up until the daemon restarts.

## Subjects

```text
avena.v1.<run_id>.node.<node_id>.overlay.<event>
avena.v1.<run_id>.node.<node_id>.routing.babel.<topic>
```

- `run_id`: `telemetry.run_id`, else `$AVENA_RUN_ID`, else `standalone`.
- `node_id`: `telemetry.node_id`, else the DeviceId.

Both are sanitized into a valid subject token: lowercased, with characters other than letters,
digits, `-`, and `_` replaced by `-`.

| Area | Event / topic | When |
|---|---|---|
| overlay | `peer_discovered` | a discovery method reported a peer |
| overlay | `handshake_started` | a handshake began (`direction`: `outgoing` / `incoming`) |
| overlay | `peer_connected` | a tunnel was configured (`inserted`: new vs refreshed) |
| overlay | `peer_disconnected` | a tunnel was removed (`reason`: `peer_lost` / `dead_peer_timeout`) |
| routing.babel | `routes` | periodic dump of Babel's routes |
| routing.babel | `neighbors` | periodic dump of Babel's neighbors |

## Envelope

```json
{
  "v": 1,
  "subject": "avena.v1.standalone.node.tractor-07.overlay.peer_connected",
  "ts_ms": 4210,
  "run_id": "standalone",
  "source": "avena-net",
  "node": "tractor-07",
  "peer": "phoxlu7memyidxhpq3sgcxgkbi",
  "data": { "peer_id": "phoxlu7memyidxhpq3sgcxgkbi", "iface": "av-b06e0342", "direction": "outgoing", "inserted": true }
}
```

`ts_ms` counts milliseconds from daemon start. `peer` and `radio` are copied from `data` when
present, to make filtering easier.

## The testbed uses the same subjects

The testbed publishes its own events (scenario progress, assertions, ns-3 radio and mobility)
under the same `avena.v1.<run_id>.>` tree, and configures every node it starts to publish there
too. One subscription sees the whole experiment. See [Tutorial 6](/docs/tutorials/06-telemetry/).
