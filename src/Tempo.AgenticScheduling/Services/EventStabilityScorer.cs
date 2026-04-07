using Tempo.AgenticScheduling.Models;

namespace Tempo.AgenticScheduling.Services;

public sealed class EventStabilityScorer
{
    public (double Score, IReadOnlyCollection<string> Reasons) Score(
        CalendarEvent calendarEvent,
        UserBehaviorProfile profile,
        DateTime evaluationTimeUtc)
    {
        var reasons = new List<string>();
        var score = GetCategoryBaseScore(calendarEvent.Category);

        score += GetFlexibilityAdjustment(calendarEvent.Flexibility);
        if (calendarEvent.HasExternalAttendees)
        {
            score += 2.0d;
            reasons.Add("includes external attendees");
        }

        if (calendarEvent.AttendeeCount >= 3)
        {
            score += 1.0d;
            reasons.Add("involves multiple attendees");
        }

        if (calendarEvent.IsRecurring)
        {
            score += 0.5d;
            reasons.Add("is a recurring commitment");
        }

        if (calendarEvent.DeadlineUtc is { } deadlineUtc)
        {
            var hoursUntilDeadline = (deadlineUtc - evaluationTimeUtc).TotalHours;
            if (hoursUntilDeadline <= 48)
            {
                score += 2.0d;
                reasons.Add("is close to a deadline");
            }
        }

        var moveResistance = profile.GetMoveResistance(calendarEvent.Category);
        score += moveResistance * 2.0d;
        if (moveResistance >= 0.7d)
        {
            reasons.Add("historically resists being moved");
        }

        var completionLikelihood = profile.GetCompletionLikelihood(calendarEvent.Category);
        score += completionLikelihood;
        if (completionLikelihood >= 0.7d)
        {
            reasons.Add("is usually completed by the user");
        }

        if (reasons.Count == 0)
        {
            reasons.Add("base event importance");
        }

        return (score, reasons);
    }

    private static double GetCategoryBaseScore(EventCategory category) =>
        category switch
        {
            EventCategory.ResearchMeeting => 5.0d,
            EventCategory.WorkMeeting => 4.5d,
            EventCategory.Class => 4.5d,
            EventCategory.DeadlineTask => 4.0d,
            EventCategory.FocusBlock => 3.0d,
            EventCategory.Exercise => 2.0d,
            EventCategory.Personal => 2.0d,
            EventCategory.Errand => 1.5d,
            EventCategory.Meal => 1.5d,
            _ => 1.0d
        };

    private static double GetFlexibilityAdjustment(EventFlexibility flexibility) =>
        flexibility switch
        {
            EventFlexibility.Fixed => 3.0d,
            EventFlexibility.SemiFlexible => 1.0d,
            _ => 0.0d
        };
}
