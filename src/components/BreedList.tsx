import type { Breed } from '../data/types'
import { filterByName } from '../lib/search'
import { asset, navigate } from '../lib/route'
import { HomeButton } from './BackButton'

interface Props {
  breeds: Breed[]
  query: string
  onQuery: (q: string) => void
  onLeave: () => void
}

export default function BreedList({ breeds, query, onQuery, onLeave }: Props) {
  const shown = filterByName(breeds, query)
  const go = (hash: string) => { onLeave(); navigate(hash) }

  return (
    <main className="list-page">
      <header className="list-header">
        <div className="header-row">
          <HomeButton />
        </div>
        <h1>
          <span aria-hidden="true">🐾 </span>גזעי כלבים
        </h1>
        <label className="search">
          <span className="visually-hidden">חיפוש כלב לפי שם</span>
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="חפשי כלב לפי שם"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
          />
          {query && (
            <button type="button" className="clear" onClick={() => onQuery('')} aria-label="מחיקת החיפוש">
              ✕
            </button>
          )}
        </label>
      </header>

      {shown.length === 0 ? (
        <p className="empty">לא מצאתי כלב בשם הזה. נסי לכתוב קצת אחרת.</p>
      ) : (
        <ul className="breed-list">
          {shown.map((b) => (
            <li key={b.id}>
              <a
                href={`#/breed/${b.id}`}
                className="breed-row"
                onClick={(e) => { e.preventDefault(); go(`#/breed/${b.id}`) }}
              >
                <img src={asset(b.photo.thumb)} alt="" width={72} height={72} loading="lazy" decoding="async" />
                <span className="breed-name">{b.nameHe}</span>
                <span className="chevron" aria-hidden="true">‹</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      <footer className="list-footer">
        <a href="#/about" onClick={(e) => { e.preventDefault(); go('#/about') }}>מידע להורים ותודות על התמונות</a>
      </footer>
    </main>
  )
}
