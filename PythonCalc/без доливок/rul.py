"""
РАСЧЁТ RUL (REMAINING USEFUL LIFE) МАСЛА
Версия: 3.0 (Фактические данные + RUL до Warning)
"""
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import pickle
from datetime import datetime, timedelta
import warnings
import psycopg2
warnings.filterwarnings('ignore')
plt.style.use('seaborn-v0_8-whitegrid')


print("RUL CALCULATION FOR OIL IN PUMPS (FORECAST TO 2030)")

print("\n[1/6] Loading models...")
with open('models.pkl', 'rb') as f:
    model_data = pickle.load(f)

models = model_data['models']
scalers = model_data['scalers']
config = model_data['config']
print(f"Loaded {len(models)} models")

# ===============================================================
# 2. ПРЕДЕЛЬНЫЕ ЗНАЧЕНИЯ (ГОСТ/ISO)
# ===============================================================
print("\n[2/6] Limit values for parameters...")
LIMITS = {
    'TAN': {'warning': 1.3, 'critical': 1.50, 'unit': 'mg KOH/g', 'direction': 'max'},
    'WaterContentPct': {'warning': 0.1, 'critical': 0.25, 'unit': '%', 'direction': 'max'},
    'ImpuritiesPct': {'warning': 1.3, 'critical': 1.50, 'unit': '%', 'direction': 'max'},
    'FlashPointC': {'warning': 170, 'critical': 150, 'unit': 'C', 'direction': 'min'}
}

for param, limits in LIMITS.items():
    print(f"   {param}: {limits['warning']} | {limits['critical']} {limits['unit']}")

# ===============================================================
# 3. ЗАГРУЗКА РЕАЛЬНЫХ ДАННЫХ
# ===============================================================
print("\n[3/6] Loading real data...")
conn = psycopg2.connect(
    host="localhost",
    database="oilmonitoring_db",
    user="postgres",
    password="1703"
)

query_all = """
SELECT "PumpId", "MeasurementDate", "TAN", "WaterContentPct", "ImpuritiesPct", "FlashPointC", 
       "MeanVibration", "MeanOilTemp", "MeanBearingTemp", "OperatingHours"
FROM "OilConditionRecords"
ORDER BY "PumpId", "MeasurementDate"
"""

df_real = pd.read_sql_query(query_all, conn)
df_real['MeasurementDate'] = pd.to_datetime(df_real['MeasurementDate'])

last_measurements = df_real.groupby('PumpId').last().reset_index()
print(f"Loaded {len(df_real)} records from {len(last_measurements)} pumps")
print(f"   Latest measurement: {last_measurements['MeasurementDate'].max()}")

# ===============================================================
# 4. ТЕМПЫ ДЕГРАДАЦИИ
# ===============================================================
print("\n[4/6] Setting degradation formulas...")
DEGRADATION_RATES = {
    'TAN': {'base': 0.008, 'temp_coef': 0.0005, 'monthly': 0.005},
    'WaterContentPct': {'base': 0.005, 'seasonal_winter': 0.005, 'monthly': 0.002},
    'ImpuritiesPct': {'base': 0.008, 'vibration_coef': 0.12, 'monthly': 0.003},
    'FlashPointC': {'formula': '216 - 200*TAN - 80*water', 'base': 210}
}

# ===============================================================
# 5. ПРОГНОЗ ТЕЛЕМЕТРИИ
# ===============================================================
print("\n[5/6] Generating telemetry forecast (60 months)...")
def generate_future_telemetry(last_row, n_months=60):
    future_data = []
    current_date = last_row['MeasurementDate']
    base_vib = last_row['MeanVibration']
    base_temp = last_row['MeanOilTemp']
    base_hours = last_row['OperatingHours']
    
    for month in range(1, n_months + 1):
        future_date = current_date + timedelta(days=30 * month)
        quarter = (month - 1) // 3
        vibration = base_vib + 0.05 * (month / 3)
        vibration = max(0.4, min(2.5, vibration))
        seasonal = 1.0 + 0.15 * np.sin(2 * np.pi * (month - 1) / 12)
        oil_temp = base_temp + 9 * seasonal + 0.3 * (month / 12)
        hours = base_hours + 700 * month
        
        future_data.append({
            'MeasurementDate': future_date, 'month': month,
            'MeanVibration': round(vibration, 3),
            'MeanOilTemp': round(oil_temp, 2),
            'OperatingHours': round(hours, 0), 'quarter': quarter
        })
    return pd.DataFrame(future_data)

