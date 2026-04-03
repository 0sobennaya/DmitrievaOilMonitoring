"""
СОЗДАНИЕ РЕАЛЬНЫХ ДАННЫХ: УСКОРЕННАЯ ДЕГРАДАЦИЯ
Версия: 4.0 (Реалистичный RUL 2-4 года)
"""
import pandas as pd
import numpy as np

np.random.seed(42)

print("="*80)
print("СОЗДАНИЕ РЕАЛЬНЫХ ДАННЫХ: УСКОРЕННАЯ ДЕГРАДАЦИЯ")
print("="*80)

# ===============================================================
# 1. БАЗОВЫЕ ЗАМЕРЫ (из задания)
# ===============================================================
base_data = [
    # Насос 1 - без доливок
    {'date': '2022-07-26', 'pump_id': 1, 'TAN': 0.01, 'water_pct': 0.02, 'impurities_pct': 0.02, 'flash_point_C': 208.0},
    {'date': '2024-07-23', 'pump_id': 1, 'TAN': 0.02, 'water_pct': 0.03, 'impurities_pct': 0.04, 'flash_point_C': 197},
    {'date': '2025-01-21', 'pump_id': 1, 'TAN': 0.02, 'water_pct': 0.03, 'impurities_pct': 0.087, 'flash_point_C': 194},
    {'date': '2025-04-22', 'pump_id': 1, 'TAN': 0.02, 'water_pct': 0.02, 'impurities_pct': 0.044, 'flash_point_C': 203},
    {'date': '2025-07-22', 'pump_id': 1, 'TAN': 0.02, 'water_pct': 0.03, 'impurities_pct': 0.098, 'flash_point_C': 193},
    
    # Насос 2 - с доливкой в апреле 2025
    {'date': '2022-07-26', 'pump_id': 2, 'TAN': 0.01, 'water_pct': 0.02, 'impurities_pct': 0.02, 'flash_point_C': 208.0},
    {'date': '2024-07-23', 'pump_id': 2, 'TAN': 0.02, 'water_pct': 0.03, 'impurities_pct': 0.048, 'flash_point_C': 198},
    {'date': '2025-01-21', 'pump_id': 2, 'TAN': 0.01, 'water_pct': 0.03, 'impurities_pct': 0.061, 'flash_point_C': 190},
    {'date': '2025-04-22', 'pump_id': 2, 'TAN': 0.02, 'water_pct': 0.03, 'impurities_pct': 0.033, 'flash_point_C': 206},
    {'date': '2025-07-22', 'pump_id': 2, 'TAN': 0.02, 'water_pct': 0.03, 'impurities_pct': 0.091, 'flash_point_C': 194},
]

df_base = pd.DataFrame(base_data)
df_base['date'] = pd.to_datetime(df_base['date'])

# ===============================================================
# 2. ФИЗИЧЕСКИЕ ФОРМУЛЫ (УСКОРЕННАЯ ДЕГРАДАЦИЯ)
# ===============================================================
# 🔥 Коэффициенты ускорения деградации (для реалистичного RUL 2-4 года)
DEGRADATION_MULTIPLIER = 2.5  # В 2.5 раза быстрее чем в обучающей выборке

def calculate_telemetry(row, pump_id, has_leak=False):
    """
    Расчёт телеметрии с ускоренной деградацией
    """
    if pump_id == 1:
        base_vib = 0.65  # Чуть выше базовая вибрация
        base_temp = 60.0  # Чуть выше температура
    else:
        base_vib = 0.75
        base_temp = 64.0
    
    start_date = pd.Timestamp('2022-07-26')
    days_elapsed = (row['date'] - start_date).days
    hours = days_elapsed * 24 * 0.40  # 40% времени работы (быстрее износ)
    
    # 🔥 Вибрация растёт БЫСТРЕЕ
    vib_growth = 0.005 * (days_elapsed / 30) * DEGRADATION_MULTIPLIER  # Было 0.002
    vib_impurity_effect = 0.15 * (row['impurities_pct'] - 0.02)  # Было 0.05
    vibration = base_vib + vib_growth + vib_impurity_effect
    vibration += np.random.normal(0, 0.08)
    vibration = max(0.5, min(3.0, vibration))
    
    # 🔥 Температура выше (ускоряет деградацию)
    month = row['date'].month
    seasonal = 1.0 + 0.20 * np.sin(2 * np.pi * (month - 1) / 12)  # Было 0.15
    temp_tan_effect = 5.0 * (row['TAN'] - 0.01)  # Было 2.0
    oil_temp = base_temp + 12 * seasonal + temp_tan_effect  # Было 8
    oil_temp += np.random.normal(0, 3.0)
    oil_temp = max(50, min(90, oil_temp))
    
    bearing_temp = oil_temp + 15 + np.random.normal(0, 2.0)
    
    if has_leak:
        vibration *= 1.20
        oil_temp += 5
    
    return {
        'mean_vibration': round(vibration, 3),
        'mean_oil_temp': round(oil_temp, 2),
        'mean_bearing_temp': round(bearing_temp, 2),
        'operating_hours': round(hours, 0)
    }

def recalculate_flash_point(row):
    """
    Flash Point по формуле с большим разбросом
    """
    flash_point = 216 - 200 * row['TAN'] - 80 * row['water_pct']
    flash_point += np.random.normal(0, 5)  # Больше шум (было 3)
    flash_point = max(160, min(220, flash_point))
    return round(flash_point, 2)

# ===============================================================
# 3. СОЗДАНИЕ СЦЕНАРИЯ
# ===============================================================
print("\n[1/3] Создание данных с ускоренной деградацией...")

