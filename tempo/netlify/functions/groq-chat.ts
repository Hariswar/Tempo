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
    'You MUST respond in strict JSON format. Your response MUST be a JSON object with two fields: "content" (string) and "mutations" (array).',
    'The "content" is your conversational response to the user. Keep it under 150 words.',
    'The "mutations" array contains any scheduling actions you want to perform. Valid action types:',
    '- { "type": "CREATE_EVENT", "title": "string", "startUtc": "ISO8601", "endUtc": "ISO8601", "category": "focus_block|work_meeting|class|exercise|personal|meal|errand|deadline_task|commute|other", "flexibility": "fixed|semi_flexible|flexible" }',
    '- { "type": "MOVE_EVENT", "eventId": "string", "startUtc": "ISO8601", "endUtc": "ISO8601" }',
    '- { "type": "UPDATE_EVENT", "eventId": "string", "updates": { "title": "string" } }',
    '- { "type": "DELETE_EVENT", "eventId": "string" }',
    'If no action is needed, return an empty array for "mutations".',
    'Use the exact event IDs from the schedule context when moving, updating, or deleting events.',
  ].join('\\n')

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
        response_format: { type: 'json_object' },
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

    const responseText = payload?.choices?.[0]?.message?.content?.trim() || ''
    let content = responseText
    let mutations = []

    try {
      const parsed = JSON.parse(responseText)
      content = parsed.content || parsed.reply || parsed.message || responseText
      mutations = parsed.mutations || []
    } catch (e) {
      // If it fails to parse, just use the raw text
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, mutations }),
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
