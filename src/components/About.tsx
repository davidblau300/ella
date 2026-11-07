import type { Breed } from '../data/types'
import BackButton from './BackButton'

export default function About({ breeds }: { breeds: Breed[] }) {
  return (
    <main className="about-page">
      <div className="top-bar">
        <BackButton fallback="#/dogs" />
      </div>
      <h1>מידע להורים</h1>
      <section className="card">
        <p>
          האפליקציה עובדת בלי אינטרנט, בלי פרסומות ובלי הרשמה, ולא שומרת שום מידע על המשתמשת.
        </p>
        <p>
          המידע על הגזעים נכתב בעברית פשוטה על סמך ויקיפדיה העברית, ויקיפדיה האנגלית וויקינתונים.
          מידע שלא נמצא במקורות לא נכתב. דירוגי האנרגיה, ההתאמה לילדים והטיפוח הם הערכה כללית
          לפי התיאורים במקורות. כל כלב הוא עולם בפני עצמו.
        </p>
        <p>
          התמונות לקוחות מוויקישיתוף (Wikimedia Commons) ומופיעות לפי הרישיונות החופשיים שלהן.
          תודה לצלמים!
        </p>
      </section>

      <h2>קרדיטים לתמונות</h2>
      <ul className="credits">
        {breeds.map((b) => (
          <li key={b.id} className="card">
            <strong>{b.nameHe}</strong>
            <dl>
              <dt>צילום</dt>
              <dd dir="auto">{b.credit.author}</dd>
              <dt>רישיון</dt>
              <dd dir="ltr">{b.credit.license}</dd>
              <dt>מקור</dt>
              <dd dir="ltr" className="url">{decodeURI(b.credit.sourceUrl)}</dd>
            </dl>
          </li>
        ))}
      </ul>

      <h2>מקורות המידע</h2>
      <ul className="credits">
        {breeds.map((b) => (
          <li key={b.id} className="card">
            <strong>{b.nameHe}</strong>
            {b.sources.map((s) => (
              <div key={s} dir="ltr" className="url">{decodeURI(s)}</div>
            ))}
          </li>
        ))}
      </ul>
      <p className="small">
        טקסט המקורות בוויקיפדיה זמין לפי רישיון CC BY-SA. התמונות לפי הרישיון של כל תמונה, כמפורט למעלה.
      </p>

      <div className="bottom-back">
        <BackButton fallback="#/dogs" />
      </div>
    </main>
  )
}
