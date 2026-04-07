namespace Tempo.AgenticScheduling.Models;

public sealed record PairwiseSchedulingFeedbackSample(
    CalendarEvent EventToMove,
    RescheduleOption FirstOption,
    RescheduleOption SecondOption,
    DateTime EvaluationTimeUtc,
    PairwiseChoiceSelection Selection,
    TimeRange? ManualOverrideTime = null);
