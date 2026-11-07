import { useLayoutEffect, useRef, useState } from 'react'
import { breeds as rawBreeds } from './data/breeds'
import { sortByHebrewName } from './lib/search'
import { useRoute } from './lib/route'
import BreedList from './components/BreedList'
import BreedPage from './components/BreedPage'
import About from './components/About'

const breeds = sortByHebrewName(rawBreeds)

export default function App() {
  const route = useRoute()
  const [query, setQuery] = useState('')
  const listScroll = useRef(0)

  useLayoutEffect(() => {
    window.scrollTo(0, route.page === 'list' ? listScroll.current : 0)
  }, [route])

  if (route.page === 'breed') {
    const breed = breeds.find((b) => b.id === route.id)
    if (breed) return <BreedPage breed={breed} />
  }
  if (route.page === 'about') return <About breeds={breeds} />
  return (
    <BreedList
      breeds={breeds}
      query={query}
      onQuery={setQuery}
      onLeave={() => { listScroll.current = window.scrollY }}
    />
  )
}
