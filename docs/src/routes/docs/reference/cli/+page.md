---
title: "Command line"
---

## `avena-net`

```text
avena-net [--help] [--version] [config-path]

Options:
  -h, --help       Show this help message
  -V, --version    Show version information

If config-path is omitted, defaults to /etc/avena/avena-net.toml
```

| Exit code | Meaning |
|---|---|
| `0` | clean shutdown on SIGINT, or `--help`/`--version` |
| `1` | config missing or invalid, initialization failed, or runtime error |
| `2` | unknown option or too many arguments |

Environment: `RUST_LOG` (log filter), `AVENA_NATS_URL`, `AVENA_RUN_ID`. See
[telemetry](/docs/reference/telemetry/). The daemon sends systemd `READY=1` and `STATUS=` updates
when `NOTIFY_SOCKET` is set.

:::caution[Important]
Only **SIGINT** triggers a clean shutdown that removes interfaces and stops babeld. Under
systemd, set `KillSignal=SIGINT`, as the [shipped unit](/docs/guides/systemd/) does.
:::

## `avena-keygen`

```text
avena-keygen generate [output-file]
avena-keygen from-seed <64-char-hex>
avena-keygen from-file <keypair-file>
avena-keygen cert init-ca <keypair-file> <output-jwt>
avena-keygen cert issue <issuer-key> <issuer-jwt> <subject-key> <output-cert> [--days=N]
avena-keygen cert show <jwt-file>
```

| Command | Does |
|---|---|
| `generate [file]` | new random keypair, written to `file` if given. Prints `device_id=` and `overlay_ip=` |
| `from-seed <hex>` | deterministic keypair from a 32-byte hex seed. Prints its identity |
| `from-file <file>` | prints the identity of an existing keypair file |
| `cert init-ca <key> <out>` | self-signed root certificate, valid 3650 days |
| `cert issue … [--days=N]` | device certificate signed by the issuer, valid `N` days (default 365) |
| `cert show <jwt>` | prints `sub`, `iss`, `iat`, `exp`, and whether it is self-signed |

`overlay_ip` is always computed for the default prefix `fd00:a0e0:a000::/48`. Informational
messages go to stderr, and `key=value` identity lines go to stdout, so
`avena-keygen generate x.key > x.meta` captures just the identity.

## `avena-testbed`

```text
avena-testbed [OPTIONS] <COMMAND>

Commands:
  run       Run a test scenario
  validate  Validate a scenario file syntax and semantics
  examples  List bundled example scenarios

Options:
  -v, --verbose  Enable verbose output (shows tracing logs)
```

```text
avena-testbed run [OPTIONS] <SCENARIO>

  -o, --output <OUTPUT>  Output path for metrics jsonl [default: /tmp/avena-metrics.jsonl]
      --keep-namespaces  Keep namespaces after test (for debugging)
```

Node logs (`<node>.stdout.log`, `<node>.stderr.log`) are written to the same directory as
`--output`. The exit status is non-zero when any assertion fails or setup fails.
