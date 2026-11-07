import { useEffect, useState } from 'react'

export type Route = { page: 'list' } | { page: 'breed'; id: string } | { page: 'about' }

export function parseHash(hash: string): Route {
  const m = hash.match(/^#\/breed\/([a-z0-9-]+)$/)
  if (m) return { page: 'breed', id: m[1] }
  if (hash === '#/about') return { page: 'about' }
  return { page: 'list' }
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

/** Go back to the list: use browser history when we came from inside the app. */
export function goHome() {
  if ((window.history.state as { fromApp?: boolean } | null)?.fromApp) window.history.back()
  else window.location.hash = ''
}

export function navigate(hash: string) {
  window.history.pushState({ fromApp: true }, '', hash)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}

export const asset = (p: string) => import.meta.env.BASE_URL + p
