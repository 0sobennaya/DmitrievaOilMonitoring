using Microsoft.IdentityModel.Tokens;
using System.Text;
namespace DmitrievaOilMonitoringApi
{
    public class AuthOptions
    {
        public const string ISSUER = "Dmitrieva";
        public const string AUDIENCE = "APIClient";
        const string KEY = "aF9@tL3#zQ8!Rm2$Xp7^eW5&vN1*oJ6?cK0+uB4~YdS9=GhT%jI2|ZrP<_MfE>";
        public const int LIFETIME = 120;
        public static SymmetricSecurityKey GetSymmetricSecurityKey()
        {
            return new SymmetricSecurityKey(Encoding.ASCII.GetBytes(KEY));
        }
        
    }
}
