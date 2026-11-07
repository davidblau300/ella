// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { shouldApplyUpdate } from '../src/lib/updatePolicy'
import { BUILD_TIME, formatBuildTime } from '../src/lib/build'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('automatic updates', () => {
  it('does nothing when no new version is waiting', () => {
    for (const event of ['startup', 'resumed', 'downloaded', 'navigated'] as const) {
      expect(shouldApplyUpdate({ pending: false, onHome: true, event })).toBe(false)
    }
  })

  it('switches right away on the home page', () => {
    expect(shouldApplyUpdate({ pending: true, onHome: true, event: 'downloaded' })).toBe(true)
    expect(shouldApplyUpdate({ pending: true, onHome: true, event: 'navigated' })).toBe(true)
  })

  it('waits while she is busy on another screen', () => {
    expect(shouldApplyUpdate({ pending: true, onHome: false, event: 'downloaded' })).toBe(false)
    expect(shouldApplyUpdate({ pending: true, onHome: false, event: 'navigated' })).toBe(false)
  })

  it('switches the next time the app opens or comes back', () => {
    expect(shouldApplyUpdate({ pending: true, onHome: false, event: 'startup' })).toBe(true)
    expect(shouldApplyUpdate({ pending: true, onHome: false, event: 'resumed' })).toBe(true)
  })

  it('lets the app control updates (prompt mode, no auto-injected register script)', () => {
    const config = readFileSync(path.resolve(import.meta.dirname, '../vite.config.ts'), 'utf8')
    expect(config).toContain("registerType: 'prompt'")
    expect(config).toContain('injectRegister: false')
    expect(readFileSync(path.resolve(import.meta.dirname, '../src/main.tsx'), 'utf8')).toContain('startAutoUpdate()')
  })
})

describe('build time', () => {
  afterEach(cleanup)

  it('is set at build time and formatted in Israel time', () => {
    expect(Number.isNaN(Date.parse(BUILD_TIME))).toBe(false)
    expect(formatBuildTime('2026-11-07T13:42:00Z')).toBe('7.11.2026, 15:42')
  })

  it('is shown on the parents screen', async () => {
    window.location.hash = '#/parents'
    vi.resetModules()
    const { default: App } = await import('../src/App')
    render(<App />)
    const [a, b] = screen.getByTestId('gate-question').textContent!.split('×').map((s) => Number(s.trim()))
    fireEvent.change(screen.getByLabelText(/כמה זה/), { target: { value: String(a * b) } })
    fireEvent.click(screen.getByRole('button', { name: 'המשך' }))
    expect(screen.getByTestId('build-time').textContent).toContain(formatBuildTime(BUILD_TIME))
  })
})
