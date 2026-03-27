namespace FitnessPlanner.Api.Models;

public class Event : BaseEntity
{
    public long EventId { get; set; }
    public long UserId { get; set; }
    public long EventTypeId { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string StressLevel { get; set; } = "moderate";
    public string Source { get; set; } = "manual";

    public User User { get; set; } = null!;
    public EventType EventType { get; set; } = null!;
}
