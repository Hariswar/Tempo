using Tempo.AgenticScheduling.Models;

namespace Tempo.AgenticScheduling.Services;

public sealed class RescheduleOptionScorer
{
    private const double LearnedSignalScale = 6.0d;
    private readonly RescheduleFeatureExtractor _featureExtractor = new();

    public RescheduleOption Score(
        CalendarEvent eventToMove,
        TimeRange candidate,
        UserBehaviorProfile profile,
        DateTime evaluationTimeUtc)
    {
        var reasons = new List<string>();
        var score = 0.0d;

        var localStart = TimeZoneInfo.ConvertTimeFromUtc(candidate.StartUtc, profile.TimeZone);
        var localEnd = TimeZoneInfo.ConvertTimeFromUtc(candidate.EndUtc, profile.TimeZone);

        var preferenceMatch = profile.PreferredTimeWindows
            .Where(window => window.Category == eventToMove.Category && window.Contains(localStart, localEnd))
            .OrderByDescending(window => window.PreferenceWeight)
            .FirstOrDefault();

        if (preferenceMatch is not null)
        {
            score += preferenceMatch.PreferenceWeight * 4.0d;
            reasons.Add("fits a preferred historical time window");
        }
        else
        {
            score -= 1.0d;
            reasons.Add("falls outside known preferred time windows");
        }

        var originalStart = eventToMove.StartUtc;
        var disruptionHours = Math.Abs((candidate.StartUtc - originalStart).TotalHours);
        score -= Math.Min(disruptionHours / 2.0d, 4.0d);
        if (disruptionHours <= 6)
        {
            score += 1.0d;
            reasons.Add("keeps the event close to the original time");
        }

        if (IsWithinQuietHours(localStart, localEnd, profile))
        {
            score -= 4.0d;
            reasons.Add("conflicts with the user's quiet hours");
        }

        var completionLikelihood = profile.GetCompletionLikelihood(eventToMove.Category);
        score += completionLikelihood * 2.0d;
        if (completionLikelihood >= 0.7d)
        {
            reasons.Add("matches a time the user usually follows through on");
        }

        if (profile.LearnedPreferenceModel.TrainingSampleCount > 0)
        {
            var featureVector = _featureExtractor.Extract(eventToMove, candidate, profile, evaluationTimeUtc);
            var acceptanceProbability = profile.LearnedPreferenceModel.PredictAcceptanceProbability(featureVector);
            var learnedAdjustment = (acceptanceProbability - 0.5d) * LearnedSignalScale;
            score += learnedAdjustment;

            if (acceptanceProbability >= 0.65d)
            {
                reasons.Add("matches learned user acceptance patterns");
            }
            else if (acceptanceProbability <= 0.35d)
            {
                reasons.Add("conflicts with learned user acceptance patterns");
            }
        }

        return new RescheduleOption(candidate.StartUtc, candidate.EndUtc, score, reasons);
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
