# Tempo

AI-powered agentic calendar application. Transforms a passive calendar into an intelligent agent that proactively schedules, optimizes, and adapts events based on deadlines, user habits, and real-world constraints.

---

## What It Does

When two events conflict, the scheduler:

1. detects the overlap
2. scores both events to decide which one is safer to keep
3. generates valid alternative time slots for the event that should move
4. ranks those slots with heuristic rules and a lightweight learned preference model
5. returns two distinct recommendation choices for the user
6. learns from which choice the user selects, rejects, or overrides manually

The design is hybrid:

- deterministic rules handle safety and feasibility
- a lightweight ML layer (online logistic regression, pairwise Bradley-Terry) learns user rescheduling preferences over time
- the frontend mirrors the scheduling engine logic in TypeScript so it works fully offline

---

## Project Status

| Layer | Status | Notes |
|-------|--------|-------|
| **Scheduling Engine** (C# .NET 8) | ✅ Complete | All models + services built and tested |
| **Frontend UI** (React PWA) | ✅ Complete | Full calendar, AI panel, insights, settings |
| **Scheduling Logic (TS)** | ✅ Complete | JS port of C# engine in `tempo/src/lib/scheduling.ts` |
| **State Management** | ✅ Complete | Zustand + localStorage persistence |
| **PWA Manifest** | ✅ Complete | Installable, theme-color, icons |
| **Web API** (.NET) | ⬜ Not started | See API section below |
| **Database** | ⬜ Not started | SQLite / PostgreSQL via EF Core |
| **OpenAI Integration** | ⬜ Not started | Connector stub ready |
| **Auth0 / OAuth 2.0** | ⬜ Not started | Settings page placeholder present |

---

## File Structure

```text
Tempo/
|-- src/
|   `-- Tempo.AgenticScheduling/          ✅ scheduling engine (C# .NET 8)
|       |-- Connectors/
|       |   `-- .gitkeep                  ⬜ API connectors go here
|       |-- Models/
|       |   |-- CalendarEvent.cs
|       |   |-- ConflictResolution.cs
|       |   |-- EventCategory.cs
|       |   |-- EventFlexibility.cs
|       |   |-- FeatureVector.cs
|       |   |-- LearnedPreferenceModel.cs
|       |   |-- PairwiseChoiceSelection.cs
|       |   |-- PairwiseSchedulingFeedbackSample.cs
|       |   |-- PreferredTimeWindow.cs
|       |   |-- RescheduleOption.cs
|       |   |-- SchedulingRequest.cs
|       |   |-- TimeRange.cs
|       `-- Services/
|           |-- CandidateWindowGenerator.cs
|           |-- ChoiceOptionSelector.cs
|           |-- EventStabilityScorer.cs
|           |-- RescheduleFeatureExtractor.cs
|           |-- RescheduleOptionScorer.cs
|           |-- ScheduleConflictResolver.cs
|           `-- UserPreferenceLearningService.cs
|-- tests/
|   `-- Tempo.AgenticScheduling.Tests/    ✅ unit tests pass
|       |-- ScheduleConflictResolverTests.cs
|       `-- Tempo.AgenticScheduling.Tests.csproj
|-- tempo/                                ✅ React PWA frontend
|   |-- public/
|   |   |-- manifest.json                 ✅ PWA manifest
|   |   `-- tempo-icon.svg
|   `-- src/
|       |-- components/
|       |   |-- ai/
|       |   |   `-- AIAssistantPanel.tsx  ✅ AI chat + conflict resolution UI
|       |   |-- calendar/
|       |   |   |-- EventDetailPanel.tsx  ✅ event popover (view/edit/delete)
|       |   |   |-- EventModal.tsx        ✅ create/edit dialog
|       |   |   |-- MiniCalendar.tsx      ✅ sidebar mini-month
|       |   |   `-- WeekView.tsx          ✅ week/day grid with overlap layout
|       |   |-- insights/
|       |   |   `-- InsightsDashboard.tsx ✅ productivity analytics
|       |   |-- layout/
|       |   |   |-- AppShell.tsx          ✅ root layout
|       |   |   |-- Header.tsx            ✅ date nav, view toggle, notifications
|       |   |   `-- Sidebar.tsx           ✅ collapsible nav + mini calendar
|       |   `-- notifications/
|       |       `-- NotificationCenter.tsx ✅ notification dropdown
|       |-- data/
|       |   `-- mockData.ts               ✅ sample events + user profile
|       |-- lib/
|       |   |-- scheduling.ts             ✅ JS port of C# scheduling engine
|       |   `-- utils.ts                  ✅ category colors, time helpers
|       |-- pages/
|       |   |-- CalendarPage.tsx          ✅
|       |   |-- InsightsPage.tsx          ✅
|       |   `-- SettingsPage.tsx          ✅
|       |-- stores/
|       |   `-- appStore.ts               ✅ Zustand store (localStorage)
|       `-- types/
|           `-- index.ts                  ✅ all TypeScript interfaces
|-- .gitignore
|-- LICENSE
`-- README.md
```

---

## Running the Frontend

```bash
cd tempo
npm install
npm run dev
# → http://localhost:5173
```

## Running the Tests (requires .NET 8 SDK)

```bash
dotnet test tests/Tempo.AgenticScheduling.Tests/
```

## Grok AI and Netlify Deployment

Tempo's AI panel now calls a Netlify Function that forwards chat requests to Grok. Keep the API key in Netlify environment variables, not in the browser.

### Local setup

1. Copy `tempo/.env.example` to `tempo/.env`.
2. Set `GROK_API_KEY` to your xAI key.
3. If you want to use a different Grok model or endpoint, update `GROK_MODEL` and `GROK_API_URL`.
4. Run the app with `cd tempo && npm run dev`.

### Netlify deployment

1. Push the repo to GitHub.
2. In Netlify, create a new site from Git.
3. Set the base directory to `tempo`.
4. Use build command `npm run build` and publish directory `dist`.
5. Add environment variables in Netlify:
    - `GROK_API_KEY`
    - `GROK_MODEL`
    - `GROK_API_URL`
6. Keep `VITE_AI_CHAT_ENDPOINT=/.netlify/functions/grok-chat` for the frontend if you use a local `.env` file.
7. Deploy the site.

### Notes

- The frontend only sends chat messages to the Netlify Function.
- The Netlify Function talks to Grok using the secret key.
- If you change the function path, update `VITE_AI_CHAT_ENDPOINT` and `netlify.toml` together.

---

## Scheduling Engine — Core Flow

- `ScheduleConflictResolver` — main entry point, resolves the first detected overlap
- `EventStabilityScorer` — decides which conflicting event is more important to keep
- `CandidateWindowGenerator` — finds open slots that respect workday bounds and travel buffer
- `RescheduleOptionScorer` — scores each slot using heuristic + learned preference signals
- `ChoiceOptionSelector` — picks two meaningfully different options for the user
- `UserPreferenceLearningService` — updates the learned model from pairwise user choices

The same logic is mirrored in `tempo/src/lib/scheduling.ts` so the frontend works fully without a backend.

---

## Where APIs Need to Be Added

### 1. Backend Web API — `src/Tempo.Api/` *(not yet created)*

A new .NET Web API project should be created at `src/Tempo.Api/`. It will expose the scheduling engine over HTTP and connect to a database.

**Controllers needed:**

| Controller | Endpoints | Connects to |
|------------|-----------|------------|
| `EventsController` | `GET /api/events`, `POST /api/events`, `PUT /api/events/{id}`, `DELETE /api/events/{id}` | EF Core → SQLite/PostgreSQL |
| `SchedulingController` | `POST /api/scheduling/resolve-conflict`, `POST /api/scheduling/feedback`, `POST /api/scheduling/optimize` | `ScheduleConflictResolver`, `UserPreferenceLearningService` |
| `AIAgentController` | `POST /api/ai/chat`, `POST /api/ai/suggest` | `Connectors/OpenAIConnector.cs` |
| `InsightsController` | `GET /api/insights/productivity`, `GET /api/insights/habits` | `behavior_logs` table |
| `UsersController` | `GET /api/users/me`, `PUT /api/users/me/preferences` | `users` table |
| `NotificationsController` | `GET /api/notifications`, `PUT /api/notifications/{id}/read` | `notifications` table |

### 2. OpenAI Connector — `src/Tempo.AgenticScheduling/Connectors/OpenAIConnector.cs` *(stub only)*

Implement here:
- Natural language event parsing via GPT-4o function calling
- Human-readable explanations for conflict resolutions
- Proactive schedule suggestions

```csharp
// Tempo.AgenticScheduling/Connectors/OpenAIConnector.cs
public sealed class OpenAIConnector
{
    // TODO: inject IOpenAIClient
    public Task<CalendarEvent> ParseNaturalLanguageAsync(string userText) { ... }
    public Task<string> ExplainResolutionAsync(ConflictResolution resolution) { ... }
}
```

The frontend stub is at `tempo/src/lib/scheduling.ts → simulateAIResponse()`.
Replace it with a `fetch('POST /api/ai/chat', { body: message })` call when the API is ready.

### 3. Frontend API Service — `tempo/src/services/` *(not yet created)*

Create these files to replace mock data with real API calls:

```
tempo/src/services/
├── api.ts            # base Axios/fetch client (add auth headers here)
├── eventService.ts   # replaces mockData.ts MOCK_EVENTS
├── aiService.ts      # replaces simulateAIResponse() in scheduling.ts
└── authService.ts    # Auth0 token management
```

**Swap points in the codebase:**

| File | Line / Function | What to replace |
|------|----------------|-----------------|
| `stores/appStore.ts` | `createEvent()` | Call `POST /api/events`, then run local conflict check |
| `stores/appStore.ts` | `events: MOCK_EVENTS` (initial state) | Call `GET /api/events?from=...&to=...` via React Query |
| `lib/scheduling.ts` | `simulateAIResponse()` | Call `POST /api/ai/chat` |
| `components/insights/InsightsDashboard.tsx` | `MOCK_INSIGHTS` | Call `GET /api/insights/productivity` |
| `components/notifications/NotificationCenter.tsx` | `MOCK_NOTIFICATIONS` | Call `GET /api/notifications` |

### 4. Auth0 — `tempo/src/services/authService.ts` *(not yet created)*

The settings page already has a placeholder. When adding Auth0:

1. Install `@auth0/auth0-react`
2. Wrap `<App>` in `<Auth0Provider domain="..." clientId="...">`
3. Add `useAuth0()` hook to `Header.tsx` for login/logout
4. Add Bearer token to every API request in `api.ts`
5. Protect all backend controllers with `[Authorize]`

### 5. Persistence Adapter — `src/Tempo.AgenticScheduling/Connectors/` *(stub only)*

The learned preference model (`LearnedPreferenceModel`) currently lives in memory. A persistence adapter should save/load it:

```csharp
// Connectors/PersistenceAdapter.cs
public interface IPreferenceModelRepository
{
    Task<LearnedPreferenceModel> LoadAsync(Guid userId);
    Task SaveAsync(Guid userId, LearnedPreferenceModel model);
}
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, TypeScript |
| Styling | TailwindCSS 3, shadcn/ui, framer-motion |
| State | Zustand (persist middleware) |
| Routing | React Router v7 |
| Dates | date-fns |
| Backend | C# .NET 8, ASP.NET Core Web API *(planned)* |
| Database | SQLite / PostgreSQL via EF Core *(planned)* |
| AI | OpenAI GPT-4o via function calling *(planned)* |
| Auth | Auth0 / OAuth 2.0 *(planned)* |
| PWA | Web App Manifest, Service Worker *(manifest done)* |
