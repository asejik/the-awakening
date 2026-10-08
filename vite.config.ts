import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// Social previews (WhatsApp, Instagram, X) need absolute URLs. Vercel provides the production
// domain at build time; previews and local builds fall back to their own URL or localhost.
function siteUrl(): string {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL
  return host ? `https://${host}` : 'http://localhost:3000'
}

const injectSiteUrl = (): Plugin => ({
  name: 'inject-site-url',
  transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', siteUrl()),
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), injectSiteUrl()],
  build: {
    rollupOptions: {
      input: { main: 'index.html', privacy: 'privacy.html' },
    },
  },
})
