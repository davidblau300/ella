import type { Rating } from '../data/types'

export function Paw({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={filled ? 'paw on' : 'paw'} aria-hidden="true">
      <ellipse cx="32" cy="42" rx="13" ry="11" />
      <ellipse cx="17" cy="27" rx="5.5" ry="7" transform="rotate(-20 17 27)" />
      <ellipse cx="26.5" cy="18" rx="5.5" ry="7.5" transform="rotate(-6 26.5 18)" />
      <ellipse cx="37.5" cy="18" rx="5.5" ry="7.5" transform="rotate(6 37.5 18)" />
      <ellipse cx="47" cy="27" rx="5.5" ry="7" transform="rotate(20 47 27)" />
    </svg>
  )
}

export default function Paws({ value }: { value: Rating }) {
  return (
    <span className="paws" role="img" aria-label={`${value} מתוך 5`}>
      {[1, 2, 3, 4, 5].map((n) => <Paw key={n} filled={n <= value} />)}
    </span>
  )
}
