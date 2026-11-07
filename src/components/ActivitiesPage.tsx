import { useMemo } from 'react'
import type { Activity } from '../data/types'
import type { Pin } from '../lib/pins'
import { pinnedViews } from '../lib/pins'
import { currentRotation } from '../lib/rotation'
import { HomeButton } from './BackButton'
import ActivityCard from './ActivityCard'

interface Props {
  pool: Activity[]
  pins: Pin[]
  onToggle: (a: Activity) => void
}

export default function ActivitiesPage({ pool, pins, onToggle }: Props) {
  const pinnedIds = pins.map((p) => p.id)
  const pinnedKey = pinnedIds.join(',')
  const weekly = useMemo(
    () => {
      const ids = currentRotation(pool.map((a) => a.id), new Set(pinnedIds))
      return ids.map((id) => pool.find((a) => a.id === id)!).filter(Boolean)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pool, pinnedKey],
  )
  const pinned = pinnedViews(pins, pool)

  return (
    <main className="activities-page">
      <div className="top-bar">
        <HomeButton />
      </div>
      <h1 className="page-title"><span aria-hidden="true">🎨 </span>חוגים ליד הבית</h1>
      <p className="page-intro">כל יום ראשון מחכים לך כאן חוגים חדשים. אהבת חוג? לחצי על הלב, והוא יישאר כאן למעלה.</p>

      {pinned.length > 0 && (
        <section aria-labelledby="pinned-title">
          <h2 id="pinned-title" className="section-title"><span aria-hidden="true">❤️ </span>החוגים ששמרת</h2>
          <ul className="activity-list">
            {pinned.map(({ activity }) => (
              <ActivityCard key={activity.id} activity={activity} pinned onToggle={() => onToggle(activity)} />
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="weekly-title">
        <h2 id="weekly-title" className="section-title"><span aria-hidden="true">⭐ </span>החוגים של השבוע</h2>
        <ul className="activity-list">
          {weekly.map((a) => (
            <ActivityCard key={a.id} activity={a} pinned={false} onToggle={() => onToggle(a)} />
          ))}
        </ul>
      </section>

      <div className="bottom-back">
        <HomeButton />
      </div>
    </main>
  )
}
