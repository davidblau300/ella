import type { ReactNode } from 'react'
import type { Breed, Rating } from '../data/types'
import { asset } from '../lib/route'
import { formatRange } from '../lib/format'
import BackButton from './BackButton'
import Paws from './Paws'
import SizeScale from './SizeScale'

function Section({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <section className="card">
      <h2><span aria-hidden="true">{icon} </span>{title}</h2>
      {children}
    </section>
  )
}

function RatingRow({ label, value }: { label: string; value?: Rating }) {
  if (!value) return null
  return (
    <div className="rating-row">
      <span className="rating-label">{label}</span>
      <Paws value={value} />
    </div>
  )
}

export default function BreedPage({ breed: b }: { breed: Breed }) {
  const numbers = [
    b.heightCm && { label: 'גובה', value: formatRange(b.heightCm, 'ס״מ'), icon: '📏' },
    b.weightKg && { label: 'משקל', value: formatRange(b.weightKg, 'ק״ג'), icon: '⚖️' },
    b.lifeYears && { label: 'אורך חיים', value: formatRange(b.lifeYears, 'שנים'), icon: '🎂' },
  ].filter(Boolean) as { label: string; value: string; icon: string }[]
  const hasRatings = b.energy || b.kids || b.grooming

  return (
    <main className="breed-page">
      <div className="top-bar">
        <BackButton />
      </div>

      <div className="hero">
        <img src={asset(b.photo.large)} alt={`כלב מגזע ${b.nameHe}`} width={b.photo.width} height={b.photo.height} />
      </div>
      <h1 className="breed-title">{b.nameHe}</h1>

      {b.origin && (
        <p className="origin">
          <span className="origin-label">ארץ מוצא: </span>
          {b.origin.map((o, i) => (
            <span key={o.nameHe} className="country">
              {i > 0 && ', '}
              {o.flag && <span className="flag" aria-hidden="true">{o.flag} </span>}
              {o.nameHe}
            </span>
          ))}
        </p>
      )}

      {b.size && (
        <Section title="גודל" icon="🐕">
          <SizeScale size={b.size} />
        </Section>
      )}

      {numbers.length > 0 && (
        <section className="numbers">
          {numbers.map((n) => (
            <div key={n.label} className="number-box">
              <span className="number-icon" aria-hidden="true">{n.icon}</span>
              <span className="number-label">{n.label}</span>
              <span className="number-value">{n.value}</span>
            </div>
          ))}
        </section>
      )}

      {hasRatings && (
        <Section title="בקצרה" icon="⭐">
          <RatingRow label="אנרגיה" value={b.energy} />
          <RatingRow label="טוב עם ילדים" value={b.kids} />
          <RatingRow label="צריך טיפוח" value={b.grooming} />
        </Section>
      )}

      {b.temperament && (
        <Section title="אופי" icon="💛">
          <p>{b.temperament}</p>
        </Section>
      )}

      {(b.coat || b.colors) && (
        <Section title="פרווה וצבעים" icon="🎨">
          {b.coat && <p>{b.coat}</p>}
          {b.colors && <p>{b.colors}</p>}
        </Section>
      )}

      {b.history && (
        <Section title="קצת היסטוריה" icon="📜">
          <p>{b.history}</p>
        </Section>
      )}

      {b.funFacts && (
        <Section title="הידעת?" icon="💡">
          <ul className="fun-facts">
            {b.funFacts.map((f) => <li key={f}>{f}</li>)}
          </ul>
        </Section>
      )}

      <div className="bottom-back">
        <BackButton />
      </div>
    </main>
  )
}
