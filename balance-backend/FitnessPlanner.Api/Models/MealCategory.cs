namespace FitnessPlanner.Api.Models;

public class MealCategory : BaseEntity
{
    public long MealCategoryId { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }

    public ICollection<MealLog> MealLogs { get; set; } = new List<MealLog>();
}
