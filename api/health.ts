import type { VercelRequest, VercelResponse } from '@vercel/node'

// M0: proves Vercel Functions deploy. Exposes no configuration or secrets.
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ ok: true })
}
