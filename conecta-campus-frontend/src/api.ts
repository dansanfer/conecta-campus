const API_URL = import.meta.env.DEV ? 'http://127.0.0.1:8000' : ''

export function getToken(): string | null {
  return localStorage.getItem('cc_token')
}

export function setToken(token: string) {
  localStorage.setItem('cc_token', token)
}

export function clearToken() {
  localStorage.removeItem('cc_token')
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getToken()
  const headers = new Headers(options.headers || {})
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Erro na requisição' }))
    throw new Error(err.detail || 'Erro inesperado')
  }

  return res.json()
}