import type { Activity } from '../data/types'
import { CATEGORIES } from '../lib/categories'
import { navigate } from '../lib/route'
import { ltrTimes } from '../lib/format'
import BackButton from './BackButton'
import { HeartButton } from './ActivityCard'

interface Props {
  activity: Activity
  pinned: boolean
  onToggle: () => void
}

export default function ActivityDetail({ activity: a, pinned, onToggle }: Props) {
  const cat = CATEGORIES[a.category]
  return (
    <main className="activity-page">
      <div className="top-bar">
        <BackButton label="חזרה לחוגים" fallback="#/activities" />
      </div>

      <div className="activity-hero">
        <span className="activity-hero-icon" aria-hidden="true">{cat.icon}</span>
        <div>
          <p className="activity-cat">{cat.label}</p>
          <h1 className="breed-title">{a.nameHe}</h1>
        </div>
      </div>
      <p className="activity-lead">{a.description}</p>

      <HeartButton pinned={pinned} onToggle={onToggle} big />

      <section className="card">
        <h2><span aria-hidden="true">📍 </span>איפה?</h2>
        <p>{a.place}</p>
        {(a.neighborhood || a.address) && <p className="muted">{[a.address, a.neighborhood].filter(Boolean).join(', ')}</p>}
      </section>

      <section className="card">
        <h2><span aria-hidden="true">🕒 </span>מתי?</h2>
        {a.times.length === 0 ? (
          <p>הימים והשעות לא פורסמו. ההורים יכולים לברר.</p>
        ) : (
          <ul className="times">
            {a.times.map((t) => (
              <li key={t.text + t.grades}>
                <span className="time-text">{ltrTimes(t.text)}</span>
                {t.grades && a.times.length > 1 && <span className="muted"> ({t.grades})</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2><span aria-hidden="true">🎒 </span>לאילו כיתות?</h2>
        <p>{a.grades}</p>
        {a.gradesNote && <p className="muted">{a.gradesNote}</p>}
      </section>

      <div className="parent-link-row">
        <button type="button" className="parent-button" onClick={() => navigate(`#/parents/${a.id}`)}>
          <span aria-hidden="true">🔒 </span>פרטים להורים
        </button>
      </div>

      <div className="bottom-back">
        <BackButton label="חזרה לחוגים" fallback="#/activities" />
      </div>
    </main>
  )
}
