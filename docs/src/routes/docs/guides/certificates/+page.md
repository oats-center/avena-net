---
title: "Manage certificates"
---

Background: [Trust and certificates](/docs/concepts/trust/).

## Create a root

Do this once per mesh, on a machine that won't be deployed:

```bash
avena-keygen generate ca.key
avena-keygen cert init-ca ca.key root.cert       # valid 10 years
```

Back up `ca.key` offline. Anyone who has it can admit devices to your mesh.

## Add a device

```bash
avena-keygen generate tractor-07.key > tractor-07.meta
avena-keygen cert issue ca.key root.cert tractor-07.key tractor-07.cert --days=365
```

Install `root.cert`, `tractor-07.key` (as `device.key`, mode `0600`), and `tractor-07.cert` (as
`device.cert`) in `/etc/avena/`. Keep the `.meta` file. It records the DeviceId and overlay
address you'll need for static peers and monitoring.

## Inspect a certificate

```bash
avena-keygen cert show /etc/avena/device.cert
```

Check `sub` against the device's actual key:

```bash
avena-keygen from-file /etc/avena/device.key | head -1
```

They must match. If they don't, peers reject the device. That's the usual cause of
"connects nowhere, but starts fine".

## Renew

Issue a new certificate for the **same key** and replace `device.cert`:

```bash
avena-keygen cert issue ca.key root.cert tractor-07.key tractor-07.cert --days=365
scp tractor-07.cert tractor-07:/tmp/ && ssh tractor-07 'sudo install -m 0600 /tmp/tractor-07.cert /etc/avena/device.cert && sudo systemctl restart avena-net'
```

The DeviceId and overlay address don't change. Track expiry dates. avena-net doesn't warn you
before a certificate expires.

## Remove a device

There's no revocation list. To remove a device:

- **Soon:** let its certificate expire, by using short `--days` for devices you may need to remove;
- **Now:** issue a new root, reissue certificates for every device you're keeping, and roll out
  the new `root.cert` and certificates together.

## Lost or replaced hardware

Generate a new key and certificate for the replacement. It gets a **new** DeviceId and overlay
address. Update any static peer entries that referenced the old DeviceId.
