<script>
  const steps = [
    { state: 'discovered', note: 'nodeB’s mDNS announcement arrives with its DeviceId and WireGuard endpoint.' },
    { state: 'handshake', note: 'The node with the larger DeviceId dials TCP to the peer’s listen_port + 1. The other one waits for the call.' },
    { state: 'verified', note: 'Signature, a timestamp within 60 s, a fresh nonce, and a certificate chain to your root. Any failure ends it here.', hold: true },
    { state: 'tunnel', note: 'A per-peer av-… interface comes up with the peer’s WireGuard key and a preshared key from the ephemeral exchange.' },
    { state: 'routed', note: 'babeld adds the interface. The peer’s /128, and everything behind it, becomes reachable.', done: true },
  ]
</script>

<ol class="flow">
  {#each steps as s, i}
    <li class:hold={s.hold} class:done={s.done}>
      <span class="dot">{i + 1}</span>
      <span class="state">{s.state}</span>
      <p>{s.note}</p>
    </li>
  {/each}
</ol>

<style>
  .flow {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    position: relative;
  }
  @media (min-width: 960px) {
    .flow::before {
      content: '';
      position: absolute;
      top: 1.05rem;
      left: 1rem;
      right: 1rem;
      height: 2px;
      background: linear-gradient(90deg, var(--avena-green), var(--avena-gold));
      opacity: 0.5;
    }
  }
  li { position: relative; }
  .dot {
    position: relative;
    display: inline-grid;
    place-items: center;
    width: 2.1rem;
    height: 2.1rem;
    border-radius: 50%;
    font: 700 0.85rem var(--svp-code-font);
    color: #fff;
    background: var(--avena-green);
    box-shadow: 0 0 0 5px #fbfaf5;
  }
  :global(html.dark) .dot { box-shadow: 0 0 0 5px #0f1511; }
  .hold .dot { background: var(--avena-gold); color: #3d2c00; }
  .done .dot { background: #2f9e57; }
  .state {
    display: block;
    margin-top: 0.9rem;
    font-size: 0.9rem;
    font-weight: 600;
    font-family: var(--svp-code-font);
  }
  .hold .state { color: var(--avena-gold); }
  p { margin: 0.35rem 0 0; font-size: 0.9rem; line-height: 1.55; color: color-mix(in srgb, currentColor 68%, transparent); }
</style>
