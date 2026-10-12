<script>
  const layers = [
    {
      name: 'Routing',
      tag: 'babeld · RFC 8966',
      body: 'avena-net runs its own babeld with every tunnel interface added to it, so the routing protocol sees the whole overlay. Each tunnel carries the node’s /128 overlay address.',
    },
    {
      name: 'Tunnels',
      tag: 'WireGuard · av-xxxxxxxx',
      body: 'Each neighbor gets its own WireGuard interface, per underlay. Kernel WireGuard is used when available, and wireguard-go when it isn’t, such as inside containers.',
    },
    {
      name: 'Handshake',
      tag: 'TCP · listen_port + 1',
      body: 'Neighbors exchange signed, timestamped messages with an ephemeral X25519 key and their device certificate. A valid chain to your root yields the WireGuard keys and a per-pair preshared key.',
    },
    {
      name: 'Discovery',
      tag: 'mDNS · static · ACME',
      body: 'Peers are found by mDNS (_avena._udp), by fixed endpoints in the config, or by beacons on a shared C-V2X channel. Every discovery method feeds the same handshake path.',
    },
    {
      name: 'Identity',
      tag: 'Ed25519 → DeviceId → IPv6',
      body: 'A device keypair is the root of everything. SHA-256 of the public key gives a 16-byte DeviceId, and its first 64 bits place the device inside your /48.',
    },
  ]
  let hovered = $state(2)
</script>

<div class="stack-wrap">
  <ol class="stack">
    {#each layers as l, i}
      <li
        class:on={hovered === i}
        style="--i:{i}"
        onmouseenter={() => (hovered = i)}
        onfocus={() => (hovered = i)}
        tabindex="0"
      >
        <span class="name">{l.name}</span>
        <code>{l.tag}</code>
      </li>
    {/each}
  </ol>
  <div class="detail" aria-live="polite">
    <p class="step">Layer {layers.length - hovered} of {layers.length}</p>
    <h3>{layers[hovered].name}</h3>
    <p>{layers[hovered].body}</p>
  </div>
</div>

<style>
  .stack-wrap {
    display: grid;
    gap: 2rem;
    align-items: center;
  }
  @media (min-width: 860px) {
    .stack-wrap { grid-template-columns: 1.2fr 1fr; }
  }
  .stack {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.5rem;
    perspective: 900px;
  }
  .stack li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.4rem;
    border-radius: 0.8rem;
    cursor: default;
    outline: none;
    margin-inline: calc((4 - var(--i)) * 0.7rem);
    background: color-mix(in srgb, var(--avena-green) calc(6% + var(--i) * 5%), transparent);
    border: 1px solid color-mix(in srgb, var(--avena-green) 25%, transparent);
    transform: rotateX(18deg);
    transition: transform 0.25s, background 0.25s, border-color 0.25s;
  }
  .stack li.on {
    transform: rotateX(0deg) scale(1.03);
    border-color: var(--avena-gold);
    background: color-mix(in srgb, var(--avena-gold) 16%, transparent);
  }
  .name { font-family: var(--avena-display); font-weight: 650; font-size: 1.1rem; }
  code {
    font-size: 0.75rem;
    opacity: 0.7;
    background: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .detail {
    padding: 1.5rem;
    border-left: 3px solid var(--avena-gold);
  }
  .step { margin: 0; font: 600 0.75rem var(--svp-code-font); color: var(--avena-gold); text-transform: uppercase; letter-spacing: 0.1em; }
  h3 { margin: 0.4rem 0 0.6rem; font-size: 1.5rem; }
  .detail p:last-child { margin: 0; line-height: 1.65; color: color-mix(in srgb, currentColor 72%, transparent); }
  @media (prefers-reduced-motion: reduce) {
    .stack li { transition: none; }
  }
</style>
