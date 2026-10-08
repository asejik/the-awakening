// M0 placeholder: proves the build, tokens, fonts and assets deploy.
// The real registration flow replaces this in M2.
export default function App() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[440px] flex-col items-center px-4 py-6 text-center">
      <div className="flex items-center gap-2 self-start">
        <img src="/assets/clc-mark.webp" alt="" width={34} height={34} className="rounded-full" />
        <span className="text-left font-text text-meta font-bold uppercase leading-tight tracking-wide text-ink">
          Citizens
          <br />
          of Light Church
        </span>
      </div>

      <picture className="mt-10 block w-full">
        <source srcSet="/assets/title.webp" type="image/webp" />
        <img src="/assets/title.png" alt="The Awakening" width={720} height={562} className="h-auto w-full" />
      </picture>

      <p className="mt-2 bg-maroon px-5 py-2 font-display text-h2 text-cream">
        FRESHERS
        <br />
        PLUG IN
      </p>

      <p className="mt-8 font-display text-h1 text-ink">Registration opens soon.</p>
      <p className="mt-2 font-text text-detail font-bold italic uppercase text-muted">
        Oct 24 · 4PM &amp; Oct 25 · 9AM · Freedom Dome, Tanke, Ilorin
      </p>
    </main>
  )
}
