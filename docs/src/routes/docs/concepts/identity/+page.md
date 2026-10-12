---
title: "Identity and addressing"
---

## The device keypair

Every node has one **Ed25519** keypair. On disk it is a 32-byte seed, written with mode `0600`
by `avena-keygen generate` or by the daemon itself.

If `keypair_path` points to a file that doesn't exist, avena-net **generates a new key and
saves it there**. That is convenient for first boot, but a new key won't match an existing
certificate. See [Trust and certificates](/docs/concepts/trust/).

## DeviceId

```text
DeviceId = SHA-256(ed25519_public_key)[0..16]
```

A DeviceId is 16 bytes, written as unpadded, lowercase RFC 4648 base32: 26 characters such
as `k2qxkrr25jgc25yxbstxunjyiy`. Logs, mDNS TXT records, certificates, and static peer
entries all use this form.

## Overlay address

A mesh shares one `/48` ULA prefix (`[network].prefix`, by default `fd00:a0e0:a000::`).
Only `/48` is supported. A device's address takes the first 64 bits of its DeviceId as the
interface identifier, with `1` in the last segment:

```text
prefix  fd00:a0e0:a000::/48
id      56a1 7546 3aea 4c2d …           (DeviceId bytes 0–7)
address fd00:a0e0:a000:56a1:7546:3aea:4c2d:1
```

Why this matters:

- **No coordination.** Any node can compute any peer's address from its DeviceId.
- **Stable.** The address belongs to the key, not to a network. It survives moves, reboots,
  and underlay changes.
- **Checkable.** A peer can't claim someone else's address without that device's private key.

The library also defines **workload addresses**: the same first 64 bits, with
`0x100 + index` in the last segment. That gives each workload on a device its own address
inside the device's space.

## WireGuard key

The WireGuard private key is derived from the device key with HKDF-SHA256 (salt
`avena-wireguard-device-key-v1`, info `wireguard-interface`). It is deterministic: the same
device key always produces the same WireGuard key, and you never manage WireGuard keys
separately.

## Inspecting identities

```bash
avena-keygen from-file /etc/avena/device.key
# device_id=55v3pcfqs4gnd3ybaobsgzk2wy
# overlay_ip=fd00:a0e0:a000:ef6b:b788:b097:cd1:1
```

`avena-keygen` always prints the address for the **default** prefix. If you use a different
prefix, keep the last 80 bits and replace the first 48.
