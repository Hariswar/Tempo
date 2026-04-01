namespace Tempo.AgenticScheduling.Models;

public sealed record UserBehaviorProfile(
    TimeZoneInfo TimeZone,
    TimeOnly WorkdayStartLocal,
    TimeOnly WorkdayEndLocal,
    TimeOnly QuietHoursStartLocal,
    TimeOnly QuietHoursEndLocal,
    TimeSpan DefaultTravelBuffer,
    IReadOnlyCollection<PreferredTimeWindow> PreferredTimeWindows,
    IReadOnlyDictionary<EventCategory, double> CategoryMoveResistance,
    IReadOnlyDictionary<EventCategory, double> CategoryCompletionLikelihood)
{
    public double GetMoveResistance(EventCategory category)
    {
        return CategoryMoveResistance.TryGetValue(category, out var value) ? value : 0.5d;
    }

    public double GetCompletionLikelihood(EventCategory category)
    {
        return CategoryCompletionLikelihood.TryGetValue(category, out var value) ? value : 0.5d;
    }

    public LearnedPreferenceModel LearnedPreferenceModel { get; init; } = LearnedPreferenceModel.Empty;
}
