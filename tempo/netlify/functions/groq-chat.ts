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
}

export const handler = async (event: { httpMethod?: string; body?: string }) => {
  if (event.httpMethod && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing GROQ_API_KEY environment variable' }),
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

  const apiUrl = 'https://api.groq.com/openai/v1/chat/completions'
  const model = body.model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
  const now = body.now || new Date().toISOString()
  const events = body.events || []

  const systemPrompt = [
    'You are Tempo AI, an agentic scheduling assistant embedded in a calendar app called Tempo.',
    'Be concise, helpful, and grounded in the schedule context provided.',
    'If the user asks about conflicts, analyze the schedule and give practical scheduling advice.',
    'If the user asks to create or move events, ask for missing details only when necessary.',
    'If the user asks about free time, analyze gaps in the schedule and report them.',
    'If the user asks for insights or productivity tips, analyze their event patterns and give actionable advice.',
    'Format your responses with short paragraphs. Use **bold** for emphasis.',
    'Do not use markdown headers. Keep responses under 150 words unless the user asks for detail.',
  ].join(' ')

  const scheduleContext = JSON.stringify(
    {
      currentTime: now,
      upcomingEvents: events.slice(0, 30).map((entry) => ({
        title: entry.title,
        start: entry.startUtc,
        end: entry.endUtc,
        category: entry.category,
        flexibility: entry.flexibility,
        location: entry.locationLabel,
      })),
    },
    null,
    2
  )

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 512,
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
          error: payload?.error?.message || payload?.message || 'Groq API request failed',
        }),
      }
    }

    const content = payload?.choices?.[0]?.message?.content?.trim() || ''

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: `Groq API call failed: ${errorMessage}` }),
    }
  }
}
