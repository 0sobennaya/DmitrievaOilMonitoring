using DmitrievaOilMonitoringApi.DTO;
using DmitrievaOilMonitoringApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace DmitrievaOilMonitoringApi.Data.Services
{
    public class AccountService : IAccountService
    {
        private readonly OilMonitoringApiContext _context;

        public AccountService(OilMonitoringApiContext context)
        {
            _context = context;
        }

        public async Task<ClaimsIdentity> GetIdentity(string username, string password)
        {
            Person person = await _context.People
                .FirstOrDefaultAsync(x => x.Login == username);

            // Проверка пользователя и пароля
            if (person != null && BCrypt.Net.BCrypt.Verify(password, person.PasswordHash))
            {
                var claims = new List<Claim>
                {
                    new Claim(ClaimsIdentity.DefaultNameClaimType, person.Login),
                    new Claim(ClaimsIdentity.DefaultRoleClaimType, person.Role),
                    new Claim("FullName", person.FullName)
                };
                ClaimsIdentity claimsIdentity =
                    new ClaimsIdentity(claims, "Token", ClaimsIdentity.DefaultNameClaimType,
                        ClaimsIdentity.DefaultRoleClaimType);
                return claimsIdentity;
            }

            // если пользователя не найдено или пароль неверный
            return null;
        }
        public async Task<ActionResult<TokenDTO>> Token([FromBody] LoginDTO loginDTO)
        {

            var identity = await GetIdentity(loginDTO.Username, loginDTO.Password);

            var now = DateTime.UtcNow;

            var jwt = new JwtSecurityToken(
                issuer: AuthOptions.ISSUER,
                audience: AuthOptions.AUDIENCE,
                notBefore: now,
                claims: identity.Claims,
                expires: now.Add(TimeSpan.FromMinutes(AuthOptions.LIFETIME)),
                signingCredentials: new SigningCredentials(
                    AuthOptions.GetSymmetricSecurityKey(),
                    SecurityAlgorithms.HmacSha256));

            var encodedJwt = new JwtSecurityTokenHandler().WriteToken(jwt);

            var response = new TokenDTO
            {
                Access_token = encodedJwt,
                Username = identity.Name,
                Role = identity.FindFirst(ClaimTypes.Role)?.Value
            };

            return response;
        }
        public async Task<RegisterResponseDTO?> Register([FromBody] RegisterDTO registerDto)
        {
            var existingUser = await _context.People
                .FirstOrDefaultAsync(p => p.Login == registerDto.Login);

            if (existingUser != null)
            {
                return null;
            }

            // Проверка валидности роли
            var validRoles = new[] { UserRoles.Laborant, UserRoles.Engineer, UserRoles.Technologist };
            if (!validRoles.Contains(registerDto.Role))
            {
                return null;
            }
            // Создание нового пользователя
            var newPerson = new Person
            {
                Login = registerDto.Login,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                Role = registerDto.Role,
                FullName = registerDto.FullName,
                CreatedAt = DateTime.UtcNow
            };

            _context.People.Add(newPerson);
            await _context.SaveChangesAsync();

            return new RegisterResponseDTO
            {
                Login = newPerson.Login,
                Role = newPerson.Role,
                FullName = newPerson.FullName
            };

        }
    }
}
