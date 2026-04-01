using Tempo.AgenticScheduling.Models;

namespace Tempo.AgenticScheduling.Services;

public sealed class UserPreferenceLearningService
{
    private readonly RescheduleFeatureExtractor _featureExtractor = new();

    public LearnedPreferenceModel Train(
        UserBehaviorProfile profile,
        IEnumerable<PairwiseSchedulingFeedbackSample> feedbackSamples,
        LearnedPreferenceModel? seedModel = null)
    {
        var model = seedModel ?? profile.LearnedPreferenceModel;
        foreach (var sample in feedbackSamples.OrderBy(sample => sample.EvaluationTimeUtc))
        {
            var firstOptionFeatures = _featureExtractor.Extract(
                sample.EventToMove,
                new TimeRange(sample.FirstOption.ProposedStartUtc, sample.FirstOption.ProposedEndUtc),
                profile,
                sample.EvaluationTimeUtc);

            var secondOptionFeatures = _featureExtractor.Extract(
                sample.EventToMove,
                new TimeRange(sample.SecondOption.ProposedStartUtc, sample.SecondOption.ProposedEndUtc),
                profile,
                sample.EvaluationTimeUtc);

            model = sample.Selection switch
            {
                PairwiseChoiceSelection.FirstOption => model.TrainPairwise(firstOptionFeatures, secondOptionFeatures),
                PairwiseChoiceSelection.SecondOption => model.TrainPairwise(secondOptionFeatures, firstOptionFeatures),
                PairwiseChoiceSelection.RejectedBoth => model
                    .Train(firstOptionFeatures, accepted: false)
                    .Train(secondOptionFeatures, accepted: false),
                PairwiseChoiceSelection.ManualOverride when sample.ManualOverrideTime is not null => TrainManualOverride(
                    model,
                    sample,
                    profile,
                    firstOptionFeatures,
                    secondOptionFeatures),
                _ => model
            };
        }

        return model;
    }

    public UserBehaviorProfile ApplyFeedback(
        UserBehaviorProfile profile,
        IEnumerable<PairwiseSchedulingFeedbackSample> feedbackSamples,
        LearnedPreferenceModel? seedModel = null)
    {
        var learnedModel = Train(profile, feedbackSamples, seedModel);
        return profile with { LearnedPreferenceModel = learnedModel };
    }

    private LearnedPreferenceModel TrainManualOverride(
        LearnedPreferenceModel model,
        PairwiseSchedulingFeedbackSample sample,
        UserBehaviorProfile profile,
        FeatureVector firstOptionFeatures,
        FeatureVector secondOptionFeatures)
    {
        var manualFeatures = _featureExtractor.Extract(
            sample.EventToMove,
            sample.ManualOverrideTime!,
            profile,
            sample.EvaluationTimeUtc);

        return model
            .TrainPairwise(manualFeatures, firstOptionFeatures)
            .TrainPairwise(manualFeatures, secondOptionFeatures);
    }
}
