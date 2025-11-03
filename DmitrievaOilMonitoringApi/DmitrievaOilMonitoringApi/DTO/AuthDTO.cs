using Azure.Core;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Security.Principal;

namespace DmitrievaOilMonitoringApi.DTO
{
    public class LoginDTO
    {
        [Required]
        public string Username { get; set; }

        [Required]
        public string Password { get; set; }
    }
    public class RegisterDTO
    {
        [Required]
        public string Login { get; set; }

        [Required]
        [MinLength(5)]
        public string Password { get; set; }

        [Required]
        public string FullName { get; set; }

        [Required]
        public string Role { get; set; } // "Laborant", "Engineer", "Technologist"
    }

    public class TokenDTO
    {
        [Required]
        public string Access_token { get; set; }
        [Required]
        public string Username { get; set; }
        [Required]
        public string Role { get; set; }
    }

    public class RegisterResponseDTO
    {
        public string Login { get; set; }
        public string Role { get; set; }
        public string FullName { get; set; }
    }
}
