using FitnessPlanner.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitnessPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkoutPreferencesController : ControllerBase
{
    private readonly AppDbContext _db;

    public WorkoutPreferencesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _db.WorkoutPreferences
            .Where(x => x.DeletedAt == null)
            .OrderBy(x => x.WorkoutPreferenceId)
            .ToListAsync();

        return Ok(items);
    }
}