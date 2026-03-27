namespace FitnessPlanner.Api.Models;

public class RecommendationType : BaseEntity
{
    public long RecommendationTypeId { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
}
