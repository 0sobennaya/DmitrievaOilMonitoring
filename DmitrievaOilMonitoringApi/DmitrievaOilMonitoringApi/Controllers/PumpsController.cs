using DmitrievaOilMonitoringApi.Data.Services;
using DmitrievaOilMonitoringApi.DTO;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace DmitrievaOilMonitoringApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PumpsController : ControllerBase
    {
        private readonly IPumpsService _service;
        public PumpsController(IPumpsService service)
        {
            _service = service;
        }
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PumpResponseDTO>>> GetPumps()
        {
            var pumps = await _service.GetAll();
            return Ok(pumps);
        }
        [HttpGet("{id}")]
        public async Task<ActionResult<PumpResponseDTO>> GetPump(int id)
        {
            var pump = await _service.GetById(id);
            if (pump == null)
            {
                return NotFound();
            }
            return Ok(pump);
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPump(int id, PumpDTO pumpDTO)
        {
            var pump = await _service.Update(id, pumpDTO);
            if (pump == null)
            {
                return NotFound();
            }
            return NoContent();
        }

        [HttpPost]
        public async Task<ActionResult<PumpDTO>> PostPump(PumpDTO pumpDTO)
        {
            var pump = await _service.Add(pumpDTO);
            return CreatedAtAction("GetPump", new { id = pump.Id }, pumpDTO);
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePump(int id)
        {
            await _service.Delete(id);
            return NoContent();
        }
    }
}
