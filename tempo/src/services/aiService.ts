import type { CalendarEvent } from '../types'
import { simulateAIResponse } from '../lib/scheduling'
import { appConfig, readJson } from './api'

type AIChatResponse = {
  content?: string
  message?: string
  reply?: string
  error?: string
}

export async function sendAIMessage(
  message: string,
  events: CalendarEvent[],
  now: Date
): Promise<string> {
  try {
    const response = await fetch(appConfig.aiChatEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        events,
        now: now.toISOString(),
        model: appConfig.groqModel,
      }),
    })

    if (!response.ok) {
      // In dev mode, fall back to simulated responses so the app is usable
      // without a deployed Netlify function / Groq API key
      if (import.meta.env.DEV) {
        return simulateAIResponse(message, events, now)
      }

      const errorPayload = await readJson<AIChatResponse>(response)
      throw new Error(
        errorPayload.error || `Groq request failed with status ${response.status}`
      )
    }

    const payload = await readJson<AIChatResponse>(response)
    const content = payload.content || payload.reply || payload.message

    if (content && content.trim()) {
      return content
    }

    // Empty response — fall back in dev, throw in prod
    if (import.meta.env.DEV) {
      return simulateAIResponse(message, events, now)
    }

    throw new Error('AI response did not include content')
  } catch (error) {
    // Network-level failure (e.g. function not reachable) → fall back in dev
    if (import.meta.env.DEV && error instanceof TypeError) {
      return simulateAIResponse(message, events, now)
    }
    throw error
  }
}