# ===============================================================
# 6. РАСЧЁТ RUL (ДО WARNING И CRITICAL)
# ===============================================================
print("\n[6/6] Calculating RUL for each pump...")
rul_results = []
forecast_data = []

# Проходим по всем уникальным PumpId
for PumpId in last_measurements['PumpId'].unique():
    print(f"\n{'='*70}")
    print(f"PUMP {PumpId}")
    print(f"{'='*70}")

    last_row = last_measurements[last_measurements['PumpId'] == PumpId].iloc[0]
    print(f"Latest measurement: {last_row['MeasurementDate'].strftime('%Y-%m-%d')}")
    print(f"Operating hours: {last_row['OperatingHours']:.0f}")
    
    current_oil = {
        'TAN': last_row['TAN'],
        'WaterContentPct': last_row['WaterContentPct'],
        'ImpuritiesPct': last_row['ImpuritiesPct'],
        'FlashPointC': last_row['FlashPointC']
    }
    
    #  RUL до WARNING и до CRITICAL
    rul_warning_by_param = {param: None for param in LIMITS.keys()}
    rul_critical_by_param = {param: None for param in LIMITS.keys()}
    
    future_telemetry = generate_future_telemetry(last_row, n_months=60)
    predicted_oil = []
    predicted_values = current_oil.copy()
    
    for idx, future_row in future_telemetry.iterrows():
        month = future_row['month']
        quarter = future_row['quarter']
        oil_state = {}
        
        # TAN
        tan_growth = DEGRADATION_RATES['TAN']['monthly'] * month
        tan_temp_effect = DEGRADATION_RATES['TAN']['temp_coef'] * (future_row['MeanOilTemp'] - 55)
        pred_tan = current_oil['TAN'] + tan_growth + tan_temp_effect
        pred_tan = max(0.015, min(2.0, pred_tan))
        oil_state['TAN'] = pred_tan
        predicted_values['TAN'] = pred_tan
        
        # Water
        water_growth = DEGRADATION_RATES['WaterContentPct']['monthly'] * month
        seasonal_water = DEGRADATION_RATES['WaterContentPct']['seasonal_winter'] if quarter in [2, 3] else 0
        pred_water = current_oil['WaterContentPct'] + water_growth + seasonal_water * (month / 12)
        pred_water = max(0.020, min(0.4, pred_water))
        oil_state['WaterContentPct'] = pred_water
        predicted_values['WaterContentPct'] = pred_water
        
        # Impurities
        imp_growth = DEGRADATION_RATES['ImpuritiesPct']['monthly'] * month
        vib_effect = DEGRADATION_RATES['ImpuritiesPct']['vibration_coef'] * (future_row['MeanVibration'] - 0.5)
        pred_imp = current_oil['ImpuritiesPct'] + imp_growth + vib_effect * (month / 3)
        pred_imp = max(0.020, min(2.0, pred_imp))
        oil_state['ImpuritiesPct'] = pred_imp
        predicted_values['ImpuritiesPct'] = pred_imp
        
        # Flash Point
        pred_flash = 216 - 200 * predicted_values['TAN'] - 80 * predicted_values['WaterContentPct']
        pred_flash = max(150, min(220, pred_flash + np.random.normal(0, 3)))
        oil_state['FlashPointC'] = pred_flash
        predicted_values['FlashPointC'] = pred_flash
        
        # Проверяем WARNING и CRITICAL
        for param, limits in LIMITS.items():
            value = oil_state[param]
            
            # WARNING
            if rul_warning_by_param[param] is None:
                if limits['direction'] == 'max':
                    if value >= limits['warning']:
                        rul_warning_by_param[param] = month
                else:
                    if value <= limits['warning']:
                        rul_warning_by_param[param] = month
            
            # CRITICAL
            if rul_critical_by_param[param] is None:
                if limits['direction'] == 'max':
                    if value >= limits['critical']:
                        rul_critical_by_param[param] = month
                else:
                    if value <= limits['critical']:
                        rul_critical_by_param[param] = month
        
        predicted_oil.append({
            'PumpId': PumpId, 'month': month, 'MeasurementDate': future_row['MeasurementDate'],
            'year': future_row['MeasurementDate'].year, **oil_state,
            'MeanVibration': future_row['MeanVibration'],
            'MeanOilTemp': future_row['MeanOilTemp'],
            'OperatingHours': future_row['OperatingHours'],
            'is_forecast': True  # Метка для графика
        })
    
    # Определяем RUL до WARNING (основной) и до CRITICAL
    rul_warning_months = [v for v in rul_warning_by_param.values() if v is not None]
    rul_critical_months = [v for v in rul_critical_by_param.values() if v is not None]
    
    min_rul_warning = min(rul_warning_months) if rul_warning_months else 60
    min_rul_critical = min(rul_critical_months) if rul_critical_months else 60
    
    limiting_param_warning = [k for k, v in rul_warning_by_param.items() if v == min_rul_warning][0] if rul_warning_months else "Не достигнут"
    limiting_param_critical = [k for k, v in rul_critical_by_param.items() if v == min_rul_critical][0] if rul_critical_months else "Не достигнут"
    
    replacement_date_warning = last_row['MeasurementDate'] + timedelta(days=30 * min_rul_warning)
    replacement_date_critical = last_row['MeasurementDate'] + timedelta(days=30 * min_rul_critical)
    
    print(f"\nRUL FORECAST:")
    print(f"   WARNING in: {min_rul_warning} months ({min_rul_warning/12:.2f} years) -> {replacement_date_warning.strftime('%Y-%m')}")
    print(f"   CRITICAL in: {min_rul_critical} months ({min_rul_critical/12:.2f} years) -> {replacement_date_critical.strftime('%Y-%m')}")
    print(f"   Limiting parameter (WARNING): {limiting_param_warning}")

    rul_results.append({
        'PumpId': PumpId,
        'CurrentDate': last_row['MeasurementDate'],
        'RulWarningMonths': min_rul_warning,
        'RulCriticalMonths': min_rul_critical,
        'RulWarningYears': round(min_rul_warning / 12, 2),
        'RulCriticalYears': round(min_rul_critical / 12, 2),
        'ReplacementDateWarning': replacement_date_warning,
        'ReplacementDateCritical': replacement_date_critical,
        'LimitingParamWarning': limiting_param_warning,
        'LimitingParamCritical': limiting_param_critical,
        'OperatingHoursAtCalculation': last_row['OperatingHours']
    })
    
    forecast_data.extend(predicted_oil)

