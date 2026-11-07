import { goBack, navigate } from '../lib/route'

/** Big orange back button. `fallback` is where it goes when there is no in-app history. */
export default function BackButton({ label = 'חזרה לרשימה', fallback }: { label?: string; fallback: string }) {
  return (
    <button type="button" className="back" onClick={() => goBack(fallback)}>
      <span aria-hidden="true">→</span> {label}
    </button>
  )
}

/** Goes straight to the home page. */
export function HomeButton() {
  return (
    <button type="button" className="back home-button" onClick={() => navigate('')}>
      <span aria-hidden="true">🏠</span> דף הבית
    </button>
  )
}
