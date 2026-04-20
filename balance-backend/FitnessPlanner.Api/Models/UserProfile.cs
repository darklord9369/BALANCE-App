namespace FitnessPlanner.Api.Models;

public class UserProfile
{
    public long UserProfileId { get; set; }
    public long UserId { get; set; }

    public int? Age { get; set; }
    public string? Sex { get; set; }
    public decimal? HeightCm { get; set; }
    public decimal? WeightKg { get; set; }
    public string? ActivityLevel { get; set; }
    public string? PrimaryGoal { get; set; }
    public string? TrainingBackground { get; set; }
    public string? SchoolName { get; set; }
    public decimal? TypicalSleepHours { get; set; }

    public string? DietType { get; set; }
    public bool? IsVegan { get; set; }
    public bool? IsGlutenFree { get; set; }
    public string? Allergens { get; set; }

    public User User { get; set; } = null!;
}