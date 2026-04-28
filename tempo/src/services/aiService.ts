import type { CalendarEvent } from '../types'
import { simulateAIResponse } from '../lib/scheduling'
import { appConfig, readJson } from './api'

export type AIMutation =
  | { type: 'CREATE_EVENT'; title: string; startUtc: string; endUtc: string; category?: string; flexibility?: string }
  | { type: 'UPDATE_EVENT'; eventId: string; updates: any }
  | { type: 'MOVE_EVENT'; eventId: string; startUtc: string; endUtc: string }
  | { type: 'DELETE_EVENT'; eventId: string }

export type AIResponse = {
  content: string
  mutations?: AIMutation[]
}

type AIChatResponse = {
  content?: string
  message?: string
  reply?: string
  error?: string
  mutations?: AIMutation[]
}

export async function sendAIMessage(
  message: string,
  events: CalendarEvent[],
  now: Date
): Promise<AIResponse> {
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
        const sim = simulateAIResponse(message, events, now)
        try {
          const parsed = JSON.parse(sim)
          if (parsed.content) return parsed
        } catch(e) {}
        return { content: sim }
      }

      const errorPayload = await readJson<AIChatResponse>(response)
      throw new Error(
        errorPayload.error || `Groq request failed with status ${response.status}`
      )
    }

    const payload = await readJson<AIChatResponse>(response)
    const content = payload.content || payload.reply || payload.message
    const mutations = payload.mutations || []

    if (content && content.trim()) {
      return { content, mutations }
    }

    // Empty response — fall back in dev, throw in prod
    if (import.meta.env.DEV) {
      const sim = simulateAIResponse(message, events, now)
      try {
        const parsed = JSON.parse(sim)
        if (parsed.content) return parsed
      } catch(e) {}
      return { content: sim }
    }

    throw new Error('AI response did not include content')
  } catch (error) {
    // Network-level failure (e.g. function not reachable) → fall back in dev
    if (import.meta.env.DEV && error instanceof TypeError) {
      const sim = simulateAIResponse(message, events, now)
      try {
        const parsed = JSON.parse(sim)
        if (parsed.content) return parsed
      } catch(e) {}
      return { content: sim }
    }
    throw error
  }
}
