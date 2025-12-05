using DmitrievaOilMonitoringApi.Data.Services;
using DmitrievaOilMonitoringApi.DTO;
using Microsoft.AspNetCore.Authorization;
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
        //[Authorize]
        public async Task<ActionResult<IEnumerable<PumpResponseDTO>>> GetPumps()
        {
            var pumps = await _service.GetAll();
            return Ok(pumps);
        }
        [HttpGet("{id}")]
        [Authorize]
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
        [Authorize(Roles = "Engineer,Technologist")]
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
        [Authorize(Roles = "Engineer,Technologist")]
        public async Task<ActionResult<PumpDTO>> PostPump(PumpDTO pumpDTO)
        {
            var pump = await _service.Add(pumpDTO);
            return CreatedAtAction("GetPump", new { id = pump.Id }, pumpDTO);
        }
        [HttpDelete("{id}")]
        [Authorize(Roles = "Engineer,Technologist")]
        public async Task<IActionResult> DeletePump(int id)
        {
            await _service.Delete(id);
            return NoContent();
        }
        //=========== LINQ ============//
        [HttpGet("pumps-and-oils-health")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<PumpsAndOilsHealthDTO>>> GetPumpsAndOilsHealth()
        {
            var pumps = await _service.GetPumpsAndOilsHealth();
            return Ok(pumps);
        }

        [HttpGet("pump-vibration-and-oil-contanimation")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<VibrationAndContaminationDTO>>> GetPumpVibrationAndOilContamination()
        {
            var pumps = await _service.GetPumpVibrationAndOilContamination();
            return Ok(pumps);
        }
    }
}
