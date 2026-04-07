using Tempo.AgenticScheduling.Models;

namespace Tempo.AgenticScheduling.Services;

public sealed class ScheduleConflictResolver
{
    private readonly EventStabilityScorer _stabilityScorer = new();
    private readonly CandidateWindowGenerator _candidateWindowGenerator = new();
    private readonly RescheduleOptionScorer _rescheduleOptionScorer = new();
    private readonly ChoiceOptionSelector _choiceOptionSelector = new();

    public ConflictResolution? Resolve(SchedulingRequest request)
    {
        var overlappingEvent = request.ExistingEvents
            .Where(existing => existing.AsRange().Overlaps(request.IncomingEvent.AsRange()))
            .OrderBy(existing => existing.StartUtc)
            .FirstOrDefault();

        if (overlappingEvent is null)
        {
            return null;
        }

        var incomingScore = _stabilityScorer.Score(request.IncomingEvent, request.UserProfile, request.EvaluationTimeUtc);
        var existingScore = _stabilityScorer.Score(overlappingEvent, request.UserProfile, request.EvaluationTimeUtc);

        var keepIncoming = incomingScore.Score >= existingScore.Score;
        var eventToKeep = keepIncoming ? request.IncomingEvent : overlappingEvent;
        var eventToMove = keepIncoming ? overlappingEvent : request.IncomingEvent;
        var keepScore = keepIncoming ? incomingScore.Score : existingScore.Score;
        var moveScore = keepIncoming ? existingScore.Score : incomingScore.Score;
        var decisionReasons = keepIncoming ? incomingScore.Reasons : existingScore.Reasons;

        if (eventToMove.Flexibility == EventFlexibility.Fixed)
        {
            return new ConflictResolution(
                eventToKeep,
                eventToMove,
                keepScore,
                moveScore,
                decisionReasons.Concat(new[] { "the other event is fixed and requires manual review" }).ToArray(),
                Array.Empty<RescheduleOption>(),
                Array.Empty<RescheduleOption>());
        }

        var candidateRanges = _candidateWindowGenerator.Generate(
            eventToMove,
            request.ExistingEvents.Append(request.IncomingEvent).ToArray(),
            request.UserProfile,
            request.EvaluationTimeUtc,
            request.SearchHorizonDays);

        var rankedAlternatives = candidateRanges
            .Select(candidate => _rescheduleOptionScorer.Score(eventToMove, candidate, request.UserProfile, request.EvaluationTimeUtc))
            .OrderByDescending(option => option.Score)
            .ToArray();

        var choiceOptions = _choiceOptionSelector.Select(rankedAlternatives, choiceCount: Math.Min(2, request.MaxSuggestions));
        var alternatives = rankedAlternatives
            .Take(request.MaxSuggestions)
            .ToArray();

        return new ConflictResolution(
            eventToKeep,
            eventToMove,
            keepScore,
            moveScore,
            decisionReasons,
            choiceOptions,
            alternatives);
    }
}
