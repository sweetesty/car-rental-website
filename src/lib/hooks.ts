import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '@/context/AuthContext'
import { DataContext } from '@/context/DataContext'
import { FavoritesContext } from '@/context/FavoritesContext'
import { ThemeContext } from '@/context/ThemeContext'
import { ToastContext } from '@/context/ToastContext'

export const useAuth = () => useContext(AuthContext)
export const useData = () => useContext(DataContext)
export const useFavorites = () => useContext(FavoritesContext)
export const useTheme = () => useContext(ThemeContext)
export const useToast = () => useContext(ToastContext).toast

/** Delays a fast-changing value — used to keep the search box from thrashing. */
export function useDebounced<T>(value: T, ms = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return debounced
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

/** True once the page has scrolled past `offset` — drives the sticky header. */
export function useScrolled(offset = 8) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > offset)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [offset])
  return scrolled
}

/** Locks body scroll while a modal or drawer is open. */
export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [locked])
}
