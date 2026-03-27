namespace FitnessPlanner.Api.Models;

public class User : BaseEntity
{
    public long UserId { get; set; }
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string FirstName { get; set; } = null!;
    public string? LastName { get; set; }
    public string Timezone { get; set; } = "America/Indiana/Indianapolis";
    public string Role { get; set; } = "student";

    public UserProfile? Profile { get; set; }
    public ICollection<Event> Events { get; set; } = new List<Event>();
    public ICollection<WorkoutLog> WorkoutLogs { get; set; } = new List<WorkoutLog>();
    public ICollection<MealLog> MealLogs { get; set; } = new List<MealLog>();
    public ICollection<WellnessLog> WellnessLogs { get; set; } = new List<WellnessLog>();
    public ICollection<WeeklySummary> WeeklySummaries { get; set; } = new List<WeeklySummary>();
}
