---
title: "Handshake"
---

The handshake turns a discovered peer into a configured WireGuard peer. It authenticates both
sides, exchanges WireGuard keys and listen ports, and derives a per-pair preshared key.

## Transport

| Peer type | Transport |
|---|---|
| IP (mDNS, static) | TCP to the peer's announced port **+ 1** (default `51821`) |
| ACME | `Control` frames over the radio, through the ACME runtime |

On the wire, each side sends one packet: the magic `AVHS`, version `1`, the sender's Ed25519
public key, a 4-byte big-endian length, and a JSON `HandshakeMessage`. Messages are capped at 8 KiB.

## The message

| Field | Purpose |
|---|---|
| `ephemeral_pubkey` | fresh X25519 key for this handshake |
| `nonce` | 32 random bytes |
| `timestamp_secs` | sender's Unix time |
| `wg_pubkey` | sender's WireGuard public key |
| `wg_listen_port` | UDP port of the sender's tunnel interface for this peer |
| `signature` | Ed25519 over `ephemeral ‖ nonce ‖ timestamp ‖ receiver DeviceId ‖ wg_pubkey ‖ wg_listen_port` |
| `device_cert` | sender's certificate (JWT) |

Including the **receiver's** DeviceId in the signed data binds each message to one intended
peer, so it can't be replayed to someone else.

## Verification

The receiver rejects the handshake if any of these fail:

1. the signature is valid for the sender's public key;
2. the timestamp is within **±60 seconds** of local time;
3. the `(DeviceId, nonce)` pair hasn't been seen in the last 70 seconds (replay cache);
4. the certificate is valid, issued by the root, and names the sender's DeviceId.

:::caution[Important]
Clocks matter. Nodes whose clocks differ by more than 60 seconds can't handshake. Run NTP, or
use GNSS time on field devices.
:::

## Keys

Both sides compute an X25519 shared secret from the ephemeral keys and derive a WireGuard
**preshared key** with HKDF-SHA256 (salt `avena-session-keys-v1`, info `wireguard-psk`). The
peer is then added to the tunnel with:

- its WireGuard public key, which is stable and derived from its device key;
- the PSK, which is fresh for every handshake;
- endpoint = the peer's underlay IP and its `wg_listen_port` (or the local ACME proxy);
- `AllowedIPs = ::/0` (routing, not AllowedIPs, decides what goes where);
- `persistent_keepalive` from the config.

## Abuse limits

| Limit | Value |
|---|---|
| Handshake timeout | 10 s |
| Concurrent incoming handshakes | 32 |
| Incoming handshakes per source IP | 5 per 60 s |
| Concurrent outgoing handshakes | 16 |
