import type { Activity } from '../data/types'
import type { Pin } from '../lib/pins'
import { pinnedViews } from '../lib/pins'
import { CATEGORIES } from '../lib/categories'
import BackButton from './BackButton'
import { ltrTimes } from '../lib/format'
import { BUILD_TIME, formatBuildTime } from '../lib/build'

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-')
  return `${Number(d)}.${Number(m)}.${y}`
}

const ext = { target: '_blank', rel: 'noopener noreferrer' } as const

function ParentCard({ a, removed = false, focus = false }: { a: Activity; removed?: boolean; focus?: boolean }) {
  return (
    <li className={`card parent-card${focus ? ' focus' : ''}`} id={`parent-${a.id}`}>
      <h3>
        <span aria-hidden="true">{CATEGORIES[a.category].icon} </span>{a.nameHe}
        {removed && <span className="badge-removed">לא מופיע יותר ברשימות</span>}
      </h3>
      <dl>
        <dt>מפעיל</dt><dd>{a.organizer}</dd>
        <dt>מקום</dt><dd>{[a.place, a.address, a.neighborhood].filter(Boolean).join(', ')}</dd>
        <dt>כיתות</dt><dd>{a.grades}{a.gradesNote ? ` (${a.gradesNote})` : ''}</dd>
        <dt>מועדים</dt>
        <dd>{a.times.length ? a.times.map((t) => `${ltrTimes(t.text)}${t.grades ? ` (${t.grades})` : ''}`).join(' · ') : 'לא פורסמו'}</dd>
        <dt>מחיר</dt><dd>{a.price ?? 'לא פורסם'}</dd>
        {a.phone && (<><dt>טלפון</dt><dd><a href={`tel:${a.phone.replace(/[^0-9+]/g, '')}`} dir="ltr">{a.phone}</a></dd></>)}
        {a.website && (<><dt>אתר</dt><dd><a href={a.website} {...ext}>לדף של המפעיל</a></dd></>)}
        <dt>מקור</dt>
        <dd>
          <a href={a.sourceUrl} {...ext}>לדף המקור</a>
          {a.sourceRef && <div className="small">{a.sourceRef}</div>}
        </dd>
        <dt>נבדק</dt><dd>{formatDate(a.checkedOn)}</dd>
      </dl>
    </li>
  )
}

interface Props {
  pool: Activity[]
  pins: Pin[]
  refreshedOn: string
  focusId?: string
}

export default function ParentsPage({ pool, pins, refreshedOn, focusId }: Props) {
  const pinned = pinnedViews(pins, pool)
  const focus = focusId ? pool.find((a) => a.id === focusId) ?? pinned.find((p) => p.activity.id === focusId)?.activity : undefined
  const focusRemoved = !!focus && !pool.some((a) => a.id === focus.id)

  return (
    <main className="parents-page">
      <div className="top-bar">
        <BackButton label="חזרה לחוגים" fallback="#/activities" />
      </div>
      <h1>מידע להורים: חוגים</h1>
      <section className="card">
        <p><strong>הרשימה עודכנה לאחרונה: {formatDate(refreshedOn)}</strong></p>
        <p data-testid="build-time">
          גרסת האפליקציה: נבנתה ב־<span dir="ltr">{formatBuildTime(BUILD_TIME)}</span> (שעון ישראל).
          גרסה חדשה יורדת לבד ברקע, ונכנסת לשימוש בפעם הבאה שהאפליקציה נפתחת, או מיד כשנמצאים בדף הבית.
        </p>
        <p>
          החוגים נאספו מדפים שפורסמו: מערכת החוגים של עיריית תל אביב-יפו (מרכזים קהילתיים ומרכזי ספורט
          באזור רמת אביב), דף תנועות הנוער של העירייה, ואתר מוזיאון ארץ ישראל. נשארו רק חוגים שהכיתות שפורסמו
          להם כוללות את כיתות ג'–ד'. פרטים שלא פורסמו לא נכתבו. כדאי לוודא מול המפעיל לפני ההרשמה.
        </p>
        <p>
          בכל שבוע מוצגים לילדה 6 חוגים מהמאגר, ומתחלפים בכל יום ראשון. חוגים שסומנו בלב נשמרים רק
          במכשיר הזה ולא נשלחים לשום מקום.
        </p>
      </section>

      {focus && (
        <section aria-label="החוג שנבחר">
          <ul className="credits"><ParentCard a={focus} removed={focusRemoved} focus /></ul>
        </section>
      )}

      {pinned.length > 0 && (
        <section>
          <h2>חוגים ששמרה ({pinned.length})</h2>
          <ul className="credits">
            {pinned.map(({ activity, removed }) => <ParentCard key={activity.id} a={activity} removed={removed} />)}
          </ul>
        </section>
      )}

      <section>
        <h2>כל החוגים במאגר ({pool.length})</h2>
        <ul className="credits">
          {pool.map((a) => <ParentCard key={a.id} a={a} />)}
        </ul>
      </section>

      <div className="bottom-back">
        <BackButton label="חזרה לחוגים" fallback="#/activities" />
      </div>
    </main>
  )
}
