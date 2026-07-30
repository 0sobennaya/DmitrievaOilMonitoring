import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np

# Данные корреляционной матрицы
data = {
    'mean_oil_temp': [1.00, 0.82, 0.68, 0.35, 0.58, 0.42, 0.51, -0.48],
    'mean_bearing_temp': [0.82, 1.00, 0.71, 0.38, 0.61, 0.39, 0.55, -0.52],
    'mean_vibration': [0.68, 0.71, 1.00, 0.62, 0.48, 0.31, 0.74, -0.58],
    'operating_hours': [0.35, 0.38, 0.62, 1.00, 0.72, 0.28, 0.68, -0.65],
    'TAN': [0.48, 0.51, 0.63, 0.61, 1.00, 0.35, 0.52, -0.71],
    'water_pct': [0.42, 0.39, 0.31, 0.28, 0.45, 1.00, 0.29, -0.22],
    'impurities_pct': [0.51, 0.55, 0.74, 0.68, 0.52, 0.29, 1.00, -0.63],
    'flash_point_C': [-0.38, -0.42, -0.58, -0.61, -0.71, -0.22, -0.63, 1.00]
}

# Создание DataFrame
df = pd.DataFrame(data, index=['mean_oil_temp', 'mean_bearing_temp', 'mean_vibration', 
                                'operating_hours', 'TAN', 'water_pct', 
                                'impurities_pct', 'flash_point_C'])

# Создание маски для нижней треугольной матрицы
mask = np.triu(np.ones_like(df, dtype=bool))

# Настройка шрифта для кириллицы
plt.rcParams['font.family'] = 'DejaVu Sans'

# Создание графика
plt.figure(figsize=(10, 8))
sns.heatmap(df, mask=mask, annot=True, fmt='.2f', cmap='coolwarm', 
            vmin=-0.75, vmax=1.0, center=0,
            square=True, linewidths=.5, cbar_kws={"shrink": .8, "label": ""})

plt.title('Матрица корреляций параметров масла', fontsize=14, pad=20)
plt.xticks(rotation=45, ha='right')
plt.yticks(rotation=0)
plt.tight_layout()

# Сохранение и отображение
plt.savefig('correlation_matrix.png', dpi=300, bbox_inches='tight')
plt.show()