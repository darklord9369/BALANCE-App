using FitnessPlanner.Api.Data;
using FitnessPlanner.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitnessPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WeeklySummariesController : ControllerBase
{
    private readonly AppDbContext _db;
    public WeeklySummariesController(AppDbContext db) => _db = db;

    [HttpPost("generate")]
    public async Task<IActionResult> Generate([FromQuery] long userId, [FromQuery] DateOnly weekStartDate)
    {
        var weekEndDate = weekStartDate.AddDays(6);

        var wellness = await _db.WellnessLogs.Where(x => x.UserId == userId && x.LogDate >= weekStartDate && x.LogDate <= weekEndDate && x.DeletedAt == null).ToListAsync();
        var workouts = await _db.WorkoutLogs.Where(x => x.UserId == userId && x.WorkoutDate >= weekStartDate && x.WorkoutDate <= weekEndDate && x.DeletedAt == null).ToListAsync();
        var meals = await _db.MealLogs.Where(x => x.UserId == userId && x.MealDate >= weekStartDate && x.MealDate <= weekEndDate && x.DeletedAt == null).ToListAsync();

        var summary = await _db.WeeklySummaries.FirstOrDefaultAsync(x => x.UserId == userId && x.WeekStartDate == weekStartDate && x.DeletedAt == null);
        if (summary == null)
        {
            summary = new WeeklySummary { UserId = userId, WeekStartDate = weekStartDate, WeekEndDate = weekEndDate };
            _db.WeeklySummaries.Add(summary);
        }

        summary.AvgEnergyLevel = wellness.Any() ? (decimal)wellness.Average(x => x.EnergyLevel) : null;
        summary.AvgStressLevel = wellness.Any() ? (decimal)wellness.Average(x => x.StressLevel) : null;
        summary.AvgRecoveryLevel = wellness.Any() ? (decimal)wellness.Average(x => x.RecoveryLevel) : null;
        summary.TotalWorkouts = workouts.Count;
        summary.TotalMealsLogged = meals.Count;
        summary.SummaryText = $"This week you logged {workouts.Count} workouts, {meals.Count} meals, and {wellness.Count} wellness entries.";

        await _db.SaveChangesAsync();
        return Ok(summary);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] long userId)
    {
        var items = await _db.WeeklySummaries.Where(x => x.UserId == userId && x.DeletedAt == null)
            .OrderByDescending(x => x.WeekStartDate)
            .ToListAsync();
        return Ok(items);
    }
}
