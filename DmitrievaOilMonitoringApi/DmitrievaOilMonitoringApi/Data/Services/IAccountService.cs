using DmitrievaOilMonitoringApi.DTO;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DmitrievaOilMonitoringApi.Data.Services
{
    public interface IAccountService
    {
        Task<ClaimsIdentity> GetIdentity(string username, string password);
        Task<ActionResult<TokenDTO>> Token(LoginDTO loginDTO);
        Task<RegisterResponseDTO?> Register(RegisterDTO registerDto);
    }
}
