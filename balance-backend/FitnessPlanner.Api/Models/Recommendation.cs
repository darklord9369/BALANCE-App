namespace FitnessPlanner.Api.Models;

public class Recommendation : BaseEntity
{
    public long RecommendationId { get; set; }
    public long UserId { get; set; }
    public long RecommendationTypeId { get; set; }
    public long? EventId { get; set; }
    public long? WellnessLogId { get; set; }
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public string Priority { get; set; } = "medium";
    public DateOnly GeneratedForDate { get; set; }
    public string DeliveryChannel { get; set; } = "in_app";
}
