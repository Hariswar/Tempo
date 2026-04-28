type CalendarEvent = {
  id: string
  title: string
  startUtc: string
  endUtc: string
  category?: string
  flexibility?: string
  locationLabel?: string
}

type ChatRequest = {
  message?: string
  events?: CalendarEvent[]
  now?: string
  model?: string
  apiUrl?: string
}

export const handler = async (event: { httpMethod?: string; body?: string }) => {
  if (event.httpMethod && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  const apiKey = process.env.GROK_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing GROK_API_KEY environment variable' }),
    }
  }

  const body = (event.body ? JSON.parse(event.body) : {}) as ChatRequest
  const message = body.message?.trim()

  if (!message) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'message is required' }),
    }
  }

  const apiUrl = body.apiUrl || process.env.GROK_API_URL || 'https://api.x.ai/v1/chat/completions'
  const model = body.model || process.env.GROK_MODEL || 'grok-2-latest'
  const now = body.now || new Date().toISOString()
  const events = body.events || []

  const systemPrompt = [
    'You are Tempo AI, an agentic scheduling assistant.',
    'Be concise, helpful, and grounded in the schedule context provided.',
    'If the user asks about conflicts, give practical scheduling advice.',
    'If the user asks to create or move events, ask for missing details only when necessary.',
  ].join(' ')

  const scheduleContext = JSON.stringify(
    {
      now,
      events: events.slice(0, 25).map((entry) => ({
        title: entry.title,
        startUtc: entry.startUtc,
        endUtc: entry.endUtc,
        category: entry.category,
        flexibility: entry.flexibility,
        locationLabel: entry.locationLabel,
      })),
    },
    null,
    2
  )

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: `Current schedule context:\n${scheduleContext}` },
        { role: 'user', content: message },
      ],
    }),
  })

  const payload = await response.json()

  if (!response.ok) {
    return {
      statusCode: response.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: payload?.error?.message || payload?.message || 'Grok request failed',
      }),
    }
  }

  const content = payload?.choices?.[0]?.message?.content?.trim() || ''

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  }
}
