---
title: "Run as a systemd service"
---

The repository ships a unit at `packaging/systemd/avena-net.service`:

```ini
[Unit]
Description=avena-net overlay network
Documentation=https://oats-center.github.io/avena-net/
Wants=network-online.target
After=network-online.target time-sync.target

[Service]
Type=notify
ExecStart=/usr/local/bin/avena-net /etc/avena/avena-net.toml
Environment=RUST_LOG=info
# avena-net cleans up interfaces and stops babeld on SIGINT.
KillSignal=SIGINT
Restart=on-failure
RestartSec=5
RuntimeDirectory=avena
RuntimeDirectoryPreserve=no

[Install]
WantedBy=multi-user.target
```

Why each setting is there:

- **`Type=notify`**: avena-net sends `READY=1` once its interfaces, handshake listener, and
  babeld are up. Units ordered `After=avena-net.service` start only when the overlay is ready.
- **`After=time-sync.target`**: handshakes reject clocks more than 60 s apart, so wait for NTP
  where you can.
- **`RuntimeDirectory=avena`**: creates `/run/avena` for babeld's control socket and state file.
- **`KillSignal=SIGINT`**: avena-net shuts down cleanly on SIGINT. It removes its `av-*` and
  base interfaces, stops babeld and any ACME helpers, and removes its routes. It doesn't
  handle SIGTERM, which is systemd's default stop signal.
- **`Restart=on-failure`**: avena-net exits on fatal errors, such as babeld failing to start, and
  systemd restarts it.

## Install

```bash
sudo curl -fsSL https://raw.githubusercontent.com/oats-center/avena-net/main/packaging/systemd/avena-net.service \
  -o /etc/systemd/system/avena-net.service
sudo systemctl daemon-reload
sudo systemctl enable --now avena-net
journalctl -u avena-net -f
```

## Running dependent services

Services that should only start once the overlay exists:

```ini
[Unit]
Requires=avena-net.service
After=avena-net.service
```

## Logs

Set `Environment=RUST_LOG=debug` in a drop-in for more detail. To quiet the mDNS library:

```bash
sudo systemctl edit avena-net
```

```ini
[Service]
Environment=RUST_LOG=info,mdns_sd=warn
```

## Hardening

avena-net needs `CAP_NET_ADMIN`, and it starts `babeld` and, if used, `wireguard-go` as child
processes that need the same network privileges. Running as root is the tested
configuration. If you restrict capabilities, start from `CAP_NET_ADMIN` and keep `/run/avena`
and `/var/run/wireguard` writable. Keep `/proc/sys/net` writable too, unless you set
`skip_kernel_setup = true` and the sysctls are already set. Test with a full handshake before
rolling out.
