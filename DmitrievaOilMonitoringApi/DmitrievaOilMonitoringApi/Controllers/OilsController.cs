using DmitrievaOilMonitoringApi.Data.Services;
using DmitrievaOilMonitoringApi.DTO;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace DmitrievaOilMonitoringApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OilsController : ControllerBase
    {
        private readonly IOilsService _service;
        public OilsController(IOilsService service)
        {
            _service = service;
        }
        [HttpGet]
        public async Task<ActionResult<IEnumerable<OilDTO>>> GetOils()
        {
            var oils = await _service.GetAll();
            return Ok(oils);
        }
        [HttpGet("{id}")]
        public async Task<ActionResult<OilResponseDTO>> GetOil(int id)
        {
            var oil = await _service.GetById(id);
            if (oil == null)
            {
                return NotFound();
            }
            return Ok(oil);
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> PutOil(int id, OilDTO oilDTO, [FromQuery] double temperature = 75)
        {
            var oil = await _service.Update(id, oilDTO, temperature);
            if (oil == null)
            {
                return NotFound();
            }
            return NoContent();
        }
        [HttpPost]
        public async Task<ActionResult<OilDTO>> PostOil (OilDTO oilDTO, [FromQuery] double temperature = 75)
        {            
            var oil = await _service.Add(oilDTO, temperature);
            return CreatedAtAction("GetOil", new {id = oil.Id}, oilDTO);
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOil(int id)
        {
            await _service.Delete(id);
            return NoContent();
        }
        //=========== LINQ ============//

        [HttpGet("critical-wear")]
        public async Task<ActionResult<IEnumerable<CriticalWearDTO>>> GetCriticalWearOils()
        {
            var oils = await _service.GetCriticalWearOils();
            return Ok(oils);
        }
        [HttpGet("oil-statistics")]
        public async Task<ActionResult<StatisticsDTO>> GetStatistics()
        {
            var statistics = await _service.GetStatistics();
            return Ok(statistics);
        }
    }
}
