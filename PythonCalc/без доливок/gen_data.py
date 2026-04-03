"""
ГЕНЕРАЦИЯ ДАННЫХ ДЛЯ 2 НАСОСОВ (БЕЗ ДОЛИВОК)
Версия: 1.0 (Clean Physics)
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

np.random.seed(42)
plt.style.use('seaborn-v0_8-whitegrid')

print("="*80)
print("ГЕНЕРАЦИЯ ДАННЫХ: 2 НАСОСА, РАЗНАЯ НАРАБОТКА")
print("="*80)

real_points = {
    1: [
        ('2022-07-26', 0.01, 0.02, 0.02, 208.0),
        ('2024-07-23', 0.02, 0.03, 0.04, 197),
        ('2025-01-21', 0.02, 0.03, 0.087, 194),
        ('2025-04-22', 0.02, 0.03, 0.044, 203),  # доливка
        ('2025-07-22', 0.02, 0.03, 0.098, 193),
    ],
    2: [
        ('2022-07-26', 0.01, 0.02, 0.02, 208.0),
        ('2024-07-23', 0.02, 0.03, 0.048, 198),
        ('2025-01-21', 0.01, 0.03, 0.061, 190),
        ('2025-04-22', 0.02, 0.03, 0.033, 206),  # доливка
        ('2025-07-22', 0.02, 0.03, 0.091, 194),
    ]
}

def generate_pump_data(pump_id, n_quarters=40, load_factor=1.0, start_date='2022-07-26'):
    """
    Генерация данных для одного насоса БЕЗ ДОЛИВОК масла.
    load_factor: 1.0 = нормальная нагрузка, 1.3 = повышенная
    """
    
    dates = pd.date_range(start=start_date, periods=n_quarters, freq='91D')
    
    # Начальные условия (новое масло)
    tan = 0.020
    water = 0.030
    impurities = 0.025
    flash_point = 210.0
    hours = 0
    
    data = []
    
    for i in range(n_quarters):
        quarter = i % 4
        seasonal = 1.0 + 0.15 * np.sin(2 * np.pi * (quarter - 1) / 4)
        
        # === ТЕЛЕМЕТРИЯ НАСОСА ===
        base_temp = 58.0 * load_factor
        oil_temp = base_temp + 8 * seasonal + np.random.normal(0, 1.5)
        max_temp = oil_temp + np.random.uniform(8, 12)
        
        base_vib = 0.60 * load_factor
        vibration = base_vib + 0.02 * i + np.random.normal(0, 0.08)
        vibration = max(0.4, vibration)
        max_vib = vibration * np.random.uniform(1.3, 1.6)
        
        bearing_temp = oil_temp + 12 + np.random.normal(0, 1)
        power = 21 * load_factor + np.random.normal(0, 1)
        deltaP = 1.25 + np.random.normal(0, 0.05)
        oil_pressure = 0.31 + np.random.normal(0, 0.015)
        
        hours += 2100 * load_factor + np.random.normal(0, 100)
        
        # === ДЕГРАДАЦИЯ МАСЛА (ФИЗИЧЕСКИЕ ФОРМУЛЫ) ===
        
        # TAN растет от температуры и времени
        tan_growth = 0.003 + 0.0002 * (oil_temp - 55) / 10
        tan += tan_growth * load_factor
        tan += np.random.normal(0, 0.002)
        tan = max(0.015, min(1, tan))
        
        # Вода зависит от сезона (конденсат)
        water_base = 0.030 + 0.005 * (oil_temp - 55) / 10  # Температурная зависимость
        water_seasonal = 0.002 if quarter in [2, 3] else 0  # Зимой/осенью больше конденсата
        water += 0.002 + water_seasonal
        water = water_base + (water - 0.030) * 0.5
        water += np.random.normal(0, 0.003)
        water = max(0.020, min(0.200, water))
        
        # Примеси растут от вибрации (износ)
        imp_growth = 0.003 + 0.05 * (vibration - 0.5)
        impurities += imp_growth * load_factor
        impurities += np.random.normal(0, 0.002)
        impurities = max(0.020, min(1.2, impurities)) + np.random.normal(0, 0.002)
        
        # Flash Point по физической формуле
        flash_point = 216 - 200 * tan - 80 * water
        flash_point += np.random.normal(0, 3)
        flash_point = max(151, min(220, flash_point))
        
        data.append({
            'date': dates[i],
            'pump_id': pump_id,
            'mean_oil_temp': round(oil_temp, 2),
            'max_oil_temp': round(max_temp, 2),
            'mean_bearing_temp': round(bearing_temp, 2),
            'mean_vibration': round(vibration, 3),
            'max_vibration': round(max_vib, 3),
            'mean_power': round(power, 2),
            'mean_deltaP': round(deltaP, 3),
            'mean_oil_pressure': round(oil_pressure, 3),
            'operating_hours': round(hours, 0),
            'TAN': round(tan, 4),
            'water_pct': round(water, 4),
            'impurities_pct': round(impurities, 4),
            'flash_point_C': round(flash_point, 2),
            'is_synthetic': True
        })
    
    return pd.DataFrame(data)

# ===============================================================
# ГЕНЕРАЦИЯ
# ===============================================================

print("\n[1/3] Генерация данных для Насоса 1 (нормальная нагрузка)...")
df_pump1 = generate_pump_data(pump_id=1, n_quarters=20, load_factor=2.0)
print(f"✅ Насос 1: {len(df_pump1)} записей, {df_pump1['operating_hours'].max():.0f} часов")

print("\n[2/3] Генерация данных для Насоса 2 (повышенная нагрузка)...")
df_pump2 = generate_pump_data(pump_id=2, n_quarters=20, load_factor=2.5)
print(f"✅ Насос 2: {len(df_pump2)} записей, {df_pump2['operating_hours'].max():.0f} часов")

# Объединяем
df_combined = pd.concat([df_pump1, df_pump2], ignore_index=True)

print("\n[3/3] Сохранение файлов...")
df_pump1.to_csv("train_pump1.csv", index=False, encoding='utf-8')
df_pump2.to_csv("test_pump2.csv", index=False, encoding='utf-8')
df_combined.to_csv("training_data_combined.csv", index=False, encoding='utf-8')

with pd.ExcelWriter("generated_oil_data.xlsx", engine='openpyxl') as writer:
    df_pump1.to_excel(writer, sheet_name='Pump1_Train', index=False)
    df_pump2.to_excel(writer, sheet_name='Pump2_Test', index=False)

print("   ✅ train_pump1.csv")
print("   ✅ test_pump2.csv")
print("   ✅ training_data_combined.csv")
print("   ✅ generated_oil_data.xlsx")

# ===============================================================
# БЫСТРЫЙ АНАЛИЗ
# ===============================================================

print("\n" + "="*80)
print("📊 СТАТИСТИКА ПО НАСОСАМ")
print("="*80)

for df, name in [(df_pump1, 'Насос 1'), (df_pump2, 'Насос 2')]:
    print(f"\n{name}:")
    print(f"   Наработка: {df['operating_hours'].min():.0f} - {df['operating_hours'].max():.0f} часов")
    print(f"   TAN: {df['TAN'].min():.4f} - {df['TAN'].max():.4f}")
    print(f"   Flash Point: {df['flash_point_C'].min():.1f} - {df['flash_point_C'].max():.1f}°C")
    print(f"   Вибрация: {df['mean_vibration'].min():.3f} - {df['mean_vibration'].max():.3f} мм/с")

print("\n" + "="*80)
print("✅ ГЕНЕРАЦИЯ ЗАВЕРШЕНА. Запускайте 02_analyze_correlations.py")
print("="*80)

# График деградации
fig, axes = plt.subplots(2, 2, figsize=(14, 10))
axes = axes.flatten()

params = [('TAN', 'TAN (mg KOH/g)', 'blue'),
          ('water_pct', 'Water (%)', 'cyan'),
          ('impurities_pct', 'Impurities (%)', 'orange'),
          ('flash_point_C', 'Flash Point (°C)', 'red')]

for idx, (col, name, color) in enumerate(params):
    ax = axes[idx]
    ax.plot(df_pump1['date'], df_pump1[col], 'o-', color=color, label='Насос 1', alpha=0.7)
    ax.plot(df_pump2['date'], df_pump2[col], 's--', color='darkred', label='Насос 2', alpha=0.7)
    ax.set_xlabel('Дата')
    ax.set_ylabel(name)
    ax.set_title(f'{name} - Деградация без доливок')
    ax.legend()
    ax.grid(True, alpha=0.3)
    plt.setp(ax.xaxis.get_majorticklabels(), rotation=45, ha='right')

plt.tight_layout()
plt.savefig('oil_degradation_no_topups.png', dpi=300, bbox_inches='tight')
print("\n✅ Сохранено: oil_degradation_no_topups.png")
plt.close()