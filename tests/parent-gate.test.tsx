// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { activities } from '../src/data/activities'

const externalLinks = () =>
  [...document.querySelectorAll('a')].filter((a) => /^(https?:|tel:|mailto:)/.test(a.getAttribute('href') ?? ''))

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
})
afterEach(cleanup)

async function renderAt(hash: string) {
  window.location.hash = hash
  const { default: App } = await import('../src/App')
  return render(<App />)
}

describe('parent gate', () => {
  it('hides parent details and links until the question is answered', async () => {
    const id = activities[0].id
    await renderAt(`#/parents/${id}`)
    expect(screen.getByRole('heading', { name: /אזור להורים/ })).toBeTruthy()
    expect(externalLinks()).toHaveLength(0)
    expect(screen.queryByText('לדף המקור')).toBeNull()

    // a wrong answer keeps it locked
    fireEvent.change(screen.getByLabelText(/כמה זה/), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: 'המשך' }))
    expect(screen.getByRole('alert').textContent).toMatch(/לא נכונה/)
    expect(externalLinks()).toHaveLength(0)

    // the right answer opens it
    const [a, b] = screen.getByTestId('gate-question').textContent!.split('×').map((s) => Number(s.trim()))
    expect(a).toBeGreaterThanOrEqual(10)
    expect(b).toBeGreaterThanOrEqual(10)
    fireEvent.change(screen.getByLabelText(/כמה זה/), { target: { value: String(a * b) } })
    fireEvent.click(screen.getByRole('button', { name: 'המשך' }))
    expect(screen.getByRole('heading', { name: /מידע להורים/ })).toBeTruthy()
    expect(externalLinks().length).toBeGreaterThan(0)
    expect(externalLinks().some((l) => l.getAttribute('href') === activities[0].sourceUrl)).toBe(true)
    expect(screen.getByText(/הרשימה עודכנה לאחרונה/)).toBeTruthy()
  })

  it('kid screens have no external links', async () => {
    for (const hash of ['', '#/activities', `#/activity/${activities[0].id}`, '#/dogs']) {
      await renderAt(hash)
      expect(externalLinks(), hash).toHaveLength(0)
      cleanup()
      vi.resetModules()
    }
  })
})
