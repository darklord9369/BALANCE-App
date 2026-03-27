namespace FitnessPlanner.Api.Models;

public class SummaryEvent
{
    public long SummaryEventId { get; set; }
    public long WeeklySummaryId { get; set; }
    public long EventId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
