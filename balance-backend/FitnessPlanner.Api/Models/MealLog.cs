namespace FitnessPlanner.Api.Models;

public class MealLog : BaseEntity
{
    public long MealLogId { get; set; }
    public long UserId { get; set; }
    public long MealCategoryId { get; set; }
    public long? EventId { get; set; }
    public DateOnly MealDate { get; set; }
    public string? MealTime { get; set; }
    public string? Notes { get; set; }
    public string Source { get; set; } = "manual";

    public User User { get; set; } = null!;
    public MealCategory MealCategory { get; set; } = null!;
    public Event? Event { get; set; }
}