# ===============================================================
# 7. СОХРАНЕНИЕ
# ===============================================================
print("\n" + "="*80)
print("SAVING RESULTS TO DATABASE")
print("="*80)

df_rul = pd.DataFrame(rul_results)
df_rul['CurrentDate'] = df_rul['CurrentDate'].astype(str)
df_rul['ReplacementDateWarning'] = df_rul['ReplacementDateWarning'].astype(str)
df_rul['ReplacementDateCritical'] = df_rul['ReplacementDateCritical'].astype(str)

df_rul.to_csv("rul_results_2030.csv", index=False, encoding='utf-8')
print("rul_results_2030.csv")

df_forecast = pd.DataFrame(forecast_data)
df_forecast.to_csv("oil_forecast_60months.csv", index=False, encoding='utf-8')
print(" oil_forecast_60months.csv")

# СОХРАНЕНИЕ в БД
cursor = conn.cursor() # Создаем курсор для выполнения SQL

try:
    # --- 1. Удаляем старые записи для каждого PumpId ---
    cursor.execute("""
    DELETE FROM "RulResults" WHERE "PumpId" = ANY(%s);
    """, (list(set(r['PumpId'] for r in rul_results)),))

    print(f"OK: Удалены старые записи для {len(rul_results)} насосов.")

    # --- 2. Вставляем новые ---
    insert_query = """
    INSERT INTO "RulResults" 
    ("PumpId", "CurrentDate", "RulWarningMonths", "RulCriticalMonths", 
    "RulWarningYears", "RulCriticalYears", "ReplacementDateWarning", 
    "ReplacementDateCritical", "LimitingParamWarning", "LimitingParamCritical", "OperatingHoursAtCalculation")
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
    """

    for result in rul_results:
        cursor.execute(insert_query, (
            int(result['PumpId']),                           # "PumpId"
            result['CurrentDate'],                          # "CurrentDate"
            int(result['RulWarningMonths']),               # "RulWarningMonths"
            int(result['RulCriticalMonths']),              # "RulCriticalMonths"
            float(result['RulWarningYears']),              # "RulWarningYears"
            float(result['RulCriticalYears']),             # "RulCriticalYears"
            result['ReplacementDateWarning'],              # "ReplacementDateWarning"
            result['ReplacementDateCritical'],             # "ReplacementDateCritical"
            str(result['LimitingParamWarning']),           # "LimitingParamWarning"
            str(result['LimitingParamCritical']),          # "LimitingParamCritical"
            int(result['OperatingHoursAtCalculation'])     # "OperatingHoursAtCalculation"
        ))
    conn.commit() # Подтверждаем все вставки одной транзакцией
    print(f"OK: Added {len(rul_results)} records to 'RulResults'.")
