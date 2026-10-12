---
title: "Install"
description: "Install avena-net from a release, a container image, or source."
---

avena-net runs on Linux. Every install method needs:

- **root or `CAP_NET_ADMIN`**, to create interfaces and routes;
- **`babeld`**, which avena-net starts and drives itself;
- **WireGuard**: the kernel module, plus `wireguard-go` as a userspace fallback (recommended).

## Host packages

<Tabs activeName="Debian / Ubuntu">
<TabPanel name="Debian / Ubuntu">

```bash
sudo apt-get install -y babeld wireguard-tools
sudo apt-get install -y wireguard-go     # optional userspace fallback
```

</TabPanel>
<TabPanel name="Fedora">

```bash
sudo dnf install -y babeld wireguard-tools
```

For a userspace fallback, build `wireguard-go` from
[source](https://git.zx2c4.com/wireguard-go/) and put it on `PATH`.

</TabPanel>
</Tabs>

avena-net looks for `babeld` at `/usr/sbin/babeld` by default. Set
[`routing.babel.binary_path`](/docs/reference/config/) if yours is elsewhere. It
finds `wireguard-go` on `PATH`.

## Release binary

Tagged releases publish `x86_64` and `aarch64` Linux builds of the daemon:

```bash
curl -LO https://github.com/oats-center/avena-net/releases/latest/download/avena-net-x86_64-unknown-linux-gnu.tar.gz
tar -xzf avena-net-x86_64-unknown-linux-gnu.tar.gz
sudo install -m 0755 avena-net /usr/local/bin/avena-net
avena-net --version
```

Use `avena-net-aarch64-unknown-linux-gnu.tar.gz` on 64-bit ARM, such as a Raspberry Pi 4/5.

:::note[Note]
Release archives contain only the daemon. You need `avena-keygen` on the machine where you
create certificates, usually an admin workstation, not the devices:

```bash
cargo install --git https://github.com/oats-center/avena-net avena-net --bin avena-keygen
```
:::

## Container image

Images are published to GHCR for every push to `main` (`:main`, `:latest`) and every release tag:

```bash
podman pull ghcr.io/oats-center/avena-net:latest
```

The image includes `babeld`, `wireguard-tools`, and `wireguard-go`. See
[Run in containers](/docs/guides/containers/) for the capabilities and sysctls it needs.

## From source

```bash
git clone https://github.com/oats-center/avena-net
cd avena-net
cargo build --release --bin avena-net --bin avena-keygen
sudo install -m 0755 target/release/avena-net target/release/avena-keygen /usr/local/bin/
```

To cross-compile for ARM:

```bash
cargo install cross --git https://github.com/cross-rs/cross
cross build --release --target aarch64-unknown-linux-gnu --bin avena-net
```

## Next

- No spare machines? Try the [Quickstart](/docs/getting-started/quickstart/) on one host.
- Ready for hardware? [Your first mesh on real hosts](/docs/getting-started/physical-hosts/).
