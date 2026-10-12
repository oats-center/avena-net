---
title: avena-net
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

<div class="family-page">

<Hero />

<Section eyebrow="Features" title="What avena-net does" lede="avena-net assigns each device a fixed overlay IPv6 address, authenticates peers against your certificate authority, and routes between them over WireGuard tunnels. It needs no central coordinator, so it keeps working on networks without an uplink.">
<Bento />
</Section>

<Section eyebrow="Architecture" title="Components" lede="One avena-net process per machine handles identity, discovery, authentication, tunnels, and routing. It manages babeld and WireGuard, which are installed separately." link={{ to: '/docs/concepts/architecture/', label: 'Explore the architecture' }}>
<Stack />
</Section>

<Section split eyebrow="Configuration" title="Configuration file" lede="Each node has one TOML file with its key, certificate, overlay prefix, and the interfaces used for discovery. Static peers and C-V2X (ACME) radios are configured in additional sections." link={{ to: '/docs/reference/config/', label: 'Configuration reference' }}>
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

<Section eyebrow="Peer setup" title="From discovery to route" lede="Discovery only provides a candidate endpoint. A tunnel is created only after the peer completes a signed, time-bounded handshake that is checked against your root certificate." link={{ to: '/docs/concepts/handshake/', label: 'Handshake design' }}>
<PeerFlow />
</Section>

<Section split eyebrow="Testing" title="Testbed" lede="avena-testbed runs avena-net daemons in Linux network namespaces, applies scripted link changes, and checks pings and peer counts at set times. Without root, it runs inside a user namespace." link={{ to: '/docs/tutorials/02-failover/', label: 'Failover tutorial' }}>
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

<Section eyebrow="Use cases" title="Typical deployments" lede="The same daemon and configuration format are used as a host service or a container sidecar, on any Linux host. The Avena platform runs it as a host service.">
<UseCases />
</Section>

<Closing />

</div>
