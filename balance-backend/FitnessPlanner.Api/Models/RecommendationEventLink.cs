namespace FitnessPlanner.Api.Models;

public class RecommendationEventLink
{
    public long RecommendationEventLinkId { get; set; }
    public long RecommendationId { get; set; }
    public long EventId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
