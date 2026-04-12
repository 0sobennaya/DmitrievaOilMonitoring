using DmitrievaOilMonitoringApi.Data;
using DmitrievaOilMonitoringApi.DTO;
using DmitrievaOilMonitoringApi.Models;
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
        public async Task<RulForecastWithFactDTO> GetForecastWithFactAsync(int pumpId)
        {
            // 1. Загружаем фактические данные из OilConditionRecords
            var factRecords = await _context.OilConditionRecords
                .AsNoTracking()
                .Where(r => r.PumpId == pumpId)
                .OrderBy(r => r.MeasurementDate)
                .ToListAsync();

            if (!factRecords.Any())
            {
                return new RulForecastWithFactDTO { PumpId = pumpId };
            }

            // 2. Получаем последнюю дату (текущий момент)
            var lastDate = factRecords.Last().MeasurementDate;

            // 3. Преобразуем в "месяцы от текущего момента" (отрицательные)
            var factPoints = factRecords.Select(r =>
            {
                var monthsAgo = -(int)((lastDate - r.MeasurementDate).TotalDays / 30);
                return new FactPointDTO
                {
                    Month = monthsAgo,
                    TAN = r.TAN,
                    WaterContentPct = r.WaterContentPct,
                    ImpuritiesPct = r.ImpuritiesPct,
                    FlashPointC = r.FlashPointC,
                    OperatingHours = r.OperatingHours
                };
            }).ToList();

            // 4. Загружаем прогнозные точки
            var forecastPoints = await _context.OilForecastPoints
                .AsNoTracking()
                .Where(p => p.PumpId == pumpId)
                .OrderBy(p => p.Month)
                .ToListAsync();

            return new RulForecastWithFactDTO
            {
                PumpId = pumpId,
                FactPoints = factPoints,
                ForecastPoints = forecastPoints.Select(p => new OilForecastPointDTO
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
                }).ToList()
            };
        }
        public async Task<IEnumerable<RulResult>> GetLatestRulResultsAsync()
        {
            _logger.LogDebug("Получение самых свежих результатов RUL для каждого насоса.");

            var latestResults = await _context.RulResults
                .AsNoTracking()
                .GroupBy(r => r.PumpId)
                .Select(g => g.OrderByDescending(r => r.CurrentDate).First()) 
                .ToListAsync();

            return latestResults;
        }
    }
    }