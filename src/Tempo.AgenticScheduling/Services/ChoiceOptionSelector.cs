using Tempo.AgenticScheduling.Models;

namespace Tempo.AgenticScheduling.Services;

public sealed class ChoiceOptionSelector
{
    private static readonly TimeSpan MinimumTimeSeparation = TimeSpan.FromMinutes(90);

    public IReadOnlyCollection<RescheduleOption> Select(
        IReadOnlyCollection<RescheduleOption> rankedOptions,
        int choiceCount = 2)
    {
        var selected = new List<RescheduleOption>(choiceCount);

        foreach (var option in rankedOptions)
        {
            if (selected.Count == 0 || selected.All(existing => IsMeaningfullyDifferent(existing, option)))
            {
                selected.Add(option);
            }

            if (selected.Count == choiceCount)
            {
                return selected;
            }
        }

        foreach (var option in rankedOptions)
        {
            if (selected.Any(existing => existing.ProposedStartUtc == option.ProposedStartUtc &&
                                        existing.ProposedEndUtc == option.ProposedEndUtc))
            {
                continue;
            }

            selected.Add(option);
            if (selected.Count == choiceCount)
            {
                break;
            }
        }

        return selected;
    }

    private static bool IsMeaningfullyDifferent(RescheduleOption existing, RescheduleOption candidate)
    {
        if (existing.ProposedStartUtc.Date != candidate.ProposedStartUtc.Date)
        {
            return true;
        }

        var separation = (candidate.ProposedStartUtc - existing.ProposedStartUtc).Duration();
        if (separation >= MinimumTimeSeparation)
        {
            return true;
        }

        return GetTimeBucket(existing.ProposedStartUtc) != GetTimeBucket(candidate.ProposedStartUtc);
    }

    private static string GetTimeBucket(DateTime startUtc)
    {
        return startUtc.Hour switch
        {
            < 12 => "morning",
            < 17 => "afternoon",
            _ => "evening"
        };
    }
}
