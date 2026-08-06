import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

interface FavoritesValue {
  favorites: string[]
  compare: string[]
  isFavorite: (carId: string) => boolean
  toggleFavorite: (carId: string) => void
  isComparing: (carId: string) => boolean
  toggleCompare: (carId: string) => void
  clearCompare: () => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const FavoritesContext = createContext<FavoritesValue>(null as unknown as FavoritesValue)

/** Comparing more than three cars side by side stops being readable. */
export const MAX_COMPARE = 3

const FAV_KEY = 'autogo:favorites'
const CMP_KEY = 'autogo:compare'

const read = (key: string): string[] => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(() => read(FAV_KEY))
  const [compare, setCompare] = useState<string[]>(() => read(CMP_KEY))

  useEffect(() => localStorage.setItem(FAV_KEY, JSON.stringify(favorites)), [favorites])
  useEffect(() => localStorage.setItem(CMP_KEY, JSON.stringify(compare)), [compare])

  const toggleFavorite = useCallback(
    (carId: string) =>
      setFavorites((prev) =>
        prev.includes(carId) ? prev.filter((id) => id !== carId) : [carId, ...prev],
      ),
    [],
  )

  const toggleCompare = useCallback(
    (carId: string) =>
      setCompare((prev) => {
        if (prev.includes(carId)) return prev.filter((id) => id !== carId)
        // Oldest entry drops out once the slate is full.
        return [...prev, carId].slice(-MAX_COMPARE)
      }),
    [],
  )

  const value = useMemo(
    () => ({
      favorites,
      compare,
      isFavorite: (id: string) => favorites.includes(id),
      toggleFavorite,
      isComparing: (id: string) => compare.includes(id),
      toggleCompare,
      clearCompare: () => setCompare([]),
    }),
    [favorites, compare, toggleFavorite, toggleCompare],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}
