using FitnessPlanner.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitnessPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MealCategoriesController : ControllerBase
{
    private readonly AppDbContext _db;
    public MealCategoriesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _db.MealCategories.Where(x => x.DeletedAt == null).OrderBy(x => x.Name).ToListAsync());
}
