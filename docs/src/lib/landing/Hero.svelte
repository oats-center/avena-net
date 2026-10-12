<script>
  import { resolve } from '$app/paths'

  // Real output from avena-keygen and the avena-net daemon (trimmed timestamps).
  const views = [
    {
      id: 'identity',
      lines: [
        ['cmd', 'avena-keygen generate /etc/avena/device.key'],
        ['dim', 'Wrote keypair to /etc/avena/device.key'],
        ['kv', 'device_id=', 'k2qxkrr25jgc25yxbstxunjyiy'],
        ['kv', 'overlay_ip=', 'fd00:a0e0:a000:56a1:7546:3aea:4c2d:1'],
        ['blank'],
        ['note', '# Same key, same address. On any network.'],
      ],
    },
    {
      id: 'peers',
      lines: [
        ['cmd', 'avena-net /etc/avena/avena-net.toml'],
        ['log', 'INFO', 'Overlay address', 'overlay_ip=fd00:a0e0:a000:79dd:…:1'],
        ['log', 'INFO', 'Handshake listener bound', 'addr=[::]:51821'],
        ['log', 'INFO', 'Started babeld for dynamic routing', ''],
        ['log', 'INFO', 'Peer discovered', 'locator=10.1.0.1:51820'],
        ['log', 'INFO', 'Peer discovered', 'locator=10.2.0.1:51820'],
        ['ok', 'INFO', 'Peer connected', 'iface=av-b06e0342'],
        ['ok', 'INFO', 'Peer connected', 'iface=av-6bdf13bc'],
      ],
    },
    {
      id: 'testbed',
      lines: [
        ['cmd', 'avena-testbed run testbed/scenarios/linear_three_hop.toml'],
        ['dim', 'Generating PKI... done (0.0s)'],
        ['dim', 'Setting up network topology... done (0.0s)'],
        ['dim', 'Starting 3 nodes... 3 running (0.3s)'],
        ['dim', 'Running timeline (45s, 0 events, 3 assertions)... done'],
        ['blank'],
        ['pass', '✓ Scenario passed'],
        ['dim', '  Assertions: 3/3 passed'],
      ],
    },
  ]

  let active = $state(0)
  const v = $derived(views[active])
</script>

