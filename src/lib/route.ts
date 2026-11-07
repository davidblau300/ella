import { useEffect, useState } from 'react'

export type Route =
  | { page: 'home' }
  | { page: 'dogs' }
  | { page: 'breed'; id: string }
  | { page: 'about' }
  | { page: 'activities' }
  | { page: 'activity'; id: string }
  | { page: 'parents'; id?: string }

export function parseHash(hash: string): Route {
  let m = hash.match(/^#\/breed\/([a-z0-9-]+)$/)
  if (m) return { page: 'breed', id: m[1] }
  m = hash.match(/^#\/activity\/([a-z0-9-]+)$/)
  if (m) return { page: 'activity', id: m[1] }
  m = hash.match(/^#\/parents(?:\/([a-z0-9-]+))?$/)
  if (m) return { page: 'parents', id: m[1] }
  if (hash === '#/dogs') return { page: 'dogs' }
  if (hash === '#/about') return { page: 'about' }
  if (hash === '#/activities') return { page: 'activities' }
  return { page: 'home' }
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

export function navigate(hash: string) {
  window.history.pushState({ fromApp: true }, '', hash || window.location.pathname)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}

/** Go back: use browser history when we came from inside the app, else go to `fallback`. */
export function goBack(fallback: string) {
  if ((window.history.state as { fromApp?: boolean } | null)?.fromApp) window.history.back()
  else navigate(fallback)
}

export const asset = (p: string) => import.meta.env.BASE_URL + p
