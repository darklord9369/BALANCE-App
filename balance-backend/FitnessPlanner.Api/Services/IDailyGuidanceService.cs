using FitnessPlanner.Api.DTOs.DailyGuidance;

namespace FitnessPlanner.Api.Services;

public interface IDailyGuidanceService
{
    Task<DailyGuidanceResponseDto> GenerateOrRefreshAsync(long userId, DateOnly selectedDate);
}