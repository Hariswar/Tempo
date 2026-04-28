export const appConfig = {
  aiChatEndpoint: import.meta.env.VITE_AI_CHAT_ENDPOINT || '/.netlify/functions/groq-chat',
  groqModel: import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile',
}

export async function readJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return (await response.json()) as T
  }

  const text = await response.text()
  return text as T
}
