import type { CalendarEvent } from '../types'
import { simulateAIResponse } from '../lib/scheduling'
import { appConfig, readJson } from './api'

type AIChatResponse = {
  content?: string
  message?: string
  reply?: string
}

export async function sendAIMessage(
  message: string,
  events: CalendarEvent[],
  now: Date
): Promise<string> {
  const response = await fetch(appConfig.aiChatEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      events,
      now: now.toISOString(),
      model: appConfig.grokModel,
      apiUrl: appConfig.grokApiUrl,
    }),
  })

  if (!response.ok) {
    if (import.meta.env.DEV) {
      return simulateAIResponse(message, events, now)
    }

    const errorText = await response.text()
    throw new Error(errorText || `AI request failed with status ${response.status}`)
  }

  const payload = await readJson<AIChatResponse>(response)
  const content = payload.content || payload.reply || payload.message

  if (content && content.trim()) {
    return content
  }

  if (import.meta.env.DEV) {
    return simulateAIResponse(message, events, now)
  }

  throw new Error('AI response did not include content')
}
