using Tempo.AgenticScheduling.Models;
using Tempo.AgenticScheduling.Services;

namespace Tempo.AgenticScheduling.Tests;

public sealed class ScheduleConflictResolverTests
{
    [Fact]
    public void LearnedPreferenceModel_CanLearnFromTwoChoices_WhenMorningIsRepeatedlyChosen()
    {
        var timeZone = TimeZoneInfo.Utc;
        var profile = BuildProfile(timeZone);
        var trainer = new UserPreferenceLearningService();
        var gymEvent = new CalendarEvent(
            Guid.NewGuid(),
            "Gym",
            EventCategory.Exercise,
            new DateTime(2026, 4, 2, 16, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 4, 2, 17, 0, 0, DateTimeKind.Utc),
            EventFlexibility.Flexible);

        var feedback = BuildFeedback(gymEvent);
        var trainedProfile = trainer.ApplyFeedback(profile, feedback);
        var scorer = new RescheduleOptionScorer();

        var morningOption = scorer.Score(
            gymEvent,
            new TimeRange(
                new DateTime(2026, 4, 2, 9, 0, 0, DateTimeKind.Utc),
                new DateTime(2026, 4, 2, 10, 0, 0, DateTimeKind.Utc)),
            trainedProfile,
            new DateTime(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc));

        var eveningOption = scorer.Score(
            gymEvent,
            new TimeRange(
                new DateTime(2026, 4, 2, 18, 0, 0, DateTimeKind.Utc),
                new DateTime(2026, 4, 2, 19, 0, 0, DateTimeKind.Utc)),
            trainedProfile,
            new DateTime(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc));

        Assert.True(trainedProfile.LearnedPreferenceModel.TrainingSampleCount > 0);
        Assert.True(morningOption.Score > eveningOption.Score);
    }

    [Fact]
    public void Resolve_PrefersResearchMeetingOverGym_WhenTimesConflict()
    {
        var timeZone = TimeZoneInfo.Utc;
        var profile = BuildProfile(timeZone);
        var existingMeeting = new CalendarEvent(
            Guid.NewGuid(),
            "Research meeting",
            EventCategory.ResearchMeeting,
            new DateTime(2026, 4, 2, 16, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 4, 2, 17, 0, 0, DateTimeKind.Utc),
            EventFlexibility.Fixed,
            HasExternalAttendees: true,
            AttendeeCount: 4);

        var incomingGym = new CalendarEvent(
            Guid.NewGuid(),
            "Gym",
            EventCategory.Exercise,
            new DateTime(2026, 4, 2, 16, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 4, 2, 17, 0, 0, DateTimeKind.Utc),
            EventFlexibility.Flexible);

        var request = new SchedulingRequest(
            new[] { existingMeeting },
            incomingGym,
            profile,
            new DateTime(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc));

        var resolver = new ScheduleConflictResolver();
        var result = resolver.Resolve(request);

        Assert.NotNull(result);
        Assert.Equal(existingMeeting.Id, result!.EventToKeep.Id);
        Assert.Equal(incomingGym.Id, result.EventToMove.Id);
        Assert.Equal(2, result.ChoiceOptions.Count);
        Assert.NotEmpty(result.SuggestedAlternatives);
    }

    [Fact]
    public void Resolve_RanksPreferredGymWindowFirst_WhenHistorySupportsEveningWorkout()
    {
        var timeZone = TimeZoneInfo.Utc;
        var profile = BuildProfile(timeZone);
        var existingEvents = new[]
        {
            new CalendarEvent(
                Guid.NewGuid(),
                "Research meeting",
                EventCategory.ResearchMeeting,
                new DateTime(2026, 4, 2, 16, 0, 0, DateTimeKind.Utc),
                new DateTime(2026, 4, 2, 17, 0, 0, DateTimeKind.Utc),
                EventFlexibility.Fixed,
                HasExternalAttendees: true,
                AttendeeCount: 4),
            new CalendarEvent(
                Guid.NewGuid(),
                "Dinner",
                EventCategory.Meal,
                new DateTime(2026, 4, 2, 22, 0, 0, DateTimeKind.Utc),
                new DateTime(2026, 4, 2, 23, 0, 0, DateTimeKind.Utc),
                EventFlexibility.SemiFlexible)
        };

        var incomingGym = new CalendarEvent(
            Guid.NewGuid(),
            "Gym",
            EventCategory.Exercise,
            new DateTime(2026, 4, 2, 16, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 4, 2, 17, 0, 0, DateTimeKind.Utc),
            EventFlexibility.Flexible);

        var request = new SchedulingRequest(
            existingEvents,
            incomingGym,
            profile,
            new DateTime(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc));

        var resolver = new ScheduleConflictResolver();
        var result = resolver.Resolve(request);

        Assert.NotNull(result);
        Assert.Equal(2, result!.ChoiceOptions.Count);
        Assert.Equal(new DateTime(2026, 4, 2, 18, 0, 0, DateTimeKind.Utc), result.ChoiceOptions.First().ProposedStartUtc);
        Assert.NotEqual(result.ChoiceOptions.First().ProposedStartUtc, result.ChoiceOptions.Skip(1).First().ProposedStartUtc);
    }

    private static UserBehaviorProfile BuildProfile(TimeZoneInfo timeZone)
    {
        return new UserBehaviorProfile(
            timeZone,
            new TimeOnly(8, 0),
            new TimeOnly(22, 0),
            new TimeOnly(23, 0),
            new TimeOnly(6, 0),
            TimeSpan.FromMinutes(30),
            new[]
            {
                new PreferredTimeWindow(EventCategory.Exercise, DayOfWeek.Thursday, new TimeOnly(18, 0), new TimeOnly(20, 30), 1.0d),
                new PreferredTimeWindow(EventCategory.Exercise, DayOfWeek.Saturday, new TimeOnly(10, 0), new TimeOnly(12, 0), 0.8d)
            },
            new Dictionary<EventCategory, double>
            {
                [EventCategory.ResearchMeeting] = 0.9d,
                [EventCategory.WorkMeeting] = 0.85d,
                [EventCategory.Exercise] = 0.3d
            },
            new Dictionary<EventCategory, double>
            {
                [EventCategory.Exercise] = 0.9d,
                [EventCategory.ResearchMeeting] = 0.95d
            });
    }

    private static IReadOnlyCollection<PairwiseSchedulingFeedbackSample> BuildFeedback(CalendarEvent gymEvent)
    {
        var samples = new List<PairwiseSchedulingFeedbackSample>();
        var baseDay = new DateTime(2026, 3, 5, 0, 0, 0, DateTimeKind.Utc);

        for (var index = 0; index < 20; index++)
        {
            var optionDay = baseDay.AddDays(index);
            var evaluationDay = optionDay.AddDays(-1).AddHours(12);

            samples.Add(new PairwiseSchedulingFeedbackSample(
                gymEvent,
                new RescheduleOption(
                    optionDay.AddHours(9),
                    optionDay.AddHours(10),
                    0.0d,
                    Array.Empty<string>()),
                new RescheduleOption(
                    optionDay.AddHours(18),
                    optionDay.AddHours(19),
                    0.0d,
                    Array.Empty<string>()),
                evaluationDay,
                PairwiseChoiceSelection.FirstOption));
        }

        return samples;
    }
}
