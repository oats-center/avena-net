<script>
  import { resolve } from '$app/paths'
  import { IconifyIcon } from '@sveltepress/theme-default/components'

  const tiles = [
    {
      icon: 'fingerprint',
      title: 'Key-derived addresses',
      body: 'A device’s overlay IPv6 address is derived from its Ed25519 public key. It doesn’t depend on DHCP or an address registry, and it doesn’t change when the device changes networks.',
      to: '/docs/concepts/identity/',
      size: 'wide',
    },
    {
      icon: 'certificate',
      title: 'Certificate authentication',
      body: 'Peers present device certificates issued by your root. A peer without a valid certificate isn’t given a tunnel.',
      to: '/docs/concepts/trust/',
    },
    {
      icon: 'radar-2',
      title: 'Peer discovery',
      body: 'mDNS on the local network, static endpoints across a WAN, and beacons over a shared C-V2X channel, all at the same time.',
      to: '/docs/concepts/discovery/',
    },
    {
      icon: 'route',
      title: 'Multi-hop routing',
      body: 'Each neighbor gets its own WireGuard tunnel per underlay, and Babel routes across them. Traffic can pass through intermediate nodes, and fails over between underlays when one link drops.',
      to: '/docs/concepts/routing/',
    },
    {
      icon: 'chart-dots-3',
      title: 'Telemetry',
      body: 'Peer, handshake, and routing events are published to NATS as JSON.',
      to: '/docs/concepts/telemetry/',
    },
    {
      icon: 'flask',
      title: 'Testbed',
      body: 'The testbed runs whole topologies in network namespaces with scripted link failures, without root. ns-3 can drive radio and mobility models.',
      to: '/docs/guides/scenarios/',
      size: 'full',
    },
  ]
</script>

<div class="bento">
  {#each tiles as t}
    <a class="tile {t.size ?? ''}" href={resolve(t.to)}>
      <span class="icon"><IconifyIcon collection="tabler" name={t.icon} /></span>
      <h3>{t.title}</h3>
      <p>{t.body}</p>
    </a>
  {/each}
</div>

<style>
  .bento {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  }
  @media (min-width: 960px) {
    .bento { grid-template-columns: repeat(3, 1fr); grid-auto-flow: dense; }
    .wide { grid-column: span 2; }
    .full { grid-column: 1 / -1; }
  }
  .tile {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 1.5rem;
    border-radius: 1rem;
    text-decoration: none;
    color: inherit;
    background: color-mix(in srgb, var(--brand) 5%, transparent);
    border: 1px solid color-mix(in srgb, var(--brand) 18%, transparent);
    transition: border-color 0.2s, background 0.2s;
    overflow: hidden;
  }
  .tile:hover {
    border-color: var(--brand);
    background: color-mix(in srgb, var(--brand) 9%, transparent);
  }
  .tile::after {
    content: '→';
    position: absolute;
    top: 1.3rem;
    right: 1.4rem;
    opacity: 0;
    color: var(--warm);
    transition: opacity 0.2s, transform 0.2s;
  }
  .tile:hover::after { opacity: 1; transform: translateX(3px); }
  .full {
    background:
      linear-gradient(160deg, color-mix(in srgb, var(--warm) 14%, transparent), transparent 60%),
      color-mix(in srgb, var(--brand) 5%, transparent);
  }
  .icon {
    display: inline-flex;
    align-self: flex-start;
    padding: 0.6rem;
    border-radius: 0.7rem;
    font-size: 1.4rem;
    color: #fff;
    background: var(--brand);
  }
  h3 { margin: 0.8rem 0 0; font-size: 1.2rem; font-weight: 650; }
  p { margin: 0; line-height: 1.6; font-size: 0.95rem; color: color-mix(in srgb, currentColor 70%, transparent); }
</style>
