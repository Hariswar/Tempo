namespace Tempo.AgenticScheduling.Models;

public sealed record PreferredTimeWindow(
    EventCategory Category,
    DayOfWeek DayOfWeek,
    TimeOnly StartLocalTime,
    TimeOnly EndLocalTime,
    double PreferenceWeight)
{
    public bool Contains(DateTime localStart, DateTime localEnd)
    {
        if (localStart.DayOfWeek != DayOfWeek || localEnd.DayOfWeek != DayOfWeek)
        {
            return false;
        }

        var start = TimeOnly.FromDateTime(localStart);
        var end = TimeOnly.FromDateTime(localEnd);
        return start >= StartLocalTime && end <= EndLocalTime;
    }
}
