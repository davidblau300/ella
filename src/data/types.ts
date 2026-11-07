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
