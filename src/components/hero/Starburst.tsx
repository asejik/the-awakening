// 16-point starburst (outer radius 100, inner 62), DESIGN.md §8. Computed once at module load.
const POINTS = Array.from({ length: 32 }, (_, i) => {
  const r = i % 2 ? 62 : 100
  const a = (Math.PI * i) / 16 - Math.PI / 2
  return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`
}).join(' ')

export function Starburst({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="-100 -100 200 200" className={className}>
      <polygon points={POINTS} className="fill-ember" strokeLinejoin="round" />
    </svg>
  )
}
