namespace Tempo.AgenticScheduling.Models;

public sealed record TimeRange(DateTime StartUtc, DateTime EndUtc)
{
    public TimeSpan Duration => EndUtc - StartUtc;

    public bool Overlaps(TimeRange other)
    {
        return StartUtc < other.EndUtc && EndUtc > other.StartUtc;
    }
}
