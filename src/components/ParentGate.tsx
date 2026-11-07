import { useState, type ReactNode } from 'react'

// Stays unlocked until the app is closed or reloaded (kept in memory only).
let unlocked = false
export const resetParentGate = () => { unlocked = false }

function newQuestion() {
  // two two-digit numbers between 12 and 19: easy for an adult, not passable by chance
  const r = () => 12 + Math.floor(Math.random() * 8)
  return [r(), r()] as const
}

/** Shows `children` (parent-only content, with external links) only after a multiplication question. */
export default function ParentGate({ children, onCancel }: { children: ReactNode; onCancel: () => void }) {
  const [open, setOpen] = useState(unlocked)
  const [[a, b], setQ] = useState(newQuestion)
  const [answer, setAnswer] = useState('')
  const [wrong, setWrong] = useState(false)

  if (open) return <>{children}</>

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (Number(answer.trim()) === a * b) {
      unlocked = true
      setOpen(true)
    } else {
      setWrong(true)
      setAnswer('')
      setQ(newQuestion())
    }
  }

  return (
    <main className="gate-page">
      <section className="card gate" aria-labelledby="gate-title">
        <h1 id="gate-title"><span aria-hidden="true">🔒 </span>אזור להורים</h1>
        <p>כדי להמשיך, פתרו את התרגיל:</p>
        <form onSubmit={submit}>
          <label className="gate-question" htmlFor="gate-answer">
            כמה זה <span dir="ltr" data-testid="gate-question">{a} × {b}</span>?
          </label>
          <input
            id="gate-answer"
            className="gate-input"
            inputMode="numeric"
            autoComplete="off"
            value={answer}
            onChange={(e) => setAnswer(e.target.value.replace(/[^0-9]/g, ''))}
          />
          {wrong && <p className="gate-wrong" role="alert">התשובה לא נכונה. הנה תרגיל חדש.</p>}
          <div className="gate-buttons">
            <button type="submit" className="back">המשך</button>
            <button type="button" className="parent-button" onClick={onCancel}>ביטול</button>
          </div>
        </form>
      </section>
    </main>
  )
}
