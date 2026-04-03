"""
АНАЛИЗ КОРРЕЛЯЦИЙ ПАРАМЕТРОВ МАСЛА
Версия: 1.0
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

plt.style.use('seaborn-v0_8-whitegrid')

print("="*80)
print("АНАЛИЗ КОРРЕЛЯЦИЙ")
print("="*80)

# Загрузка
df = pd.read_csv("training_data_combined.csv")
df['date'] = pd.to_datetime(df['date'])
print(f"\n✅ Загружено {len(df)} записей")

# Числовые колонки
numeric_cols = ['mean_oil_temp', 'mean_bearing_temp', 'mean_vibration', 
                'operating_hours', 'TAN', 'water_pct', 'impurities_pct', 'flash_point_C']

# Матрица корреляций
corr_matrix = df[numeric_cols].corr(method='pearson')
corr_matrix.to_csv("correlation_matrix.csv", encoding='utf-8')

print("\n📊 Матрица корреляций сохранена в correlation_matrix.csv")

# Тепловая карта
plt.figure(figsize=(12, 10))
mask = np.triu(np.ones_like(corr_matrix, dtype=bool))

sns.heatmap(corr_matrix, mask=mask, annot=True, fmt='.2f', cmap='coolwarm', 
            center=0, square=True, linewidths=0.5, cbar_kws={"shrink": 0.8})

plt.title('Матрица корреляций параметров масла', fontsize=14, fontweight='bold', pad=20)
plt.tight_layout()
plt.savefig('correlation_heatmap.png', dpi=300, bbox_inches='tight')
print("✅ Сохранено: correlation_heatmap.png")
plt.close()

# Ключевые корреляции для моделей
print("\n" + "="*80)
print("🔑 КЛЮЧЕВЫЕ КОРРЕЛЯЦИИ ДЛЯ МОДЕЛЕЙ")
print("="*80)

targets = ['TAN', 'water_pct', 'impurities_pct', 'flash_point_C']
features = ['mean_vibration', 'operating_hours', 'mean_oil_temp', 'mean_bearing_temp']

for target in targets:
    print(f"\n📌 {target}:")
    for feat in features:
        corr = corr_matrix.loc[target, feat]
        marker = "✅" if abs(corr) >= 0.7 else "⚠️" if abs(corr) >= 0.4 else "❌"
        print(f"   {marker} {feat}: {corr:+.3f}")

print("\n" + "="*80)
print("✅ АНАЛИЗ ЗАВЕРШЕН. Запускайте 03_build_models.py")
print("="*80)