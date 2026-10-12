---
title: An encrypted mesh for machines in the field
description: avena-net gives every device a permanent, encrypted IPv6 address derived from its identity, finds neighbors on its own, and routes across WireGuard tunnels with Babel.
layout: false
---

<script>
  import Hero from '#lib/landing/Hero.svelte'
  import Section from '#lib/landing/Section.svelte'
  import Bento from '#lib/landing/Bento.svelte'
  import Stack from '#lib/landing/Stack.svelte'
  import PeerFlow from '#lib/landing/PeerFlow.svelte'
  import UseCases from '#lib/landing/UseCases.svelte'
  import Closing from '#lib/landing/Closing.svelte'
</script>

<div class="avena-landing">

<Hero />

<Section eyebrow="Why avena-net" title="Networking for machines that don’t sit still" lede="Field equipment changes networks all the time and often has no uplink. avena-net gives each device an address that never changes and a mesh that rebuilds itself, without a central coordinator.">
<Bento />
</Section>

<Section eyebrow="How it works" title="Five layers, one daemon" lede="One avena-net process on each machine handles identity, discovery, authentication, tunnels, and routing. You install babeld and WireGuard, and avena-net drives them." link={{ to: '/docs/concepts/architecture/', label: 'Explore the architecture' }}>
<Stack />
</Section>

<Section split eyebrow="Configuration" title="One small file per node" lede="Point it at a key and a certificate, pick the interfaces to discover peers on, and start it. Static peers and C-V2X radios are a few more lines." link={{ to: '/docs/reference/config/', label: 'Configuration reference' }}>
<Tabs activeName="avena-net.toml">
<TabPanel name="avena-net.toml">

```toml
interface_name = "avena0"
listen_port = 51820            # handshake uses 51821/tcp
tunnel_mode = "prefer_kernel"

keypair_path      = "/etc/avena/device.key"
trusted_root_cert = "/etc/avena/root.cert"
device_cert       = "/etc/avena/device.cert"

[network]
prefix = "fd00:a0e0:a000::"    # same /48 on every node
prefix_len = 48

[discovery]
enable_mdns = true
mdns_interfaces = ["eth0"]

[telemetry]
publish_nats = false
```

</TabPanel>
<TabPanel name="Static peers">

```toml
# Reach a node mDNS can't see: another subnet, a VPN, or the internet.
[[discovery.static_peers]]
device_id = "phoxlu7memyidxhpq3sgcxgkbi"
endpoint  = "203.0.113.10:51820"

[[discovery.static_peers]]
device_id = "ehxe3hakycmekcpbe64vxheymu"
endpoint  = "gateway.example.net:51820"
```

</TabPanel>
<TabPanel name="C-V2X (ACME)">

```toml
# Add a shared-medium radio underlay next to normal IP.
[telemetry]
node_id = "rsu-047"

[acme]
interface   = "cv2x0"
binary_path = "/usr/local/bin/acme"
event_port  = 9000      # must match on every ACME node
```

</TabPanel>
</Tabs>
</Section>

<Section eyebrow="From stranger to neighbor" title="Nothing gets a tunnel without proving itself" lede="Discovery only says where a device might be. Every peer still has to pass a signed, time-bounded handshake checked against your root certificate before any interface is created." link={{ to: '/docs/concepts/handshake/', label: 'Read the handshake design' }}>
<PeerFlow />
</Section>

<Section split eyebrow="Test before you deploy" title="Break links on purpose" lede="The testbed runs real avena-net daemons in Linux network namespaces. It scripts link failures and checks pings and peer counts as the scenario runs. Without root it runs in a user namespace." link={{ to: '/docs/tutorials/02-failover/', label: 'Walk through a failover' }}>
<Tabs activeName="scenario.toml">
<TabPanel name="scenario.toml">

```toml
name = "dual-underlay-failover"
duration_secs = 95

[[nodes]]
id = "nodeA"
[[nodes]]
id = "nodeB"

[[links]]
id = "ab-wifi"
endpoints = ["nodeA", "nodeB"]
latency_ms = 5
bandwidth_kbps = 100000

[[links]]
id = "ab-cell"
endpoints = ["nodeA", "nodeB"]
latency_ms = 50
bandwidth_kbps = 10000
loss_percent = 2.0

[[events]]
at_secs = 30.0
action = { type = "DisconnectLink", link = "ab-wifi" }

[[assertions]]
at_secs = 40.0
condition = { type = "Ping", from = "nodeA", to = "nodeB", timeout_ms = 5000 }
```

</TabPanel>
<TabPanel name="Run it">

```console
$ avena-testbed run testbed/scenarios/dual_underlay_failover.toml
Running scenario: dual-underlay-failover
Generating PKI... done (0.0s)
Setting up network topology... done (0.0s)
Starting 2 nodes... 2 running (0.2s)
Running timeline (95s, 4 events, 8 assertions)... done (85.0s)
Cleaning up... done (0.2s)

✓ Scenario passed
  Assertions: 8/8 passed
  Events executed: 4
```

</TabPanel>
</Tabs>
</Section>

<Section eyebrow="Built for the field" title="One mesh, many deployments" lede="Use the same daemon and configuration format whether you deploy it as a host service, a container sidecar, or under the Avena platform.">
<UseCases />
</Section>

<Closing />

</div>
