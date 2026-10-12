import adapter from '@sveltejs/adapter-static'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { defaultTheme } from '@sveltepress/theme-default'
import { sveltepress } from '@sveltepress/vite'
import { defineConfig } from 'vite'
import sidebar from './sidebar.json' with { type: 'json' }

// GitHub Pages serves the site from /<repository>. CI sets BASE_PATH from the
// repository name; local builds default to the canonical name.
const base = process.env.BASE_PATH ?? '/avena-net'

export default defineConfig({
  plugins: [
    sveltepress({
      theme: defaultTheme({
        logo: '/logo.svg',
        github: 'https://github.com/oats-center/avena-net',
        editLink: 'https://github.com/oats-center/avena-net/edit/main/docs/src/routes/:route',
        navbar: [
          { title: 'Docs', to: '/docs/' },
          { title: 'Tutorials', to: '/docs/tutorials/01-multi-hop/' },
          { title: 'Concepts', to: '/docs/concepts/architecture/' },
          { title: 'Reference', to: '/docs/reference/config/' },
        ],
        sidebar: { '/docs/': sidebar },
        themeColor: {
          light: '#f7f5ee',
          dark: '#0e1415',
          primary: '#2a7f86',
          primaryDeep: '#1d5c62',
          hover: '#d9a441',
          gradient: { start: '#2a7f86', end: '#d9a441' },
        },
        highlighter: {
          languages: ['bash', 'sh', 'console', 'toml', 'rust', 'ini', 'dockerfile', 'yaml', 'json', 'diff', 'svelte', 'ts', 'js', 'md', 'css', 'text'],
          themeLight: 'github-light',
          themeDark: 'github-dark-dimmed',
        },
        preBuildIconifyIcons: {
          tabler: ['fingerprint', 'certificate', 'radar-2', 'lock', 'route', 'chart-dots-3', 'flask', 'tractor', 'road', 'box', 'arrow-right'],
        },
      }),
      siteConfig: {
        title: 'avena-net',
        description: 'An encrypted, authenticated IPv6 mesh for machines in the field.',
      },
      svelteKitOptions: {
        preprocess: [vitePreprocess()],
        adapter: adapter({ pages: 'dist' }),
        paths: { base, relative: false },
      },
    }),
  ],
})
