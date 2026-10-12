---
title: "Releases"
---

## What a release publishes

Pushing a tag `vX.Y.Z` runs two workflows:

| Workflow | Publishes |
|---|---|
| Release binaries | `avena-net-x86_64-unknown-linux-gnu.tar.gz`, `avena-net-aarch64-unknown-linux-gnu.tar.gz` on the GitHub release |
| Publish container | `ghcr.io/oats-center/avena-net:vX.Y.Z` |

Pushes to `main` also publish container images (`:main`, `:latest`, `:sha-…`), but they don't
create a GitHub release.

## Versioning

avena-net is pre-1.0. Minor versions may change configuration fields, the handshake wire
format, telemetry payloads, and the library API. Check the release notes before upgrading a
mesh, and upgrade all nodes together when the handshake changes.

## History

| Version | Notes |
|---|---|
| 0.2.0 | released as `avena-overlay`. Container readiness (`sd_notify`), container-safe startup, ACME helper shutdown, Linux release binaries |
| unreleased | renamed to **avena-net** (binary, crate, image, default config path `/etc/avena/avena-net.toml`). `--help`/`--version` |

The rename means:

| Before | After |
|---|---|
| `avena-overlay` binary | `avena-net` |
| `/etc/avena/avena-overlay.toml` | `/etc/avena/avena-net.toml` |
| `ghcr.io/oats-center/avena-overlay` | `ghcr.io/oats-center/avena-net` |
| `RUST_LOG=avena_overlay=…` | `RUST_LOG=avena_net=…` |
