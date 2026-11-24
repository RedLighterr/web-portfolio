// API her ortamda aynı origin'den, göreli `/api/` ile çağrılır: dev'de Vite proxy'si (vite.config.ts), prod'da nginx
// backend'e iletir. Backend'de CORS yok ve gerekmez. Token ekleme (özel/admin uçları) auth katmanıyla gelecek.

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { Accept: 'application/json', ...init?.headers },
  })
  if (!response.ok) throw new ApiError(response.status, `${response.status} ${response.statusText}`)
  return (await response.json()) as T
}
