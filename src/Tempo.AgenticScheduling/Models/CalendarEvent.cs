namespace Tempo.AgenticScheduling.Models;

public sealed record CalendarEvent(
    Guid Id,
    string Title,
    EventCategory Category,
    DateTime StartUtc,
    DateTime EndUtc,
    EventFlexibility Flexibility,
    bool IsRecurring = false,
    bool HasExternalAttendees = false,
    int AttendeeCount = 1,
    DateTime? DeadlineUtc = null,
    string? LocationLabel = null)
{
    public TimeSpan Duration => EndUtc - StartUtc;

    public TimeRange AsRange() => new(StartUtc, EndUtc);
}
