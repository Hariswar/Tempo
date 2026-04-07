namespace Tempo.AgenticScheduling.Models;

public sealed record ConflictResolution(
    CalendarEvent EventToKeep,
    CalendarEvent EventToMove,
    double KeepScore,
    double MoveScore,
    IReadOnlyCollection<string> DecisionReasons,
    IReadOnlyCollection<RescheduleOption> ChoiceOptions,
    IReadOnlyCollection<RescheduleOption> SuggestedAlternatives);