<section class="hero">
  <div class="field" aria-hidden="true"></div>

  <div class="copy">
    <p class="kicker"><span>Ed25519</span> + <span>WireGuard</span> + <span>Babel</span></p>
    <h1>A mesh that moves <em>with your machines.</em></h1>
    <p class="lead">
      avena-net gives every device a permanent, encrypted IPv6 address. Devices find their
      neighbors on their own, verify each other against your certificate authority, and
      relay traffic for one another over Ethernet, Wi-Fi, or C-V2X radio.
    </p>
    <div class="actions">
      <a class="btn primary" href={resolve('/docs/getting-started/quickstart/')}>Get started <span aria-hidden="true">→</span></a>
      <a class="btn" href={resolve('/docs/')}>Read the docs</a>
      <a class="btn ghost" href="https://github.com/oats-center/avena-net">GitHub</a>
    </div>
  </div>

  <div class="console">
    <div class="tabs" role="tablist" aria-label="Example output">
      {#each views as view, i}
        <button role="tab" aria-selected={i === active} class:on={i === active} onclick={() => (active = i)}>
          {view.id}
        </button>
      {/each}
    </div>
    <pre aria-live="polite">{#each v.lines as l}{#if l[0] === 'cmd'}<span class="p">$</span> {l[1]}
{:else if l[0] === 'kv'}{l[1]}<b>{l[2]}</b>
{:else if l[0] === 'log' || l[0] === 'ok'}<span class="lvl">{l[1]}</span> <span class={l[0] === 'ok' ? 'ok' : ''}>{l[2]}</span> <span class="dim">{l[3]}</span>
{:else if l[0] === 'pass'}<span class="ok">{l[1]}</span>
{:else if l[0] === 'note'}<span class="note">{l[1]}</span>
{:else if l[0] === 'blank'}
{:else}<span class="dim">{l[1]}</span>
{/if}{/each}</pre>
    <p class="caption">Real output. Pick a view.</p>
  </div>
</section>

<style>
  .hero {
    position: relative;
    display: grid;
    gap: 3rem;
    align-items: center;
    max-width: 76rem;
    margin: 0 auto;
    padding: 4.5rem 1.5rem 3rem;
  }
  @media (min-width: 960px) {
    .hero { grid-template-columns: 1.05fr 1fr; padding-top: 6rem; }
  }

  /* Mesh motif: a faint lattice of links instead of Avena's crop rows */
  .field {
    position: absolute;
    inset: -2rem -50vw 0;
    z-index: -1;
    background:
      radial-gradient(60% 70% at 75% 30%, color-mix(in srgb, var(--brand) 18%, transparent), transparent 70%),
      repeating-linear-gradient(150deg, transparent 0 34px, color-mix(in srgb, var(--brand) 8%, transparent) 34px 35px),
      repeating-linear-gradient(30deg, transparent 0 34px, color-mix(in srgb, var(--brand) 8%, transparent) 34px 35px);
    mask-image: linear-gradient(to bottom, black 40%, transparent);
  }

  .kicker {
    margin: 0 0 1rem;
    font-family: var(--svp-code-font);
    font-size: 0.8rem;
    color: color-mix(in srgb, currentColor 55%, transparent);
  }
  .kicker span { color: var(--brand); font-weight: 600; }

  h1 {
    margin: 0;
    font-size: clamp(2.6rem, 6vw, 4.4rem);
    line-height: 1;
    font-weight: 750;
    letter-spacing: -0.035em;
  }
  h1 em {
    font-style: normal;
    background: linear-gradient(100deg, var(--brand) 10%, var(--warm) 90%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .lead {
    margin: 1.5rem 0 0;
    max-width: 36rem;
    font-size: 1.15rem;
    line-height: 1.65;
    color: color-mix(in srgb, currentColor 72%, transparent);
  }

  .actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 2rem; }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.7rem 1.3rem;
    border-radius: 0.6rem;
    font-weight: 600;
    text-decoration: none;
    color: inherit;
    border: 1.5px solid color-mix(in srgb, currentColor 22%, transparent);
    transition: transform 0.15s, border-color 0.15s, background 0.15s;
  }
  .btn:hover { transform: translateY(-1px); border-color: var(--brand); }
  .btn.primary { background: var(--brand); border-color: var(--brand); color: #fff; }
  .btn.primary:hover { background: var(--brand-deep); }
  .btn.ghost { border-color: transparent; }

  .console {
    min-width: 0;
    border-radius: 1rem;
    background: var(--console-bg);
    border: 1px solid var(--console-line);
    box-shadow: 0 40px 80px -30px rgb(10 30 15 / 0.55);
    overflow: hidden;
  }
  .tabs { display: flex; background: var(--console-bar); border-bottom: 1px solid var(--console-line); }
  .tabs button {
    flex: 1;
    padding: 0.65rem 0.5rem;
    background: none;
    border: 0;
    border-bottom: 2px solid transparent;
    color: var(--console-dim);
    font: 500 0.78rem var(--svp-code-font);
    cursor: pointer;
  }
  .tabs button.on { color: var(--on-ink); border-bottom-color: var(--warm); background: var(--console-bg); }
  pre {
    margin: 0;
    padding: 1.1rem 1.25rem 0.5rem;
    min-height: 15.5rem;
    font: 0.78rem/1.65 var(--svp-code-font);
    color: var(--console-text);
    background: none;
    overflow-x: auto;
  }
  pre b { color: #fff; font-weight: 600; }
  .p { color: var(--warm); }
  .lvl { color: #6fb3d0; }
  .ok { color: #6fd08c; }
  .dim { color: var(--console-dim); }
  .note { color: var(--warm); }
  .caption {
    margin: 0;
    padding: 0.4rem 1.25rem 0.9rem;
    font-size: 0.75rem;
    color: var(--console-dim);
  }
</style>
