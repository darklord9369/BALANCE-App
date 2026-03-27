using FitnessPlanner.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitnessPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkoutTypesController : ControllerBase
{
    private readonly AppDbContext _db;
    public WorkoutTypesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _db.WorkoutTypes.Where(x => x.DeletedAt == null).OrderBy(x => x.Name).ToListAsync());
}
