// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { activities } from '../src/data/activities'
import type { Activity } from '../src/data/types'

beforeEach(() => {
  localStorage.clear()
  window.location.hash = '#/activities'
  vi.resetModules()
})
afterEach(cleanup)

describe('pins', () => {
  it('survive a reload (saved in localStorage only)', async () => {
    const pins = await import('../src/lib/pins')
    pins.pinActivity(activities[3])
    vi.resetModules() // like reloading the app
    const reloaded = await import('../src/lib/pins')
    expect(reloaded.loadPins().map((p) => p.id)).toEqual([activities[3].id])
    expect(Object.keys(localStorage)).toEqual(expect.arrayContaining([reloaded.PINS_KEY]))
  })

  it('a pinned activity that leaves the pool stays visible, marked as removed', async () => {
    const { pinActivity, loadPins, pinnedViews } = await import('../src/lib/pins')
    const gone: Activity = { ...activities[0], id: 'no-longer-listed', nameHe: 'חוג שנסגר' }
    pinActivity(gone)
    const views = pinnedViews(loadPins(), activities)
    expect(views).toEqual([{ activity: gone, removed: true }])
  })

  it('pinning from the list keeps it at the top after a reload', async () => {
    const { default: App } = await import('../src/App')
    render(<App />)
    const weekly = screen.getByRole('heading', { name: /החוגים של השבוע/ }).closest('section')!
    const firstCard = within(weekly).getAllByRole('listitem')[0]
    const name = firstCard.querySelector('.activity-name')!.textContent!
    fireEvent.click(within(firstCard).getByRole('button', { name: 'שמרי את החוג' }))
    cleanup()

    vi.resetModules()
    const { default: Reloaded } = await import('../src/App')
    render(<Reloaded />)
    const pinnedSection = screen.getByRole('heading', { name: /החוגים ששמרת/ }).closest('section')!
    expect(within(pinnedSection).getByText(name)).toBeTruthy()
    const weeklyAgain = screen.getByRole('heading', { name: /החוגים של השבוע/ }).closest('section')!
    expect(within(weeklyAgain).getAllByRole('listitem')).toHaveLength(6)
    expect(within(weeklyAgain).queryByText(name)).toBeNull()
  })
})
