using DmitrievaOilMonitoringApi.Data.Services;
using DmitrievaOilMonitoringApi.DTO;
using DmitrievaOilMonitoringApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DmitrievaOilMonitoringApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")] 
    public class RulCalculationController : ControllerBase
    {
        private readonly IRulCalculationService _rulCalculationService;

        public RulCalculationController(IRulCalculationService rulCalculationService)
        {
            _rulCalculationService = rulCalculationService;
        }

        [HttpPost("run-calculation")] // POST api/rulcalculation/run-calculation
        [Authorize] 
        public async Task<ActionResult> RunRulCalculation()
        {
            var success = await _rulCalculationService.RunRulCalculationAsync();

            if (!success)
            {
                return BadRequest("Ошибка при выполнении расчета RUL. Подробности смотрите в логах.");
            }

            return Ok();
        }

        [HttpGet("forecast-points")] //  GET api/rulcalculation/forecast-points?pumpId=X
        [Authorize] 
        public async Task<ActionResult<IEnumerable<OilForecastPointDTO>>> GetForecastPoints(int? pumpId = null)
        {
            var points = await _rulCalculationService.GetForecastPointsAsync(pumpId);
            return Ok(points);
        }

        [HttpGet("forecast-with-fact")]
        [Authorize]
        public async Task<ActionResult<RulForecastWithFactDTO>> GetForecastWithFact(int pumpId)
        {
            var data = await _rulCalculationService.GetForecastWithFactAsync(pumpId);
            return Ok(data);
        }

        [HttpGet("rul-results-latest")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<RulResult>>> GetLatestRulResults()
        {
            var results = await _rulCalculationService.GetLatestRulResultsAsync();
            return Ok(results);
        }
    }

}