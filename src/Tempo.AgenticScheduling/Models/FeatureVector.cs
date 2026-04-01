namespace Tempo.AgenticScheduling.Models;

public sealed record FeatureVector(IReadOnlyDictionary<string, double> Values)
{
    public double GetValue(string featureName)
    {
        return Values.TryGetValue(featureName, out var value) ? value : 0.0d;
    }
}
