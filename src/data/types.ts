export type SizeGroup = 'small' | 'medium' | 'large' | 'giant'
export type Rating = 1 | 2 | 3 | 4 | 5
export type Range = [number, number]

export interface Breed {
  /** URL-safe id, also the image file name */
  id: string
  /** Wikidata item */
  qid: string
  nameHe: string
  nameEn?: string
  origin?: { nameHe: string; flag?: string }[]
  /** one group, or several for breeds that come in several sizes (e.g. poodle) */
  size?: SizeGroup[]
  heightCm?: Range
  weightKg?: Range
  lifeYears?: Range
  coat?: string
  colors?: string
  temperament?: string
  energy?: Rating
  kids?: Rating
  grooming?: Rating
  history?: string
  funFacts?: string[]
  photo: { large: string; thumb: string; width: number; height: number }
  credit: { file: string; author: string; license: string; licenseUrl?: string; sourceUrl: string }
  /** Articles and items the facts were taken from */
  sources: string[]
}

export type ActivityCategory =
  | 'sport' | 'dance' | 'music' | 'art' | 'theater' | 'thinking'
  | 'science' | 'animals' | 'martial' | 'gymnastics' | 'youth'

export interface Activity {
  id: string
  nameHe: string
  category: ActivityCategory
  /** short kid-friendly Hebrew description, written by hand from the source */
  description: string
  /** where it takes place */
  place: string
  neighborhood?: string
  address?: string
  /** published grades, e.g. "כיתות ג'–ד'" */
  grades: string
  gradesNote?: string
  /** published days and times, each with the grades of that group */
  times: { text: string; grades?: string }[]
  // ---- parent details (shown only behind the parent gate) ----
  organizer: string
  phone?: string
  website?: string
  price?: string
  sourceUrl: string
  sourceRef?: string
  /** YYYY-MM-DD the source was last read */
  checkedOn: string
}
