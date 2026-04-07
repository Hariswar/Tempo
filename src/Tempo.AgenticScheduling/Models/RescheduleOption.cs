namespace Tempo.AgenticScheduling.Models;

public sealed record RescheduleOption(
    DateTime ProposedStartUtc,
    DateTime ProposedEndUtc,
    double Score,
    IReadOnlyCollection<string> Reasons);
