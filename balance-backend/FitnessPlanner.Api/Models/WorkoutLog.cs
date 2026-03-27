namespace FitnessPlanner.Api.Models;

public class WorkoutLog : BaseEntity
{
    public long WorkoutLogId { get; set; }
    public long UserId { get; set; }
    public long WorkoutTypeId { get; set; }
    public long? EventId { get; set; }
    public DateOnly WorkoutDate { get; set; }
    public int? DurationMinutes { get; set; }
    public string? PerceivedIntensity { get; set; }
    public int? EffortScore { get; set; }
    public string? SkipReason { get; set; }
    public string Source { get; set; } = "manual";
    public string? Notes { get; set; }

    public User User { get; set; } = null!;
    public WorkoutType WorkoutType { get; set; } = null!;
    public Event? Event { get; set; }
}
