---
title: "Simulate radios with ns-3"
---

With `backend = "ns3"`, the testbed connects each node's radios to an
[ns-3](https://www.nsnam.org/) simulation instead of `netem` veths. ns-3 then models the Wi-Fi
PHY/MAC, propagation, and node mobility in real time, while real `avena-net` daemons run on
top.

## How it fits together

```text
avena-net (netns) ── TAP ── ns-3 TapBridge ── simulated Wi-Fi ── TapBridge ── TAP ── avena-net (netns)
                                    ▲
                     avena-ns3-driver (RealtimeSimulatorImpl)
                     emits JSON lines → testbed → NATS avena.v1.<run_id>.ns3.*
```

The driver (`testbed/ns3-driver/avena-ns3-driver.cc`) reads the JSON config the testbed generates.
It creates one ns-3 node per testbed node, installs mobility from a fixed position or a trace
file, builds Wi-Fi networks for `links` and `bridges`, and attaches each radio to a Linux TAP.

## Build the driver

Dependencies: an ns-3 tree with `core`, `network`, `mobility`, `wifi`, `tap-bridge`, and
`spectrum`. You also need a C++17 compiler and `nlohmann/json.hpp`
(`apt-get install nlohmann-json3-dev` on Debian/Ubuntu).

```bash
cp testbed/ns3-driver/avena-ns3-driver.cc "$NS3_ROOT"/scratch/
(cd "$NS3_ROOT" && ./ns3 build)

chmod +x testbed/ns3-driver/avena-ns3-driver.sh
export AVENA_NS3_ROOT="$NS3_ROOT"
export AVENA_NS3_DRIVER_BIN="$PWD/testbed/ns3-driver/avena-ns3-driver.sh"
```

You can also set `[emulation.ns3].driver_bin` in a scenario instead of `AVENA_NS3_DRIVER_BIN`.

## Write an ns-3 scenario

```toml
name = "two-node-basic-ns3"
duration_secs = 30

[emulation]
backend = "ns3"

[emulation.ns3]
realtime_hard_limit_ms = 250      # fail if the simulator falls this far behind wall clock

[emulation.ns3.radio_profiles.default_wifi]
kind = "wifi"
phy_backend = "spectrum"
standard = "802.11n"
band = "5ghz"
channel_width_mhz = 20
tx_power_dbm = 18
rx_noise_figure_db = 7
propagation = "log-distance"

[[nodes]]
id = "nodeA"
position = { x_m = 0.0, y_m = 0.0, z_m = 0.0 }
radio_profile = "default_wifi"
```

Nodes can instead have several `[[nodes.radios]]`, each with its own profile, for multi-radio
devices. They can also use `mobility_trace` to follow a recorded path. See
`testbed/scenarios/*_ns3.toml` and the [scenario reference](/docs/reference/scenario/#ns-3).

## Driver events

The driver writes newline-delimited JSON to stdout, which the testbed republishes:

```json
{"type":"realtime","sim_ms":1000,"wall_ms":1003,"lag_ms":3}
{"type":"mobility","node":"nodeA","x_m":12.5,"y_m":0.0,"z_m":0.0}
{"type":"l2","event":"l2_ready","node":"nodeA","radio":"wifi0"}
```

Subjects are `avena.v1.<run_id>.ns3.*`. The [dashboard](/docs/tutorials/06-telemetry/) draws node
motion and radio state from them.
