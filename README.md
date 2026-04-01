# Tempo

Standalone agentic scheduling core for the Tempo project.

## What It Does

When two events conflict, the scheduler:

1. detects the overlap
2. scores both events to decide which one is safer to keep
3. generates valid alternative time slots for the event that should move
4. ranks those slots with heuristic rules and a lightweight learned preference model
5. returns two distinct recommendation choices for the user
6. learns from which choice the user selects, rejects, or overrides manually

The current design is hybrid:

- deterministic rules handle safety and feasibility
- a lightweight ML layer learns user rescheduling preferences over time
- no LLM or external API integration has been added yet

## File Structure

```text
Tempo/
|-- src/
|   `-- Tempo.AgenticScheduling/
|       |-- Connectors/
|       |   `-- .gitkeep
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
|       |   `-- UserBehaviorProfile.cs
|       |-- Services/
|       |   |-- CandidateWindowGenerator.cs
|       |   |-- ChoiceOptionSelector.cs
|       |   |-- EventStabilityScorer.cs
|       |   |-- RescheduleFeatureExtractor.cs
|       |   |-- RescheduleOptionScorer.cs
|       |   |-- ScheduleConflictResolver.cs
|       |   `-- UserPreferenceLearningService.cs
|       `-- Tempo.AgenticScheduling.csproj
|-- tests/
|   `-- Tempo.AgenticScheduling.Tests/
|       |-- ScheduleConflictResolverTests.cs
|       `-- Tempo.AgenticScheduling.Tests.csproj
|-- .gitignore
|-- LICENSE
`-- README.md
```

## Current Core Flow

- `ScheduleConflictResolver` is the main entry point.
- `EventStabilityScorer` decides which conflicting event is more important to keep.
- `CandidateWindowGenerator` finds open slots that respect workday bounds and travel buffer.
- `RescheduleOptionScorer` scores each slot using heuristic signals and learned preference signals.
- `ChoiceOptionSelector` picks two meaningfully different options for the user to choose from.
- `UserPreferenceLearningService` updates the learned model from pairwise user choices.

## Where Connectors Would Go

No connectors are implemented yet.

Connector code should go under `src/Tempo.AgenticScheduling/Connectors/`.

That folder is intended for adapters such as:

- calendar connectors like Google Calendar or Outlook
- OpenAI integration for natural language parsing or explanations
- traffic or location connectors for context-aware travel-time scheduling
- persistence adapters for loading and saving user feedback data

The scheduling engine should stay separate from those connectors so it can be tested independently.

## Current Limitations

- no frontend
- no backend API
- no persistent storage
- no external connectors
- no LLM integration
- tests are present, but a local .NET SDK is required to run them