except psycopg2.Error as e:
    # Если произошла ошибка, откатываем транзакцию
    print(f"ERROR: Failed to insert into RulResults: {e}")
    conn.rollback()
finally:
    # Закрываем курсор
    cursor.close()

cursor = conn.cursor()
try:
    # --- 1. Удаляем старые записи из OilForecastPoints для всех насосов ---
    cursor.execute('DELETE FROM "OilForecastPoints";')
    print("OK: Cleared table 'OilForecastPoints'")

    # --- 2. Вставляем новые данные ---
    insert_forecast_query = """
        INSERT INTO "OilForecastPoints"
        ("PumpId", "MeasurementDate", "Month", "TAN", "WaterContentPct",
         "ImpuritiesPct", "FlashPointC", "MeanVibration", "MeanOilTemp", "OperatingHours")
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
    """   
    for point in forecast_data:
        cursor.execute(insert_forecast_query, (
            int(point['PumpId']),
            point['MeasurementDate'],          # datetime → OK
            int(point['month']),               # numpy.int64 → int
            float(point['TAN']),               # numpy.float64 → float
            float(point['WaterContentPct']),
            float(point['ImpuritiesPct']),
            float(point['FlashPointC']),
            float(point['MeanVibration']),
            float(point['MeanOilTemp']),
            int(point['OperatingHours'])       # numpy.int64 → int
        ))

    conn.commit()
    print(f"OK: Added {len(forecast_data)} forecast points to 'OilForecastPoints'.")
except Exception as e:
    print(f"ERROR: Failed to insert into OilForecastPoints: {e}")
    conn.rollback()
finally:
    cursor.close()
# ===============================================================
# 8. ВИЗУАЛИЗАЦИЯ (ФАКТ + ПРОГНОЗ + ВЕРТИКАЛЬНЫЕ ЛИНИИ)
# ===============================================================
print("\nGENERATING CHARTS...")

# Используем цвета для разных насосов, если их больше 2, генерируем
unique_pumps = df_real['PumpId'].unique()
pump_colors = {pid: f"C{i}" for i, pid in enumerate(unique_pumps)}

#  Рассчитываем позиции вертикальных линий
current_date = last_measurements['MeasurementDate'].max()
july_2027 = pd.Timestamp('2027-07-01 21:00:00+00:00')
months_to_july_2027 = (july_2027 - current_date).days / 30

#  ИСПРАВЛЕНИЕ: используем 'RulWarningMonths' вместо 'rul_warning_months'
rul_positions = {r['PumpId']: r['RulWarningMonths'] for r in rul_results}

fig, axes = plt.subplots(2, 2, figsize=(16, 12))
axes = axes.flatten()

params = [
    ('TAN', 'TAN (mg KOH/g)', LIMITS['TAN']['critical'], 'red'),
    ('WaterContentPct', 'Water (%)', LIMITS['WaterContentPct']['critical'], 'blue'),
    ('ImpuritiesPct', 'Impurities (%)', LIMITS['ImpuritiesPct']['critical'], 'orange'),
    ('FlashPointC', 'Flash Point (°C)', LIMITS['FlashPointC']['critical'], 'green')
]

