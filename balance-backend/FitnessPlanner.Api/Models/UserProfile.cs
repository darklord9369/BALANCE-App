namespace FitnessPlanner.Api.Models;

public class UserProfile : BaseEntity
{
    public long ProfileId { get; set; }
    public long UserId { get; set; }
    public int? Age { get; set; }
    public string? Sex { get; set; }
    public decimal? HeightCm { get; set; }
    public decimal? WeightKg { get; set; }
    public string ActivityLevel { get; set; } = "moderate";
    public string PrimaryGoal { get; set; } = "consistency";
    public string? TrainingBackground { get; set; }
    public string? SchoolName { get; set; }
    public decimal? TypicalSleepHours { get; set; }

    public User User { get; set; } = null!;
}
