namespace FitnessPlanner.Api.DTOs.DailyGuidance;

public class DailyGuidanceContextDto
{
    public string SelectedDate { get; set; } = "";
    public string StressLevel { get; set; } = "";

    public List<string> RecentWorkouts { get; set; } = new();
    public List<string> RecentMeals { get; set; } = new();
    public List<string> UpcomingEvents { get; set; } = new();

    public List<string> TodayCompletedWorkouts { get; set; } = new();
    public List<string> TodayCompletedMeals { get; set; } = new();

    public List<string> PriorInitialWorkoutPlan { get; set; } = new();
    public List<string> PriorCurrentWorkoutPlan { get; set; } = new();
    public List<string> PriorInitialMealPlan { get; set; } = new();
    public List<string> PriorCurrentMealPlan { get; set; } = new();

    public int? Age { get; set; }
    public string? DietType { get; set; }
    public bool? IsVegan { get; set; }
    public bool? IsGlutenFree { get; set; }
    public string? Allergens { get; set; }
}