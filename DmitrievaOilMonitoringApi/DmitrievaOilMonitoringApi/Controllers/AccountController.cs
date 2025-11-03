using DmitrievaOilMonitoringApi.Data;
using DmitrievaOilMonitoringApi.Data.Services;
using DmitrievaOilMonitoringApi.DTO;
using DmitrievaOilMonitoringApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;

namespace DmitrievaOilMonitoringApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly IAccountService _service;
        public AccountController(IAccountService service)
        {
            _service = service;
        }
    
       
        [HttpPost("token")]
        public async Task<IActionResult> Token([FromBody] LoginDTO loginDTO)
        {
            var identity = await _service.Token(loginDTO);
            if (identity == null)
            {
                return BadRequest(new { errorText = "Invalid username or password." });
            }
            return Ok(identity);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDTO registerDto)
        {
            var user = await _service.Register(registerDto);
            if (user == null)
            {
                return BadRequest(new { errorText = "Регистрация не выполнена. Логин уже используется или некорректная роль." });
            }
            return Ok(user);
        }
    }
}