for idx, (col, name, limit, limit_color) in enumerate(params):
    ax = axes[idx]
    
    for PumpId in df_real['PumpId'].unique():
        #  ФАКТИЧЕСКИЕ ДАННЫЕ (история) - СПЛОШНАЯ ЛИНИЯ
        df_pump_real = df_real[df_real['PumpId'] == PumpId].copy()
        df_pump_real['month'] = -(df_pump_real['MeasurementDate'].max() - df_pump_real['MeasurementDate']).dt.days / 30
        
        ax.plot(df_pump_real['month'], df_pump_real[col], 
               color=pump_colors.get(PumpId, 'gray'),
               linestyle='-', linewidth=3, alpha=0.9,
               label=f'Насос {PumpId} (факт)', zorder=5)
        
        #  ПРОГНОЗ (будущее) ПУНКТИРНАЯ ЛИНИЯ
        df_pump_forecast = df_forecast[df_forecast['PumpId'] == PumpId]
        ax.plot(df_pump_forecast['month'], df_pump_forecast[col], 
               color=pump_colors.get(PumpId, 'gray'),
               linestyle='--', linewidth=2, alpha=0.7,
               label=f'Насос {PumpId} (прогноз)')
    
    #  ВЕРТИКАЛЬНАЯ ЛИНИЯ: Июль 2027 (для всех насосов)
    ax.axvline(x=months_to_july_2027, color='purple', linestyle='-.', linewidth=2.5, 
               label=f'Июль 2027', alpha=0.8, zorder=10)
    
    #  ВЕРТИКАЛЬНЫЕ ЛИНИИ: Дата замены по RUL (для каждого насоса)
    for PumpId, rul_month in rul_positions.items():
        pump_color = pump_colors.get(PumpId, 'gray')
        ax.axvline(x=rul_month, color=pump_color, linestyle=':', linewidth=3, 
                   label=f'Насос {PumpId} замена', alpha=0.6, zorder=10)
    
    # Линии WARNING и CRITICAL
    warning_limit = LIMITS[col]['warning']
    ax.axhline(y=limit, color='red', linestyle='--', linewidth=3, label='Critical', alpha=0.8)
    ax.axhline(y=warning_limit, color='orange', linestyle='--', linewidth=2, label='Warning', alpha=0.8)
    
    # Зона риска
    if col == 'FlashPointC':
        ax.axhspan(limit, warning_limit, alpha=0.2, color='orange', label='Зона риска')
    else:
        ax.axhspan(warning_limit, limit, alpha=0.2, color='orange', label='Зона риска')
    
    ax.set_xlabel('Месяцы (0 = текущий замер)', fontsize=12)
    ax.set_ylabel(name, fontsize=12)
    ax.set_title(f'{name}\nФакт + Прогноз 2025-2030', fontsize=14, fontweight='bold')
    ax.legend(loc='best', fontsize=9)
    ax.grid(True, alpha=0.3)
    
    year_ticks = [-36, -24, -12, 0, 12, 24, 36, 48, 60]
    year_labels = ['2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030']
    ax.set_xticks(year_ticks)
    ax.set_xticklabels(year_labels, fontsize=10)

plt.tight_layout()
plt.savefig('rul_forecast_2030.png', dpi=300, bbox_inches='tight')
print("rul_forecast_2030.png")
plt.close()

# ===============================================================
# 9. ФИНАЛЬНЫЙ ОТЧЁТ
# ===============================================================
print("\n" + "="*80)
print(" RUL SUMMARY REPORT (FORECAST TO 2030)")
print("="*80)

for r in rul_results:
    print(f"\n{'='*70}")
    print(f"PUMP {r['PumpId']}")
    print(f"{'='*70}")
    print(f"   Current operating hours: {r['OperatingHoursAtCalculation']:.0f} hours")
    print(f"   Last meashurement: {r['CurrentDate']}")
    print(f"    RUL to WARNING: {r['RulWarningMonths']} mon. ({r['RulWarningYears']} years)")
    print(f"    Replace (plan): {r['ReplacementDateWarning'].strftime('%Y-%m')}")
 
    print(f"    RUL to CRITICAL: {r['RulCriticalMonths']} mon. ({r['RulCriticalYears']} years)")
    print(f"    Replace (deadline): {r['ReplacementDateCritical'].strftime('%Y-%m')}")

    print(f"    Limiting parameter: {r['LimitingParamWarning']}")

print("\n" + "="*80)
print("RUL CALCULATION COMPLETED")
print("="*80)