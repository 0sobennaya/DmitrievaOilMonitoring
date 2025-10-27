using System.ComponentModel.DataAnnotations;

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
}
