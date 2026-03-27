using FitnessPlanner.Api.Data;
using FitnessPlanner.Api.DTOs.Events;
using FitnessPlanner.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitnessPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventsController : ControllerBase
{
    private readonly AppDbContext _db;
    public EventsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] long? userId)
    {
        var query = _db.Events.Include(e => e.EventType).Where(e => e.DeletedAt == null);
        if (userId.HasValue) query = query.Where(e => e.UserId == userId.Value);
        var items = await query.OrderBy(e => e.StartDate).ToListAsync();
        return Ok(items.Select(Map));
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var item = await _db.Events.Include(e => e.EventType).FirstOrDefaultAsync(e => e.EventId == id && e.DeletedAt == null);
        return item == null ? NotFound() : Ok(Map(item));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateEventDto dto)
    {
        if (dto.EndDate < dto.StartDate) return BadRequest(new { message = "End date cannot be before start date." });
        if (!await _db.Users.AnyAsync(u => u.UserId == dto.UserId && u.DeletedAt == null)) return BadRequest(new { message = "User not found." });
        if (!await _db.EventTypes.AnyAsync(x => x.EventTypeId == dto.EventTypeId && x.DeletedAt == null)) return BadRequest(new { message = "Event type not found." });

        var item = new Event
        {
            UserId = dto.UserId,
            EventTypeId = dto.EventTypeId,
            Title = dto.Title,
            Description = dto.Description,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            StressLevel = dto.StressLevel,
            Source = "manual"
        };
        _db.Events.Add(item);
        await _db.SaveChangesAsync();
        item = await _db.Events.Include(e => e.EventType).FirstAsync(e => e.EventId == item.EventId);
        return CreatedAtAction(nameof(GetById), new { id = item.EventId }, Map(item));
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, UpdateEventDto dto)
    {
        if (dto.EndDate < dto.StartDate) return BadRequest(new { message = "End date cannot be before start date." });
        var item = await _db.Events.Include(e => e.EventType).FirstOrDefaultAsync(e => e.EventId == id && e.DeletedAt == null);
        if (item == null) return NotFound();
        item.Title = dto.Title;
        item.Description = dto.Description;
        item.StartDate = dto.StartDate;
        item.EndDate = dto.EndDate;
        item.StressLevel = dto.StressLevel;
        item.Status = dto.Status;
        await _db.SaveChangesAsync();
        return Ok(Map(item));
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        var item = await _db.Events.FirstOrDefaultAsync(e => e.EventId == id && e.DeletedAt == null);
        if (item == null) return NotFound();
        item.DeletedAt = DateTime.UtcNow;
        item.Status = "deleted";
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static EventResponseDto Map(Event e) => new()
    {
        EventId = e.EventId,
        UserId = e.UserId,
        EventTypeId = e.EventTypeId,
        EventTypeName = e.EventType.Name,
        Title = e.Title,
        Description = e.Description,
        StartDate = e.StartDate,
        EndDate = e.EndDate,
        StressLevel = e.StressLevel,
        Status = e.Status
    };
}
