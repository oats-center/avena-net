---
title: "Run in containers"
---

## The image

`ghcr.io/oats-center/avena-net` is built from `packaging/Containerfile`:

- a Rust build stage for `avena-net`;
- a Go build stage for `wireguard-go`;
- a Fedora runtime with `babeld`, `iproute`, `wireguard-tools`, and both binaries.

```text
ENTRYPOINT ["/usr/local/bin/avena-net"]
CMD ["/etc/avena/avena-net.toml"]
```

| Tag | Meaning |
|---|---|
| `latest`, `main` | latest commit on `main` |
| `vX.Y.Z` | a release |
| `sha-…` | a specific commit |

Build locally from the repository root:

```bash
podman build -t localhost/avena-net:latest -f packaging/Containerfile .
```

## Runtime requirements

| Requirement | Why |
|---|---|
| `--cap-add NET_ADMIN` | create interfaces, addresses, routes |
| `--device /dev/net/tun` | `wireguard-go` fallback |
| `/etc/avena` mounted | config, key, certificates |
| `skip_kernel_setup = true` | `/proc/sys` is read-only in the container |
| host sysctls set | forwarding on, redirects off, `rp_filter` off (see below) |

The sysctls avena-net checks for, and logs if missing:

```text
net.ipv6.conf.all.forwarding=1        net.ipv4.conf.all.forwarding=1
net.ipv6.conf.default.forwarding=1    net.ipv4.conf.default.forwarding=1
net.ipv6.conf.all.accept_redirects=0  net.ipv4.conf.all.rp_filter=0
net.ipv6.conf.default.accept_redirects=0  net.ipv4.conf.default.rp_filter=0
```

## Networking mode

| Mode | Use when | Notes |
|---|---|---|
| `--network host` | the node must **accept** connections from peers | all ports work, including the per-peer UDP range. mDNS sees the real LAN |
| bridge + published ports | the node mostly **dials out**, or you want isolation | only published ports are reachable from outside. Per-peer tunnel ports in 20000–59999 aren't, and mDNS stays inside the bridge |

The Quadlet unit in `packaging/quadlet/` uses a bridge and publishes `51820/udp` and
`51821/tcp`. For mesh members that peers must dial, prefer `Network=host`.

## Sidecar pattern

Other containers can share avena-net's network namespace and become reachable on its overlay
address:

```ini
[Container]
Network=avena-net.container
```

Walkthrough: [Tutorial 4](/docs/tutorials/04-container-sidecar/).

## Under Avena

On the [Avena platform](https://oats-center.github.io/avena/), the overlay is a **host service**
network provider, not a privileged container. Avena's agent starts and supervises it.
