import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App'

// Build-time prerender (scripts/prerender.mjs): the hero is in the HTML before any JS runs.
// The lazy form renders as its Suspense fallback here and on the client's first pass, so hydration matches.
export function render(): string {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
