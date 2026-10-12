---
title: "Scenario files"
description: "The avena-testbed scenario TOML format."
---

## Top level

| Field | Required | Description |
|---|---|---|
| `name` | yes | scenario name, used in output |
| `description` | no | free text |
| `duration_secs` | yes | maximum timeline length |
| `[emulation]` | no | backend and telemetry (below) |
| `[[nodes]]` | yes | one per avena-net instance |
| `[[links]]` | no | point-to-point links |
| `[[bridges]]` | no | shared segments joining several nodes |
| `[[events]]` | no | timeline actions |
| `[[assertions]]` | no | timeline checks |

## `[emulation]`

| Field | Default | Description |
|---|---|---|
| `backend` | `"netem"` | `"netem"` (veth + tc netem) or `"ns3"` |
| `telemetry.publish_nats` | `true` | publish testbed and node telemetry |
| `telemetry.nats_url` | none | NATS URL. Falls back to `$AVENA_NATS_URL`. Telemetry is off if neither is set |

### ns-3

`[emulation.ns3]`, used when `backend = "ns3"`:

| Field | Default | Description |
|---|---|---|
| `realtime_hard_limit_ms` | `250` | fail the run if the simulator lags wall-clock by more than this |
| `emit_pcap` | `false` | write pcaps from ns-3 |
| `driver_bin` | none | driver path. Falls back to `$AVENA_NS3_DRIVER_BIN` |
| `driver_args` | `[]` | extra driver arguments |
| `ready_timeout_secs` | `10` | how long to wait for L2 readiness |
| `radio_profiles.<name>` | | named radio profiles (below) |

Radio profile fields, all optional: `kind`, `phy_backend`, `standard`, `band`, `channel`,
`channel_width_mhz`, `tx_power_dbm`, `rx_noise_figure_db`, `propagation`.

## `[[nodes]]`

| Field | Description |
|---|---|
| `id` | unique node name |
| `capabilities` | list of strings (informational) |
| `start_delay_secs` | start this node later than the others |
| `position` | `{ x_m, y_m, z_m }` (ns-3) |
| `mobility_trace` | path to a mobility trace (ns-3) |
| `radio_profile` | default profile for this node's radios (ns-3) |
| `[[nodes.radios]]` | per-radio `id`, `profile`, and any radio profile field overrides (ns-3) |

## `[[links]]`

| Field | Default | Description |
|---|---|---|
| `id` | `"<a>-<b>"` | name used by events |
| `endpoints` | required | two node IDs |
| `latency_ms` | required | one-way delay |
| `bandwidth_kbps` | required | rate limit |
| `loss_percent` | `0.0` | random loss |
| `enabled` | `true` | start disconnected if `false` |
| `medium` | none | radio medium/profile (ns-3) |

## `[[bridges]]`

| Field | Default | Description |
|---|---|---|
| `id` | required | name |
| `nodes` (or `members`) | required | node IDs on the segment |
| `latency_ms` | `0` | delay |
| `bandwidth_kbps` | `1000000` | rate limit |
| `loss_percent` | `0.0` | loss |
| `medium` | none | radio medium/profile (ns-3) |

## `[[events]]`

```toml
[[events]]
at_secs = 30.0
action = { type = "DisconnectLink", link = "ab-wifi" }
```

| `type` | Fields |
|---|---|
| `DisconnectLink` | `link` |
| `ConnectLink` | `link` |
| `ModifyLink` | `link`, optional `latency_ms`, optional `loss_percent` |
| `StopNode` | `node` |
| `StartNode` | `node` |

## `[[assertions]]`

```toml
[[assertions]]
at_secs = 20.0
condition = { type = "Ping", from = "nodeA", to = "nodeC", timeout_ms = 2000 }
```

| `type` | Fields | Passes when |
|---|---|---|
| `NodesConnected` | `nodes` (list) | the listed nodes can reach each other over the overlay |
| `Ping` | `from`, `to`, `timeout_ms` | `from` can ping `to`'s overlay address |
| `PeerCount` | `node`, `count` | `node` has `count` connected peers |
| `TunnelInterfaceCount` | `node`, `count` | `node` has exactly `count` `av-*` interfaces |

## Metrics output

`avena-testbed run -o <file>` writes JSON lines:

| `event_type` | `data` |
|---|---|
| `scenario_started` | `name` |
| `node_started` | `overlay_ip` (plus `node`) |
| `link_changed` | `link`, `enabled` |
| `assertion_result` | `at_secs`, `condition`, `passed` |
| `convergence_metric` | `metric`, `from`, `to`, `link`, `value_ms`, … |
| `scenario_completed` | `duration_secs`, `passed` |

Every line has `timestamp_ms`, counted from the start of the scenario.
