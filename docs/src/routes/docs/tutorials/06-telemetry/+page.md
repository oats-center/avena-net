---
title: "Tutorial 6: Stream and watch telemetry"
---

**You will learn:** how to publish avena-net events to NATS, how to read them with the `nats`
CLI, and how to open the testbed dashboard.

**You need:** at least one running avena-net node, a [NATS server](https://docs.nats.io/running-a-nats-service/introduction/installation)
the node can reach, and the [`nats` CLI](https://github.com/nats-io/natscli).

## 1. Start NATS

For local experiments, enable JetStream and a WebSocket listener so the dashboard can connect:

```bash
cat > nats.conf <<'EOF'
listen: 0.0.0.0:4222
jetstream: enabled
websocket {
  port: 9222
  no_tls: true
}
EOF
nats-server -c nats.conf
```

## 2. Point avena-net at it

```toml
[telemetry]
publish_nats = true
nats_url = "nats://10.0.0.5:4222"
run_id = "field-trial-1"
node_id = "tractor-07"
babel_snapshot_interval_secs = 5
```

If `nats_url` is unset, avena-net uses the `AVENA_NATS_URL` environment variable. If it can't
connect, it logs a warning and keeps running. Telemetry never stops the overlay.

## 3. Watch events

```bash
nats sub 'avena.v1.field-trial-1.>'
```

You'll see subjects such as:

```text
avena.v1.field-trial-1.node.tractor-07.overlay.peer_discovered
avena.v1.field-trial-1.node.tractor-07.overlay.handshake_started
avena.v1.field-trial-1.node.tractor-07.overlay.peer_connected
avena.v1.field-trial-1.node.tractor-07.routing.babel.routes
avena.v1.field-trial-1.node.tractor-07.routing.babel.neighbors
```

Each message is a JSON envelope:

```json
{
  "v": 1,
  "subject": "avena.v1.field-trial-1.node.tractor-07.overlay.peer_connected",
  "ts_ms": 4210,
  "run_id": "field-trial-1",
  "source": "avena-net",
  "node": "tractor-07",
  "peer": "phoxlu7memyidxhpq3sgcxgkbi",
  "data": { "peer_id": "phoxlu7memyidxhpq3sgcxgkbi", "iface": "av-b06e0342", "direction": "outgoing", "inserted": true }
}
```

`ts_ms` is milliseconds since **that daemon started**, not wall-clock time. The full list is
in the [telemetry reference](/docs/reference/telemetry/).

## 4. Open the dashboard

The SvelteKit dashboard in `testbed/ui/` subscribes to `avena.v1.<run_id>.>` over NATS
WebSocket:

```bash
cd testbed/ui
npm install
npm run dev -- --open
```

Enter `ws://127.0.0.1:9222` and your run ID, then press **Connect Live**. It shows the overlay
peer graph, Babel routes and neighbors, and, for testbed runs, assertions and ns-3 radio
state. **Load JetStream Replay** replays a run that JetStream stored. **Load Demo** shows a
built-in timeline without any server.

## What you learned

- Telemetry is on by default but only publishes once a NATS URL is set, and it never blocks the overlay.
- Subjects are `avena.v1.<run_id>.node.<node_id>.<area>.<event>`.
- The dashboard works live, from JetStream replay, or in demo mode.
