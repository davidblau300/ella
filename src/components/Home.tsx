import { navigate } from '../lib/route'

export default function Home() {
  return (
    <main className="home-page">
      <h1 className="home-title">מה בא לך היום?</h1>
      <nav className="home-tiles" aria-label="בחירת אזור">
        <a href="#/dogs" className="home-tile tile-dogs" onClick={(e) => { e.preventDefault(); navigate('#/dogs') }}>
          <span className="tile-icon" aria-hidden="true">🐶</span>
          <span className="tile-label">כלבים</span>
          <span className="tile-sub">גזעי כלבים, תמונות ועובדות</span>
        </a>
        <a href="#/activities" className="home-tile tile-activities" onClick={(e) => { e.preventDefault(); navigate('#/activities') }}>
          <span className="tile-icon" aria-hidden="true">🎨</span>
          <span className="tile-label">חוגים</span>
          <span className="tile-sub">חוגים ליד הבית</span>
        </a>
      </nav>
    </main>
  )
}
