<script>
  import { resolve } from '$app/paths'
  import { IconifyIcon } from '@sveltepress/theme-default/components'

  const cases = [
    { icon: 'tractor', name: 'Field and farm', to: '/docs/tutorials/01-multi-hop/', body: 'Tractors, implements, and edge gateways move in and out of range. Addresses stay fixed, and traffic is relayed through nearby machines.', tags: ['mDNS', 'multi-hop', 'Wi-Fi'] },
    { icon: 'road', name: 'Roadside and V2X', to: '/docs/tutorials/05-acme/', body: 'Cohda MK6-class radios and wired cabinets share one overlay. ACME/C-V2X neighbors and IP neighbors are routed together.', tags: ['C-V2X', 'ACME', 'mixed underlay'] },
    { icon: 'box', name: 'Secure sidecar', to: '/docs/tutorials/04-container-sidecar/', body: 'Run avena-net as a container and attach other services, such as a web server or message broker, to its network namespace. They are then reachable over the overlay without changes to the service.', tags: ['Podman', 'Quadlet', 'NATS'] },
  ]
</script>

<div class="cases">
  {#each cases as c}
    <a class="card" href={resolve(c.to)}>
      <span class="icon"><IconifyIcon collection="tabler" name={c.icon} /></span>
      <h3>{c.name}</h3>
      <p>{c.body}</p>
      <ul>{#each c.tags as t}<li>{t}</li>{/each}</ul>
    </a>
  {/each}
</div>

<style>
  .cases { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr)); }
  .card {
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    border-radius: 1rem;
    text-decoration: none;
    color: inherit;
    border: 1px solid color-mix(in srgb, currentColor 12%, transparent);
    transition: border-color 0.2s, transform 0.2s;
  }
  .card:hover { border-color: var(--warm); transform: translateY(-3px); }
  .icon { font-size: 2rem; color: var(--warm); }
  h3 { margin: 1rem 0 0.4rem; font-size: 1.3rem; }
  p { margin: 0; flex: 1; line-height: 1.6; font-size: 0.95rem; color: color-mix(in srgb, currentColor 70%, transparent); }
  ul { list-style: none; margin: 1.2rem 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 0.4rem; }
  li {
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--brand);
    background: color-mix(in srgb, var(--brand) 12%, transparent);
  }
</style>
