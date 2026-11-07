import type { SizeGroup } from '../data/types'
import { SIZE_LABELS, SIZE_ORDER } from '../lib/format'

function DogShape({ scale, on }: { scale: number; on: boolean }) {
  const h = 22 + scale * 14
  return (
    <svg viewBox="0 0 64 48" height={h} className={on ? 'dog-shape on' : 'dog-shape'} aria-hidden="true">
      {/* a simple standing dog facing right: body, legs, tail, head with snout and floppy ear */}
      <rect x="14" y="20" width="32" height="14" rx="7" />
      <rect x="16" y="28" width="5" height="18" rx="2.5" />
      <rect x="25" y="28" width="5" height="18" rx="2.5" />
      <rect x="34" y="28" width="5" height="18" rx="2.5" />
      <rect x="40" y="28" width="5" height="18" rx="2.5" />
      <path d="M16 24 C10 22 7 15 9 9 C10 7 12 8 12 10 C12 15 14 19 18 21 Z" />
      <circle cx="47" cy="15" r="9" />
      <rect x="49" y="15" width="13" height="8" rx="4" />
      <ellipse cx="42.5" cy="15" rx="3.5" ry="7" transform="rotate(15 42.5 15)" className="dog-ear" />
    </svg>
  )
}

export default function SizeScale({ size }: { size: SizeGroup[] }) {
  const label = size.map((s) => SIZE_LABELS[s]).join(', ')
  return (
    <div className="size-scale" role="img" aria-label={`גודל: ${label}`}>
      {SIZE_ORDER.map((s, i) => (
        <div key={s} className={size.includes(s) ? 'size-step on' : 'size-step'}>
          <DogShape scale={i} on={size.includes(s)} />
          <span>{SIZE_LABELS[s]}</span>
        </div>
      ))}
    </div>
  )
}
