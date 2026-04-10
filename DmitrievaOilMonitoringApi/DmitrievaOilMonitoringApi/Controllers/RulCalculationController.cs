using DmitrievaOilMonitoringApi.Data.Services;
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

            return Ok("Расчет RUL успешно запущен и завершен.");
        }
    }
}