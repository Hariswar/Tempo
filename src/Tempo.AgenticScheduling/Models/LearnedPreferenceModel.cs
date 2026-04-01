namespace Tempo.AgenticScheduling.Models;

public sealed record LearnedPreferenceModel(
    double Bias,
    IReadOnlyDictionary<string, double> Weights,
    int TrainingSampleCount)
{
    public static LearnedPreferenceModel Empty { get; } = new(0.0d, new Dictionary<string, double>(), 0);

    public double PredictUtility(FeatureVector featureVector)
    {
        var linearScore = Bias;
        foreach (var (featureName, featureValue) in featureVector.Values)
        {
            if (Weights.TryGetValue(featureName, out var weight))
            {
                linearScore += weight * featureValue;
            }
        }

        return linearScore;
    }

    public double PredictAcceptanceProbability(FeatureVector featureVector)
    {
        return Sigmoid(PredictUtility(featureVector));
    }

    public double PredictPreferenceProbability(FeatureVector firstOption, FeatureVector secondOption)
    {
        return Sigmoid(PredictUtility(firstOption) - PredictUtility(secondOption));
    }

    public LearnedPreferenceModel Train(
        FeatureVector featureVector,
        bool accepted,
        double learningRate = 0.18d,
        double regularizationStrength = 0.01d)
    {
        var target = accepted ? 1.0d : 0.0d;
        var prediction = PredictAcceptanceProbability(featureVector);
        var error = target - prediction;

        var updatedWeights = new Dictionary<string, double>(Weights.Count + featureVector.Values.Count);
        foreach (var (featureName, weight) in Weights)
        {
            updatedWeights[featureName] = ApplyRegularization(weight, learningRate, regularizationStrength);
        }

        foreach (var (featureName, featureValue) in featureVector.Values)
        {
            updatedWeights.TryGetValue(featureName, out var currentWeight);
            var updatedWeight = currentWeight + (learningRate * error * featureValue);
            updatedWeights[featureName] = Clamp(updatedWeight, -6.0d, 6.0d);
        }

        var updatedBias = Clamp(Bias + (learningRate * error), -6.0d, 6.0d);
        return new LearnedPreferenceModel(updatedBias, updatedWeights, TrainingSampleCount + 1);
    }

    public LearnedPreferenceModel TrainPairwise(
        FeatureVector preferredOption,
        FeatureVector otherOption,
        double learningRate = 0.18d,
        double regularizationStrength = 0.01d)
    {
        var difference = BuildDifferenceVector(preferredOption, otherOption);
        var prediction = Sigmoid(ScoreDifference(difference));
        var error = 1.0d - prediction;

        var updatedWeights = new Dictionary<string, double>(Weights.Count + difference.Count);
        foreach (var (featureName, weight) in Weights)
        {
            updatedWeights[featureName] = ApplyRegularization(weight, learningRate, regularizationStrength);
        }

        foreach (var (featureName, differenceValue) in difference)
        {
            updatedWeights.TryGetValue(featureName, out var currentWeight);
            var updatedWeight = currentWeight + (learningRate * error * differenceValue);
            updatedWeights[featureName] = Clamp(updatedWeight, -6.0d, 6.0d);
        }

        return new LearnedPreferenceModel(Bias, updatedWeights, TrainingSampleCount + 1);
    }

    private static double ApplyRegularization(double value, double learningRate, double regularizationStrength)
    {
        return value * (1.0d - (learningRate * regularizationStrength));
    }

    private double ScoreDifference(IReadOnlyDictionary<string, double> difference)
    {
        var score = 0.0d;
        foreach (var (featureName, value) in difference)
        {
            if (Weights.TryGetValue(featureName, out var weight))
            {
                score += weight * value;
            }
        }

        return score;
    }

    private static IReadOnlyDictionary<string, double> BuildDifferenceVector(
        FeatureVector first,
        FeatureVector second)
    {
        var featureNames = first.Values.Keys.Concat(second.Values.Keys).Distinct();
        var difference = new Dictionary<string, double>();

        foreach (var featureName in featureNames)
        {
            difference[featureName] = first.GetValue(featureName) - second.GetValue(featureName);
        }

        return difference;
    }

    private static double Sigmoid(double value)
    {
        return 1.0d / (1.0d + Math.Exp(-value));
    }

    private static double Clamp(double value, double min, double max)
    {
        return Math.Max(min, Math.Min(max, value));
    }
}
