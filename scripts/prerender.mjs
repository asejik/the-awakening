// After `vite build` + the SSR build: injects the server-rendered app into dist/index.html.
import { readFileSync, rmSync, writeFileSync } from 'node:fs'

const { render } = await import(new URL('../dist-ssr/entry-server.js', import.meta.url))
const file = new URL('../dist/index.html', import.meta.url)
const html = readFileSync(file, 'utf8')
const marker = '<div id="root"></div>'
if (!html.includes(marker)) throw new Error('prerender: root marker not found in dist/index.html')
let out = html.replace(marker, `<div id="root">${render()}</div>`)

// Inline the (small) stylesheet so first paint doesn't wait for a second request on 3G.
out = out.replace(/<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/, (_, href) => {
  const css = readFileSync(new URL(`../dist${href}`, import.meta.url), 'utf8')
  return `<style>${css}</style>`
})
writeFileSync(file, out)
rmSync(new URL('../dist-ssr', import.meta.url), { recursive: true, force: true })
console.log('prerendered dist/index.html')
