---
title: "Rust library"
description: "Use avena-net's identity, addressing, certificate, and tunnel code from Rust."
---

The `avena-net` crate is a library as well as a daemon. Add it from git:

```toml
[dependencies]
avena-net = { git = "https://github.com/oats-center/avena-net" }
```

The crate name in Rust code is `avena_net`.

## Identity and addressing

```rust
use avena_net::{DeviceKeypair, NetworkConfig};

let device = DeviceKeypair::generate();
let id = device.device_id();                 // DeviceId, Display = base32

let net = NetworkConfig::default_ula();       // fd00:a0e0:a000::/48
let addr = net.device_address(&id);           // …:1
let workload = net.workload_address(&id, 3);  // …:103
```

## Certificates

```rust
use avena_net::{create_self_signed_jwt, issue_jwt, CertValidator, DeviceKeypair};

let root = DeviceKeypair::generate();
let root_jwt = create_self_signed_jwt(&root, 3650);

let device = DeviceKeypair::generate();
let device_jwt = issue_jwt(&root, device.device_id(), device.public_key(), 365);

let validator = CertValidator::new(&root_jwt)?;
validator.validate_cert_for_device(&device_jwt, &device.device_id())?;
```

## Handshake primitives

```rust
use avena_net::{derive_wireguard_keypair, DeviceKeypair, EphemeralKeypair, HandshakeMessage};

let peer_id = DeviceKeypair::generate().device_id();
let wg = derive_wireguard_keypair(&device);   // stable WireGuard keys for this device
let eph = EphemeralKeypair::generate();
let msg = HandshakeMessage::create(&device, &eph, &peer_id, wg.public, 24567, &device_jwt);
// The peer checks the message against the sender's public key and its own DeviceId.
msg.verify(&device.public_key(), &peer_id, &validator)?;
```

## Main exports

| Area | Items |
|---|---|
| identity | `DeviceKeypair`, `DeviceId`, `derive_workload_keypair` |
| address | `NetworkConfig` |
| crypto | `CertValidator`, `CertClaims`, `issue_jwt`, `create_self_signed_jwt`, `HandshakeMessage`, `EphemeralKeypair`, `derive_wireguard_keypair`, `derive_session_keys` |
| discovery | `DiscoveryService`, `DiscoveredPeer`, `PeerLocator`, `StaticPeerConfig`, `Capability` |
| tunnel | `TunnelBackend`, `KernelBackend`, `UserspaceBackend`, `PeerConfig` |
| daemon | `OverlayConfig`, `TunnelMode`, `AcmeConfig` |
| acme | `AcmeRuntime` |

Generate the full API docs locally:

```bash
cargo doc --no-deps --open
```

:::note[Note]
The library API follows the daemon's needs and isn't stable before 1.0.
:::
