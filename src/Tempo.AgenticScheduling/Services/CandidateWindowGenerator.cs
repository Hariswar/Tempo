using Tempo.AgenticScheduling.Models;

namespace Tempo.AgenticScheduling.Services;

public sealed class CandidateWindowGenerator
{
    private static readonly TimeSpan CandidateIncrement = TimeSpan.FromMinutes(30);

    public IReadOnlyCollection<TimeRange> Generate(
        CalendarEvent eventToMove,
        IReadOnlyCollection<CalendarEvent> existingEvents,
        UserBehaviorProfile profile,
        DateTime evaluationTimeUtc,
        int searchHorizonDays)
    {
        var candidates = new List<TimeRange>();
        var existingRanges = existingEvents
            .Where(e => e.Id != eventToMove.Id)
            .Select(e => e.AsRange())
            .OrderBy(range => range.StartUtc)
            .ToList();

        for (var dayOffset = 0; dayOffset <= searchHorizonDays; dayOffset++)
        {
            var localDay = TimeZoneInfo.ConvertTimeFromUtc(evaluationTimeUtc, profile.TimeZone).Date.AddDays(dayOffset);
            var dayStartUtc = TimeZoneInfo.ConvertTimeToUtc(localDay + profile.WorkdayStartLocal.ToTimeSpan(), profile.TimeZone);
            var dayEndUtc = TimeZoneInfo.ConvertTimeToUtc(localDay + profile.WorkdayEndLocal.ToTimeSpan(), profile.TimeZone);

            var cursor = Max(dayStartUtc, evaluationTimeUtc);
            foreach (var block in existingRanges.Where(r => r.EndUtc > dayStartUtc && r.StartUtc < dayEndUtc))
            {
                AddCandidates(
                    candidates,
                    cursor,
                    block.StartUtc.Subtract(profile.DefaultTravelBuffer),
                    eventToMove.Duration);
                cursor = Max(cursor, block.EndUtc.Add(profile.DefaultTravelBuffer));
            }

            AddCandidates(candidates, cursor, dayEndUtc, eventToMove.Duration);
        }

        return candidates;
    }

    private static void AddCandidates(
        ICollection<TimeRange> candidates,
        DateTime gapStartUtc,
        DateTime gapEndUtc,
        TimeSpan eventDuration)
    {
        if (gapEndUtc <= gapStartUtc)
        {
            return;
        }

        for (var candidateStart = gapStartUtc; candidateStart.Add(eventDuration) <= gapEndUtc; candidateStart = candidateStart.Add(CandidateIncrement))
        {
            candidates.Add(new TimeRange(candidateStart, candidateStart.Add(eventDuration)));
        }
    }

    private static DateTime Max(DateTime first, DateTime second) => first > second ? first : second;
}
