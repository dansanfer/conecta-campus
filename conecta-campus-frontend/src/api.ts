const API_URL = 'http://127.0.0.1:8000'

export function getToken() {
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
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Erro na requisição' }))
    throw new Error(err.detail || 'Erro inesperado')
  }

  return response.json()
}