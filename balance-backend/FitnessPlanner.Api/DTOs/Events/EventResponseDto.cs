namespace FitnessPlanner.Api.DTOs.Events;

public class EventResponseDto
{
    public long EventId { get; set; }
    public long UserId { get; set; }
    public long EventTypeId { get; set; }
    public string EventTypeName { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string StressLevel { get; set; } = null!;
    public string Status { get; set; } = null!;
}
