export const appConfig = {
  aiChatEndpoint: import.meta.env.VITE_AI_CHAT_ENDPOINT || '/.netlify/functions/grok-chat',
  grokModel: import.meta.env.VITE_GROK_MODEL || 'grok-2-latest',
  grokApiUrl: import.meta.env.VITE_GROK_API_URL || 'https://api.x.ai/v1/chat/completions',
}

export async function readJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return (await response.json()) as T
  }

  const text = await response.text()
  return text as T
}
