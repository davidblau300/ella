import type { SizeGroup } from '../data/types'
import { SIZE_LABELS, SIZE_ORDER } from '../lib/format'

function DogShape({ scale, on }: { scale: number; on: boolean }) {
  const h = 22 + scale * 14
  return (
    <svg viewBox="0 0 64 48" height={h} className={on ? 'dog-shape on' : 'dog-shape'} aria-hidden="true">
      {/* a simple standing dog, facing left */}
      <path d="M8 14c0-4 3-7 7-7h3l3-5 2 7c3 1 4 4 4 7v2h22c5 0 8 3 8 7v4l4-6 2 1-5 10v12h-6V35H33v11h-6V28c-3 0-5-1-7-3h-6c-4 0-6-3-6-6v-5z" />
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
