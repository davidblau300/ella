import { goHome } from '../lib/route'

export default function BackButton() {
  return (
    <button type="button" className="back" onClick={goHome}>
      <span aria-hidden="true">→</span> חזרה לרשימה
    </button>
  )
}
