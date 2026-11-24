import { useMemo, useSyncExternalStore } from 'react'

// Tarayıcı konumunun (yol + query) tek kaynağı (SDK-Infrastructure-Dashboard'daki kalıp). Geri/ileri (`popstate`)
// ve uygulamanın kendi `navigateTo` çağrıları aynı yoldan abonelere haber verir — böylece ikisi de yeniden okunur.

const listeners = new Set<() => void>()

function notify() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) window.addEventListener('popstate', notify)
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) window.removeEventListener('popstate', notify)
  }
}

function snapshot(): string {
  return window.location.pathname + window.location.search
}

/**
 * Konumu değiştirir. `replace=false` geçmişe yeni giriş ekler (geri butonu önceki konuma döner), `true` mevcut girişin
 * üstüne yazar (girişin `state`'i korunur). Zaten o URL'deysek hiçbir şey yapmaz (geçmişe aynı giriş iki kez yazılmaz).
 */
export function navigateTo(url: string, replace = false) {
  if (url === snapshot()) return
  if (replace) window.history.replaceState(window.history.state ?? null, '', url)
  else window.history.pushState(null, '', url)
  notify()
}

export interface LocationState {
  pathname: string
  /** Başında `?` ile ya da boş string. */
  search: string
}

export function useLocation(): LocationState {
  const current = useSyncExternalStore(subscribe, snapshot)
  return useMemo(() => {
    const at = current.indexOf('?')
    return at === -1 ? { pathname: current, search: '' } : { pathname: current.slice(0, at), search: current.slice(at) }
  }, [current])
}
