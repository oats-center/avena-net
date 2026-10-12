---
title: "Repository layout"
---

[github.com/oats-center/avena-net](https://github.com/oats-center/avena-net) is a Cargo workspace.
The root package is `avena-net`.

```text
Cargo.toml          avena-net package + workspace (member: testbed)
src/                library modules and binaries
  bin/avena_net.rs    the daemon
  bin/avena_keygen.rs credentials tool
tests/              integration tests, two-node script, sudoers helper
examples/           example configurations (mixed IP + ACME)
packaging/
  Containerfile       container image
  quadlet/            Podman Quadlet units (overlay sidecar, NATS example)
  systemd/            host service unit
testbed/            avena-testbed crate
  scenarios/          bundled scenario files
  ns3-driver/         ns-3 C++ driver
  ui/                 SvelteKit telemetry dashboard
docs/               this website (Sveltepress)
plans/              roadmap, tech debt, design records
.github/workflows/  CI: container, release binaries, docs site
```

## Relationship to Avena

[Avena](https://github.com/oats-center/avena) is the OATS edge platform: bootc images, a
reconciling agent, and the Trellis control plane. avena-net is its overlay **network provider**.
It runs as a host service that Avena flavors can turn on. avena-net doesn't depend on Avena, and
works on any Linux host.
