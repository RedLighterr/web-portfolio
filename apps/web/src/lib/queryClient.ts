import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './api'

/** İstemci hatalarını (4xx — 401, 403, 404, 429 …) yeniden denemek anlamsız (429'da zararlı); ağ/5xx hataları 2 kez denenir. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
  return failureCount < 2
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: shouldRetry,
    },
  },
})
