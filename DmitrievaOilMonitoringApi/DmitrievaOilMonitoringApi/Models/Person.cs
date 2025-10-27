using System.ComponentModel.DataAnnotations;

namespace DmitrievaOilMonitoringApi.Models
{
    public class Person
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Login { get; set; }
        [Required]
        public string PasswordHash { get; set; } 

        [Required]
        public string Role { get; set; } 
        public string FullName { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
