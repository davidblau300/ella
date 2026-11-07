import type { ActivityCategory } from '../data/types'

export const CATEGORIES: Record<ActivityCategory, { icon: string; label: string }> = {
  sport: { icon: '⚽', label: 'ספורט' },
  dance: { icon: '💃', label: 'מחול' },
  music: { icon: '🎹', label: 'מוזיקה' },
  art: { icon: '🎨', label: 'אמנות' },
  theater: { icon: '🎭', label: 'תיאטרון' },
  thinking: { icon: '♟️', label: 'משחקי חשיבה' },
  science: { icon: '🔭', label: 'מדע וטכנולוגיה' },
  animals: { icon: '🐾', label: 'בעלי חיים' },
  martial: { icon: '🥋', label: 'אמנויות לחימה' },
  gymnastics: { icon: '🤸', label: 'התעמלות' },
  youth: { icon: '⛺', label: 'תנועת נוער' },
}
