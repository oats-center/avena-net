---
title: "Tutorial 4: Run as a container sidecar"
---

**You will learn:** how to run avena-net under Podman and systemd Quadlet, and how to put
another service, here a NATS server, into its network namespace.

**You need:** a Linux host with Podman 4.4+ (for Quadlet), root, and credentials in `/etc/avena/`
as in [Your first mesh on real hosts](/docs/getting-started/physical-hosts/).

## 1. Prepare the host

Inside a container, `/proc/sys` is read-only, so babeld can't set its own sysctls. Set them on
the host:

```bash
sudo tee /etc/sysctl.d/90-avena-net.conf <<'EOF'
net.ipv6.conf.all.forwarding = 1
net.ipv6.conf.default.forwarding = 1
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0
net.ipv4.conf.all.forwarding = 1
net.ipv4.conf.default.forwarding = 1
net.ipv4.conf.all.rp_filter = 0
net.ipv4.conf.default.rp_filter = 0
EOF
sudo sysctl --system
```

## 2. Configure avena-net for a container

In `/etc/avena/avena-net.toml`, tell babeld not to touch kernel settings:

```toml
[routing.babel]
skip_kernel_setup = true
```

At startup avena-net checks those eight sysctls and logs any that are missing.

## 3. Install the Quadlet unit

```bash
sudo install -d /etc/containers/systemd
sudo curl -fsSL https://raw.githubusercontent.com/oats-center/avena-net/main/packaging/quadlet/avena-net.container \
  -o /etc/containers/systemd/avena-net.container
sudo sed -i 's#Image=localhost/avena-net:latest#Image=ghcr.io/oats-center/avena-net:latest#' \
  /etc/containers/systemd/avena-net.container
```

The unit, `packaging/quadlet/avena-net.container`:

```ini
[Unit]
Description=avena-net overlay sidecar

[Container]
Image=ghcr.io/oats-center/avena-net:latest
ContainerName=avena-net
Network=bridge
Volume=/etc/avena:/etc/avena:Z
PublishPort=51820:51820/udp
PublishPort=51821:51821/tcp
AddCapability=NET_ADMIN
AddDevice=/dev/net/tun
Notify=true
Environment=RUST_LOG=info

[Service]
Restart=always

[Install]
WantedBy=default.target
```

`Notify=true` makes systemd wait for avena-net's `READY=1`. `/dev/net/tun` is there for
`wireguard-go`, which the image falls back to when kernel WireGuard isn't available.

## 4. Add a service in the same network namespace

```bash
sudo tee /etc/containers/systemd/avena-nats.container <<'EOF'
[Unit]
Description=NATS using avena-net network namespace

[Container]
Image=docker.io/library/nats:latest
ContainerName=avena-nats
Network=avena-net.container
PublishPort=4222:4222/tcp

[Service]
Restart=always

[Install]
WantedBy=default.target
EOF
```

`Network=avena-net.container` joins the avena-net container's network namespace, so NATS is
reachable on this node's overlay address.

## 5. Start and check

```bash
sudo systemctl daemon-reload
sudo systemctl start avena-net.service avena-nats.service
sudo podman logs -f avena-net
```

From another overlay node:

```bash
nc -vz <this node's overlay_ip> 4222
```

:::caution[Important]
The unit publishes only `51820/udp` and `51821/tcp`. Per-peer tunnels listen on other UDP
ports in `20000–59999`, so peers that have to *reach* this node through bridge NAT may not
connect. If peers can't connect, run the container with `Network=host` instead. See
[Run in containers](/docs/guides/containers/).
:::

## What you learned

- Containers need `skip_kernel_setup = true` and host-side sysctls.
- `Notify=true` gives you real readiness.
- Sibling containers share the overlay through `Network=avena-net.container`.

Next: [Tutorial 5: Mix IP and C-V2X](/docs/tutorials/05-acme/).
