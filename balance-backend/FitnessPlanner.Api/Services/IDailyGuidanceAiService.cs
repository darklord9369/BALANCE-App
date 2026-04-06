using FitnessPlanner.Api.DTOs.DailyGuidance;

namespace FitnessPlanner.Api.Services;

public interface IDailyGuidanceAiService
{
    Task<DailyGuidanceLlmResultDto> GenerateAsync(DailyGuidanceContextDto context);
}