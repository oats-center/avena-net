# avena-testbed

Test harness for running multi-node `avena-net` networks on one Linux host.

Each scenario node runs a real `avena-net` daemon in its own network namespace. Links are emulated with `netem` by default. The testbed builds the topology and runs a timeline of events: disconnecting, reconnecting, or modifying links, and stopping nodes. It checks assertions (nodes connected, ping, peer count) and writes metrics to JSONL. With the `ns3` backend, an ns-3 process drives the wireless links and node mobility instead.

```text
testbed/
├── src/          avena-testbed crate (scenario runner, topology, links, metrics, telemetry bus)
├── scenarios/    bundled scenario TOML files
├── ns3-driver/   ns-3 C++ driver for wireless/mobility scenarios
└── ui/           SvelteKit dashboard for live and replayed telemetry
```

## Running a Scenario

```bash
cargo build --bin avena-net --bin avena-testbed
target/debug/avena-testbed run testbed/scenarios/two_node_basic.toml
```

Other commands:

```bash
avena-testbed validate testbed/scenarios/linear_three_hop.toml   # check a scenario file
avena-testbed examples                                           # list bundled scenarios
avena-testbed run <scenario> --keep-namespaces                   # keep namespaces for debugging
avena-testbed run <scenario> -o /tmp/run-metrics.jsonl           # metrics output path
```

Run as a normal user and the testbed re-executes itself inside a user namespace, or run it as root. Scenarios need `babeld`, `ip`, and WireGuard (kernel module or `wireguard-go`) on the host.

## ns-3 Scenarios

Scenarios ending in `_ns3.toml` run their radio links through ns-3. To build the driver and point the testbed at it, see [`ns3-driver/README.md`](ns3-driver/README.md).

## Telemetry and UI

When telemetry is enabled in the scenario (`[emulation.telemetry]`, with `AVENA_NATS_URL` as a fallback URL), the testbed and every overlay node publish to `avena.v1.<run_id>.>`. The dashboard in [`ui/`](ui/README.md) subscribes over NATS WebSocket and shows node motion, the overlay peer graph, Babel routes, and assertion results.