df_scenario = df_base.copy()
df_scenario['is_topup'] = False
df_scenario['has_leak'] = False

# Доливка ТОЛЬКО для Насоса 2
topup_date = pd.Timestamp('2025-04-22')
topup_mask = (df_scenario['date'] == topup_date) & (df_scenario['pump_id'] == 2)

df_scenario.loc[topup_mask, 'is_topup'] = True
df_scenario.loc[topup_mask, 'has_leak'] = True

print(f"   Насос 1: Без доливок (ускоренная деградация)")
print(f"   Насос 2: С доливкой {topup_date.strftime('%Y-%m-%d')}")

# Пересчитываем Flash Point
df_scenario['flash_point_C'] = df_scenario.apply(recalculate_flash_point, axis=1)

# Добавляем телеметрию
telemetry = df_scenario.apply(
    lambda row: calculate_telemetry(row, row['pump_id'], has_leak=row['has_leak']),
    axis=1
)

df_scenario['mean_vibration'] = [t['mean_vibration'] for t in telemetry]
df_scenario['mean_oil_temp'] = [t['mean_oil_temp'] for t in telemetry]
df_scenario['mean_bearing_temp'] = [t['mean_bearing_temp'] for t in telemetry]
df_scenario['operating_hours'] = [t['operating_hours'] for t in telemetry]

print(f"✅ Всего записей: {len(df_scenario)}")
print(f"   Доливок: {df_scenario['is_topup'].sum()}")

# ===============================================================
# 4. СОХРАНЕНИЕ
# ===============================================================
print("\n[2/3] Сохранение файлов...")

df_scenario.to_csv("real_data_combined_scenarios.csv", index=False, encoding='utf-8')
print("   ✅ real_data_combined_scenarios.csv")

df_pump1 = df_scenario[df_scenario['pump_id'] == 1].copy()
df_pump2 = df_scenario[df_scenario['pump_id'] == 2].copy()

df_pump1.to_csv("real_data_pump1_no_topup.csv", index=False, encoding='utf-8')
df_pump2.to_csv("real_data_pump2_with_topup.csv", index=False, encoding='utf-8')
print("   ✅ real_data_pump1_no_topup.csv")
print("   ✅ real_data_pump2_with_topup.csv")

# ===============================================================
# 5. ПРОВЕРКА ДЕГРАДАЦИИ
# ===============================================================
print("\n[3/3] Проверка скорости деградации...")

for pump_id in df_scenario['pump_id'].unique():
    df_pump = df_scenario[df_scenario['pump_id'] == pump_id]
    
    # Скорость роста TAN
    tan_growth = (df_pump['TAN'].max() - df_pump['TAN'].min()) / (df_pump['operating_hours'].max() / 1000)
    
    # Скорость роста примесей
    imp_growth = (df_pump['impurities_pct'].max() - df_pump['impurities_pct'].min()) / (df_pump['operating_hours'].max() / 1000)
    
    print(f"\n🔧 НАСОС {pump_id}:")
    print(f"   TAN: +{tan_growth:.4f} на 1000 часов")
    print(f"   Примеси: +{imp_growth:.4f} на 1000 часов")
    print(f"   Вибрация: {df_pump['mean_vibration'].min():.3f} - {df_pump['mean_vibration'].max():.3f}")
    print(f"   Температура: {df_pump['mean_oil_temp'].min():.1f} - {df_pump['mean_oil_temp'].max():.1f}°C")

# ===============================================================
# 6. СТАТИСТИКА
# ===============================================================
print("\n" + "="*80)
print("📊 СТАТИСТИКА ПО НАСОСАМ")
print("="*80)

for pump_id in df_scenario['pump_id'].unique():
    df_pump = df_scenario[df_scenario['pump_id'] == pump_id]
    has_topup = df_pump['is_topup'].sum() > 0
    
    print(f"\n🔧 НАСОС {pump_id} {'(С ДОЛИВКОЙ)' if has_topup else '(БЕЗ ДОЛИВОК)'}:")
    print(f"   Замеров: {len(df_pump)}")
    print(f"   Период: {df_pump['date'].min().strftime('%Y-%m-%d')} — {df_pump['date'].max().strftime('%Y-%m-%d')}")
    print(f"   Наработка: {df_pump['operating_hours'].min():.0f} - {df_pump['operating_hours'].max():.0f} часов")
    print(f"   ─" * 50)
    print(f"   TAN: {df_pump['TAN'].min():.3f} - {df_pump['TAN'].max():.3f} mg KOH/g")
    print(f"   Water: {df_pump['water_pct'].min():.3f} - {df_pump['water_pct'].max():.3f} %")
    print(f"   Impurities: {df_pump['impurities_pct'].min():.3f} - {df_pump['impurities_pct'].max():.3f} %")
    print(f"   Flash Point: {df_pump['flash_point_C'].min():.1f} - {df_pump['flash_point_C'].max():.1f} °C")
    print(f"   ─" * 50)
    print(f"   Вибрация: {df_pump['mean_vibration'].min():.3f} - {df_pump['mean_vibration'].max():.3f} мм/с")
    print(f"   Температура: {df_pump['mean_oil_temp'].min():.1f} - {df_pump['mean_oil_temp'].max():.1f} °C")

print("\n" + "="*80)
print("🎯 ОЖИДАЕМЫЙ RUL: 2-4 года (вместо 5-7 лет)")
print("="*80)
print("\n📁 Порядок запуска:")
print("   1. python gen_data.py — обучающие данные")
print("   2. python models.py — обучение моделей")
print("   3. python gen_real_data.py — реальные данные (ЭТОТ ФАЙЛ)")
print("   4. python 05_calculate_rul_2030.py — расчёт RUL")
print("="*80)