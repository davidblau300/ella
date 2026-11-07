import type { Activity } from '../data/types'
import { CATEGORIES } from '../lib/categories'
import { navigate } from '../lib/route'
import { ltrTimes } from '../lib/format'

export function HeartButton({ pinned, onToggle, big = false }: { pinned: boolean; onToggle: () => void; big?: boolean }) {
  return (
    <button
      type="button"
      className={`heart${pinned ? ' on' : ''}${big ? ' big' : ''}`}
      aria-pressed={pinned}
      aria-label={pinned ? 'הסירי מהחוגים ששמרת' : 'שמרי את החוג'}
      onClick={(e) => { e.stopPropagation(); onToggle() }}
    >
      <span aria-hidden="true">{pinned ? '❤️' : '🤍'}</span>
      {big && <span className="heart-text">{pinned ? 'שמור אצלך' : 'שמרי את החוג'}</span>}
    </button>
  )
}

/** "יום ב' 17:00–17:50" or "2 מועדים: …" (kid-facing summary) */
export function whenSummary(a: Activity): string | undefined {
  if (!a.times.length) return undefined
  if (a.times.length === 1) return ltrTimes(a.times[0].text)
  return `${a.times.length} מועדים לבחירה`
}

export default function ActivityCard({ activity: a, pinned, onToggle }: { activity: Activity; pinned: boolean; onToggle: () => void }) {
  const cat = CATEGORIES[a.category]
  const when = whenSummary(a)
  return (
    <li className="activity-card">
      <a
        href={`#/activity/${a.id}`}
        className="activity-main"
        onClick={(e) => { e.preventDefault(); navigate(`#/activity/${a.id}`) }}
      >
        <span className="activity-icon" aria-hidden="true">{cat.icon}</span>
        <span className="activity-body">
          <span className="activity-name">{a.nameHe}</span>
          <span className="activity-desc">{a.description}</span>
          <span className="activity-meta">
            <span>📍 {a.place}{a.neighborhood ? `, ${a.neighborhood}` : ''}</span>
            {when && <span>🕒 {when}</span>}
            <span>🎒 {a.grades}</span>
          </span>
        </span>
      </a>
      <HeartButton pinned={pinned} onToggle={onToggle} />
    </li>
  )
}
