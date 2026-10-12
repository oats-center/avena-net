---
title: "Trust and certificates"
---

Discovery tells avena-net that a device *exists*. A certificate decides whether it may
*join*.

## Certificates are JWTs

An avena-net certificate is a JWT (RFC 7519) signed with **EdDSA** (Ed25519). Its claims:

| Claim | Meaning |
|---|---|
| `sub` | subject DeviceId (base32) |
| `iss` | issuer DeviceId (base32) |
| `public_key` | subject's Ed25519 public key (base64) |
| `iat`, `nbf`, `exp` | issued-at, not-before, and expiry (Unix seconds) |

A **root** is self-signed (`sub == iss`). `avena-keygen cert init-ca` makes one valid for
10 years. `avena-keygen cert issue` signs a device certificate valid for 365 days by default
(`--days=N` to change it).

```bash
avena-keygen cert show node1.cert
# sub (device_id): 55v3pcfqs4gnd3ybaobsgzk2wy
# iss (issuer_id): x6qq4l2e2aovmmtgzfukozkhra
# iat: 2026-10-12 17:55:44 UTC
# exp: 2027-10-12 17:55:44 UTC
# self_signed: false
```

## What gets checked, and when

**At startup**, avena-net loads `trusted_root_cert` (it must be self-signed) and checks that
`device_cert` is signed by that root and is currently valid.

**On every handshake**, the receiver:

1. verifies the peer's signature over the handshake payload with the peer's public key;
2. derives the peer's DeviceId from that key;
3. checks that the peer's certificate is signed by the root, is inside its validity window,
   and names **that same DeviceId**.

:::note[Note]
The certificate library can validate chains through intermediate issuers, up to 10 levels.
The daemon only loads the root, though, so device certificates must currently be issued
**directly by the root**.
:::

So a stolen certificate is useless without the matching private key, and a valid key is useless
without a certificate from your root.

## Consequences to plan for

- **Expiry is enforced.** When a device certificate expires, its peers stop accepting it.
  Reissue before `exp`. See [Manage certificates](/docs/guides/certificates/).
- **Keys and certificates must match.** If `keypair_path` is missing, avena-net generates a new
  key. The node starts, but every peer rejects it because its certificate names the old
  DeviceId.
- **One root per mesh.** Nodes only accept certificates that chain to the root they were given.
  There is no revocation list. To remove a device, let its certificate expire, or rotate the root.
- **Guard the root key.** Anyone holding `ca.key` can admit devices. Keep it off devices.
