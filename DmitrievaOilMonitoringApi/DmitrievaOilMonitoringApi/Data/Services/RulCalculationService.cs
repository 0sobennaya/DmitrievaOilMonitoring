using DmitrievaOilMonitoringApi.Data;
using DmitrievaOilMonitoringApi.DTO;
using Microsoft.EntityFrameworkCore; 
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Text;

namespace DmitrievaOilMonitoringApi.Data.Services
{

    public class RulCalculationService : IRulCalculationService
    {
        private readonly ILogger<RulCalculationService> _logger;
        private readonly string _pythonScriptPath;
        private readonly string _pythonInterpreterPath;
        private readonly OilMonitoringApiContext _context;
        public RulCalculationService(
            ILogger<RulCalculationService> logger,
            IConfiguration configuration,
            OilMonitoringApiContext context) // Добавляем context в конструктор
        {
            _logger = logger;
            _context = context;
            _pythonScriptPath = configuration["PythonScripts:RulScriptPath"] ?? throw new InvalidOperationException("Конфигурация PythonScripts:RulScriptPath не найдена.");
            _pythonInterpreterPath = configuration["PythonScripts:InterpreterPath"] ?? throw new InvalidOperationException("Конфигурация PythonScripts:InterpreterPath не найдена.");
        }

        public async Task<bool> RunRulCalculationAsync()
        {
            _logger.LogInformation("Запуск расчета RUL через Python-скрипт '{ScriptPath}'.", _pythonScriptPath);

            if (!System.IO.File.Exists(_pythonScriptPath))
            {
                _logger.LogError("Файл скрипта Python не найден: '{ScriptPath}'", _pythonScriptPath);
                return false;
            }

            try
            {
                var processInfo = new ProcessStartInfo
                {
                    FileName = _pythonInterpreterPath,
                    Arguments = $"\"{_pythonScriptPath}\"",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true,
                    WorkingDirectory = Path.GetDirectoryName(_pythonScriptPath) // Убедитесь, что скрипт находит свои файлы (models.pkl)
                };

                using (var process = Process.Start(processInfo))
                {
                    if (process == null)
                    {
                        _logger.LogError("Не удалось запустить процесс Python.");
                        return false;
                    }

                    // Асинхронно читаем вывод и ошибки
                    var outputTask = process.StandardOutput.ReadToEndAsync();
                    var errorTask = process.StandardError.ReadToEndAsync();

                    await process.WaitForExitAsync(); // Ждем завершения

                    var output = await outputTask;
                    var error = await errorTask;

                    if (process.ExitCode != 0)
                    {
                        _logger.LogError("Python-скрипт завершился с кодом {ExitCode}. Ошибки: {Error}. Вывод: {Output}", process.ExitCode, error, output);
                        return false;
                    }

                    _logger.LogInformation("Python-скрипт завершен успешно. Вывод: {Output}", output);
                    return true;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Произошла ошибка при запуске Python-скрипта '{ScriptPath}'.", _pythonScriptPath);
                return false;
            }
        }
        public async Task<IEnumerable<OilForecastPointDTO>> GetForecastPointsAsync(int? pumpId = null)
        {
            _logger.LogDebug("Получение точек прогноза для PumpId={PumpId}.", pumpId);

            var query = _context.OilForecastPoints.AsNoTracking();

            if (pumpId.HasValue)
            {
                query = query.Where(p => p.PumpId == pumpId.Value);
            }
            var points = await query.OrderBy(p => p.PumpId).ThenBy(p => p.Month).ToListAsync();

            // Преобразуем в DTO
            var dto = points.Select(p => new OilForecastPointDTO
            {
                PumpId = p.PumpId,
                MeasurementDate = p.MeasurementDate,
                Month = p.Month,
                TAN = p.TAN,
                WaterContentPct = p.WaterContentPct,
                ImpuritiesPct = p.ImpuritiesPct,
                FlashPointC = p.FlashPointC,
                MeanVibration = p.MeanVibration,
                MeanOilTemp = p.MeanOilTemp,
                OperatingHours = p.OperatingHours
            }).ToList();

            return dto;
        }
    }
    }