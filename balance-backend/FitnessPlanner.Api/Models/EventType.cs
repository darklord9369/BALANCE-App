namespace FitnessPlanner.Api.Models;

public class EventType : BaseEntity
{
    public long EventTypeId { get; set; }
    public string Name { get; set; } = null!;
    public string Category { get; set; } = null!;
    public string? Description { get; set; }

    public ICollection<Event> Events { get; set; } = new List<Event>();
}
