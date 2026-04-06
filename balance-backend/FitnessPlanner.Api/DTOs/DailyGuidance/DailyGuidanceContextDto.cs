namespace FitnessPlanner.Api.DTOs.DailyGuidance;

public class DailyGuidanceContextDto
{
    public string SelectedDate { get; set; } = string.Empty;
    public string StressLevel { get; set; } = "Medium";

    public List<string> RecentWorkouts { get; set; } = new();
    public List<string> RecentMeals { get; set; } = new();
    public List<string> UpcomingEvents { get; set; } = new();

    public List<string> TodayCompletedWorkouts { get; set; } = new();
    public List<string> TodayCompletedMeals { get; set; } = new();

    public List<string>? PriorInitialWorkoutPlan { get; set; }
    public List<string>? PriorInitialMealPlan { get; set; }
    public List<string>? PriorCurrentWorkoutPlan { get; set; }
    public List<string>? PriorCurrentMealPlan { get; set; }
}