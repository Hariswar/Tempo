namespace Tempo.AgenticScheduling.Models;

public sealed record SchedulingRequest(
    IReadOnlyCollection<CalendarEvent> ExistingEvents,
    CalendarEvent IncomingEvent,
    UserBehaviorProfile UserProfile,
    DateTime EvaluationTimeUtc,
    int SearchHorizonDays = 7,
    int MaxSuggestions = 3);
