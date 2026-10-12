---
title: "Development and testing"
---

## Build

```bash
cargo build --workspace          # avena-net, avena-keygen, avena-testbed
cargo clippy --workspace         # pedantic + cargo lints are enabled workspace-wide
```

## Unit and integration tests

```bash
cargo test --workspace
```

Tests that need privileges or a real network are `#[ignore]`d. Run them explicitly:

```bash
sudo -E cargo test -- --ignored
```

| Ignored test group | Needs |
|---|---|
| kernel tunnel tests (`src/tunnel/kernel.rs`) | `CAP_NET_ADMIN`, WireGuard kernel module |
| userspace tunnel tests (`src/tunnel/userspace.rs`) | `CAP_NET_ADMIN`, `wireguard-go` |
| mDNS discovery test (`tests/discovery_integration.rs`) | a network that allows multicast |

`tests/sudoers.d/avena-test` is an optional sudoers drop-in that lets test cleanup commands
run without a password prompt.

## End-to-end

`tests/scripts/two_node_test.sh` starts two userspace-backed nodes on one host with mDNS
discovery.

For anything bigger, use the testbed. These are the scenarios worth running before a change
lands:

```bash
for s in two_node_basic linear_three_hop star_gateway dual_underlay_failover; do
  ./target/debug/avena-testbed run testbed/scenarios/$s.toml -o /tmp/$s.jsonl || break
done
```

## Docs site

The site is in `docs/` and uses [Sveltepress](https://sveltepress.site):

```bash
cd docs
npm install
npm run dev        # http://localhost:5173/avena-net/
npm run build      # static output in docs/dist
```

Pages are Markdown under `docs/src/routes/docs/**/+page.md`, and the sidebar is
`docs/sidebar.json`. The landing page components are in `docs/src/lib/landing/`. Pushes to
`main` that touch `docs/` deploy to GitHub Pages.

## Planning

Active work and known gaps are tracked in `plans/`:

- `plans/layer1-active-roadmap.md`: current roadmap;
- `plans/tech-debt.md`: known debt, including **TD-005** (Babel control plane over WireGuard).
