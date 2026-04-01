using Tempo.AgenticScheduling.Models;

namespace Tempo.AgenticScheduling.Services;

public sealed class RescheduleFeatureExtractor
{
    public FeatureVector Extract(
        CalendarEvent eventToMove,
        TimeRange candidate,
        UserBehaviorProfile profile,
        DateTime evaluationTimeUtc)
    {
        var localStart = TimeZoneInfo.ConvertTimeFromUtc(candidate.StartUtc, profile.TimeZone);
        var localEnd = TimeZoneInfo.ConvertTimeFromUtc(candidate.EndUtc, profile.TimeZone);
        var preferenceMatch = profile.PreferredTimeWindows
            .Where(window => window.Category == eventToMove.Category && window.Contains(localStart, localEnd))
            .OrderByDescending(window => window.PreferenceWeight)
            .FirstOrDefault();

        var disruptionHours = Math.Abs((candidate.StartUtc - eventToMove.StartUtc).TotalHours);
        var dayOffset = Math.Max(0.0d, (candidate.StartUtc.Date - evaluationTimeUtc.Date).TotalDays);
        var completionLikelihood = profile.GetCompletionLikelihood(eventToMove.Category);
        var moveResistance = profile.GetMoveResistance(eventToMove.Category);

        var values = new Dictionary<string, double>
        {
            ["preferred_window_match"] = preferenceMatch is not null ? 1.0d : 0.0d,
            ["preferred_window_weight"] = preferenceMatch?.PreferenceWeight ?? 0.0d,
            ["completion_likelihood"] = completionLikelihood,
            ["move_resistance"] = moveResistance,
            ["same_day"] = candidate.StartUtc.Date == eventToMove.StartUtc.Date ? 1.0d : 0.0d,
            ["day_offset_normalized"] = Math.Min(dayOffset / 7.0d, 1.0d),
            ["disruption_hours_normalized"] = Math.Min(disruptionHours / 12.0d, 1.0d),
            ["quiet_hours_conflict"] = IsWithinQuietHours(localStart, localEnd, profile) ? 1.0d : 0.0d,
            ["slot_morning"] = localStart.Hour < 12 ? 1.0d : 0.0d,
            ["slot_afternoon"] = localStart.Hour >= 12 && localStart.Hour < 17 ? 1.0d : 0.0d,
            ["slot_evening"] = localStart.Hour >= 17 ? 1.0d : 0.0d,
            ["duration_hours_normalized"] = Math.Min(eventToMove.Duration.TotalHours / 4.0d, 1.0d),
            ["is_recurring"] = eventToMove.IsRecurring ? 1.0d : 0.0d,
            ["has_external_attendees"] = eventToMove.HasExternalAttendees ? 1.0d : 0.0d,
            ["attendee_count_normalized"] = Math.Min(eventToMove.AttendeeCount / 10.0d, 1.0d)
        };

        foreach (var category in Enum.GetValues<EventCategory>())
        {
            values[$"category_{category.ToString().ToLowerInvariant()}"] = eventToMove.Category == category ? 1.0d : 0.0d;
        }

        return new FeatureVector(values);
    }

    private static bool IsWithinQuietHours(DateTime localStart, DateTime localEnd, UserBehaviorProfile profile)
    {
        var start = TimeOnly.FromDateTime(localStart);
        var end = TimeOnly.FromDateTime(localEnd);

        if (profile.QuietHoursStartLocal <= profile.QuietHoursEndLocal)
        {
            return start < profile.QuietHoursEndLocal && end > profile.QuietHoursStartLocal;
        }

        return start >= profile.QuietHoursStartLocal || end <= profile.QuietHoursEndLocal;
    }
}
