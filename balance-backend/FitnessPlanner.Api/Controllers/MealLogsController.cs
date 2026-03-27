using FitnessPlanner.Api.Data;
using FitnessPlanner.Api.DTOs.MealLogs;
using FitnessPlanner.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitnessPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MealLogsController : ControllerBase
{
    private readonly AppDbContext _db;
    public MealLogsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] long? userId)
    {
        var query = _db.MealLogs.Include(m => m.MealCategory).Where(m => m.DeletedAt == null);
        if (userId.HasValue) query = query.Where(m => m.UserId == userId.Value);
        var items = await query.OrderByDescending(m => m.MealDate).ToListAsync();
        return Ok(items.Select(Map));
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var item = await _db.MealLogs.Include(m => m.MealCategory).FirstOrDefaultAsync(m => m.MealLogId == id && m.DeletedAt == null);
        return item == null ? NotFound() : Ok(Map(item));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateMealLogDto dto)
    {
        if (!await _db.Users.AnyAsync(u => u.UserId == dto.UserId && u.DeletedAt == null)) return BadRequest(new { message = "User not found." });
        if (!await _db.MealCategories.AnyAsync(x => x.MealCategoryId == dto.MealCategoryId && x.DeletedAt == null)) return BadRequest(new { message = "Meal category not found." });
        var item = new MealLog
        {
            UserId = dto.UserId,
            MealCategoryId = dto.MealCategoryId,
            EventId = dto.EventId,
            MealDate = dto.MealDate,
            MealTime = dto.MealTime,
            Notes = dto.Notes,
            Source = dto.Source,
            Status = dto.Status
        };
        _db.MealLogs.Add(item);
        await _db.SaveChangesAsync();
        item = await _db.MealLogs.Include(m => m.MealCategory).FirstAsync(m => m.MealLogId == item.MealLogId);
        return CreatedAtAction(nameof(GetById), new { id = item.MealLogId }, Map(item));
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, UpdateMealLogDto dto)
    {
        var item = await _db.MealLogs.Include(m => m.MealCategory).FirstOrDefaultAsync(m => m.MealLogId == id && m.DeletedAt == null);
        if (item == null) return NotFound();
        item.MealCategoryId = dto.MealCategoryId;
        item.EventId = dto.EventId;
        item.MealDate = dto.MealDate;
        item.MealTime = dto.MealTime;
        item.Notes = dto.Notes;
        item.Source = dto.Source;
        item.Status = dto.Status;
        await _db.SaveChangesAsync();
        item = await _db.MealLogs.Include(m => m.MealCategory).FirstAsync(m => m.MealLogId == id);
        return Ok(Map(item));
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        var item = await _db.MealLogs.FirstOrDefaultAsync(m => m.MealLogId == id && m.DeletedAt == null);
        if (item == null) return NotFound();
        item.DeletedAt = DateTime.UtcNow;
        item.Status = "deleted";
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static MealLogResponseDto Map(MealLog m) => new()
    {
        MealLogId = m.MealLogId,
        UserId = m.UserId,
        MealCategoryId = m.MealCategoryId,
        MealCategoryName = m.MealCategory.Name,
        EventId = m.EventId,
        MealDate = m.MealDate,
        MealTime = m.MealTime,
        Notes = m.Notes,
        Source = m.Source,
        Status = m.Status
    };
}
