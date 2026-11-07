import { useLayoutEffect, useRef, useState } from 'react'
import { breeds as rawBreeds } from './data/breeds'
import { activities, activitiesRefreshedOn } from './data/activities'
import type { Activity } from './data/types'
import { sortByHebrewName } from './lib/search'
import { navigate, useRoute } from './lib/route'
import { loadPins, pinActivity, unpinActivity, type Pin } from './lib/pins'
import Home from './components/Home'
import BreedList from './components/BreedList'
import BreedPage from './components/BreedPage'
import About from './components/About'
import ActivitiesPage from './components/ActivitiesPage'
import ActivityDetail from './components/ActivityDetail'
import ParentGate from './components/ParentGate'
import ParentsPage from './components/ParentsPage'

const breeds = sortByHebrewName(rawBreeds)

export default function App() {
  const route = useRoute()
  const [query, setQuery] = useState('')
  const [pins, setPins] = useState<Pin[]>(loadPins)
  const listScroll = useRef(0)

  useLayoutEffect(() => {
    window.scrollTo(0, route.page === 'dogs' ? listScroll.current : 0)
  }, [route])

  const isPinned = (id: string) => pins.some((p) => p.id === id)
  const togglePin = (a: Activity) => setPins(isPinned(a.id) ? unpinActivity(a.id) : pinActivity(a))

  switch (route.page) {
    case 'dogs':
      return (
        <BreedList
          breeds={breeds}
          query={query}
          onQuery={setQuery}
          onLeave={() => { listScroll.current = window.scrollY }}
        />
      )
    case 'breed': {
      const breed = breeds.find((b) => b.id === route.id)
      if (breed) return <BreedPage breed={breed} />
      break
    }
    case 'about':
      return <About breeds={breeds} />
    case 'activities':
      return <ActivitiesPage pool={activities} pins={pins} onToggle={togglePin} />
    case 'activity': {
      // a pinned activity that left the pool is still shown from its saved copy
      const a = activities.find((x) => x.id === route.id) ?? pins.find((p) => p.id === route.id)?.snapshot
      if (a) return <ActivityDetail activity={a} pinned={isPinned(a.id)} onToggle={() => togglePin(a)} />
      break
    }
    case 'parents':
      return (
        <ParentGate onCancel={() => navigate(route.id ? `#/activity/${route.id}` : '#/activities')}>
          <ParentsPage pool={activities} pins={pins} refreshedOn={activitiesRefreshedOn} focusId={route.id} />
        </ParentGate>
      )
  }
  return <Home />
}
