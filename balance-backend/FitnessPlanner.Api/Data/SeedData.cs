using FitnessPlanner.Api.Models;

namespace FitnessPlanner.Api.Data;

public static class SeedData
{
    public static void Initialize(AppDbContext db)
    {
        if (!db.EventTypes.Any())
        {
            db.EventTypes.AddRange(
                new EventType { Name = "Exam Week", Category = "academic", Description = "High academic workload week." },
                new EventType { Name = "Project Deadline", Category = "academic", Description = "Major assignment or deliverable due." },
                new EventType { Name = "Race", Category = "physical", Description = "Upcoming race or competition." },
                new EventType { Name = "Heavy Training Week", Category = "physical", Description = "Higher training volume or intensity." }
            );
        }

        if (!db.WorkoutTypes.Any())
        {
            db.WorkoutTypes.AddRange(
                new WorkoutType { Name = "Strength" },
                new WorkoutType { Name = "Run" },
                new WorkoutType { Name = "Walk" },
                new WorkoutType { Name = "Cycling" },
                new WorkoutType { Name = "Yoga" },
                new WorkoutType { Name = "Recovery Session" }
            );
        }

        if (!db.MealCategories.Any())
        {
            db.MealCategories.AddRange(
                new MealCategory { Name = "Carb-heavy" },
                new MealCategory { Name = "Balanced" },
                new MealCategory { Name = "Light" },
                new MealCategory { Name = "Protein-focused" },
                new MealCategory { Name = "Recovery meal" }
            );
        }

        if (!db.RecommendationTypes.Any())
        {
            db.RecommendationTypes.AddRange(
                new RecommendationType { Name = "Workout adjustment" },
                new RecommendationType { Name = "Fueling suggestion" },
                new RecommendationType { Name = "Recovery nudge" },
                new RecommendationType { Name = "Rest recommendation" },
                new RecommendationType { Name = "Weekly insight" }
            );
        }

        db.SaveChanges();
    }
}
