"""
ПОСТРОЕНИЕ ПРОГНОЗНЫХ МОДЕЛЕЙ
Версия: 2.0 (Экспоненциальная модель для TAN)
"""
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import cross_val_score, KFold
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_absolute_error
from sklearn.preprocessing import StandardScaler
import pickle
import warnings
warnings.filterwarnings('ignore')
plt.style.use('seaborn-v0_8-whitegrid')

print("="*80)
print("ПОСТРОЕНИЕ ПРОГНОЗНЫХ МОДЕЛЕЙ (KFOLD CV + EXP для TAN)")
print("="*80)

# ===============================================================
# 1. ЗАГРУЗКА ДАННЫХ
# ===============================================================
print("\n[1/4] Загрузка данных...")
df = pd.read_csv("training_data_combined.csv")
print(f"✅ Загружено {len(df)} записей")

# ===============================================================
# 2. КОНФИГУРАЦИЯ МОДЕЛЕЙ
# ===============================================================
print("\n[2/4] Выбор признаков и типа моделей...")

targets_config = {
    'TAN': {
        'target_col': 'TAN',
        'features': ['impurities_pct', 'mean_vibration'],
        'model_type': 'exponential'  # 🔥 Экспоненциальная для TAN
    },
    'Water': {
        'target_col': 'water_pct',
        'features': ['mean_vibration', 'mean_oil_temp', 'TAN'],
        'model_type': 'linear'
    },
    'Impurities': {
        'target_col': 'impurities_pct',
        'features': [ 'mean_vibration','operating_hours'],
        'model_type': 'linear'
    },
    'Flash Point': {
        'target_col': 'flash_point_C',
        'features': ['mean_vibration', 'impurities_pct'],
        'model_type': 'linear'
    }
}

for name, config in targets_config.items():
    model_type = "🔥 EXP" if config['model_type'] == 'exponential' else "📏 LINEAR"
    print(f"   {name}: {config['features']} [{model_type}]")

# ===============================================================
# 3. ОБУЧЕНИЕ И ОЦЕНКА
# ===============================================================
print("\n[3/4] Обучение моделей...")

scaler_dict = {}
models = {}
results = []

kf = KFold(n_splits=5, shuffle=True, random_state=42)

for name, config in targets_config.items():
    print(f"\n🔧 {name}:")
    
    target_col = config['target_col']
    feature_list = config['features']
    model_type = config['model_type']
    
    X = df[feature_list].values
    y = df[target_col].values
    
    # 🔥 Для экспоненциальной модели: log(y) = a*X + b
    if model_type == 'exponential':
        y_transformed = np.log(y + 0.001)  # +0.001 для защиты от log(0)
    else:
        y_transformed = y
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    model = LinearRegression()
    model.fit(X_scaled, y_transformed)
    
    # Кросс-валидация
    cv_scores = cross_val_score(model, X_scaled, y_transformed, cv=kf, scoring='r2')
    cv_scores_clean = cv_scores[~np.isnan(cv_scores)]
    
    if len(cv_scores_clean) > 0:
        cv_mean = cv_scores_clean.mean()
        cv_std = cv_scores_clean.std()
    else:
        cv_mean = np.nan
        cv_std = np.nan
    
    # Предсказание
    y_pred_transformed = model.predict(X_scaled)
    
    # 🔥 Обратное преобразование для экспоненциальной модели
    if model_type == 'exponential':
        y_pred = np.exp(y_pred_transformed)
    else:
        y_pred = y_pred_transformed
    
    full_r2 = r2_score(y, y_pred)
    mae = mean_absolute_error(y, y_pred)
    
    models[name] = model
    scaler_dict[name] = scaler
    
    results.append({
        'Target': name,
        'Target_Col': target_col,
        'Features': feature_list,
        'Model_Type': model_type,
        'CV_R2_Mean': cv_mean,
        'CV_R2_Std': cv_std,
        'Full_R2': full_r2,
        'MAE': mae,
        'Coefficient': model.coef_[0] if len(feature_list) == 1 else model.coef_,
        'Intercept': model.intercept_
    })
    
    if np.isnan(cv_mean):
        print(f"   ⚠️  CV R²: nan")
    else:
        print(f"   CV R²: {cv_mean:.3f} (±{cv_std:.3f})")
    print(f"   Full R²: {full_r2:.3f}, MAE: {mae:.5f}")
    print(f"   Тип модели: {model_type}")

# ===============================================================
# 4. СОХРАНЕНИЕ И ВИЗУАЛИЗАЦИЯ
# ===============================================================
print("\n[4/4] Сохранение и визуализация...")

with open('models.pkl', 'wb') as f:
    pickle.dump({
        'models': models,
        'scalers': scaler_dict,
        'config': targets_config
    }, f)
print("   ✅ models.pkl")

# Графики
fig, axes = plt.subplots(2, 2, figsize=(14, 10))
axes = axes.flatten()

for idx, res in enumerate(results):
    ax = axes[idx]
    name = res['Target']
    target_col = res['Target_Col']
    model_type = res['Model_Type']
    
    X = df[res['Features']]
    y_true = df[target_col].values
    X_scaled = scaler_dict[name].transform(X)
    
    y_pred_transformed = models[name].predict(X_scaled)
    if model_type == 'exponential':
        y_pred = np.exp(y_pred_transformed)
    else:
        y_pred = y_pred_transformed
    
    ax.scatter(y_true, y_pred, alpha=0.7, s=80, edgecolors='black')
    
    min_val = min(y_true.min(), y_pred.min())
    max_val = max(y_true.max(), y_pred.max())
    ax.plot([min_val, max_val], [min_val, max_val], 'r--', linewidth=2)
    
    full_r2 = res['Full_R2']
    if full_r2 >= 0.7:
        color = 'green'
        status = '✅'
    elif full_r2 >= 0.4:
        color = 'orange'
        status = '⚠️'
    else:
        color = 'red'
        status = '❌'
    
    model_label = "EXP" if model_type == 'exponential' else "LIN"
    ax.set_title(f'{name}\n{model_label} | Full R² = {full_r2:.3f} {status}', 
                 fontweight='bold', color=color)
    ax.set_xlabel('Фактическое значение')
    ax.set_ylabel('Предсказание')
    ax.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('model_predictions.png', dpi=300)
print("   ✅ model_predictions.png")
plt.close()

# ===============================================================
# ФИНАЛЬНЫЙ ОТЧЁТ
# ===============================================================
print("\n" + "="*80)
print("СВОДНАЯ ТАБЛИЦА КАЧЕСТВА МОДЕЛЕЙ")
print("="*80)
print(f"{'Параметр':<15} | {'Тип':<8} | {'Признаки':<25} | {'CV R²':<15} | {'Full R²':<12}")
print("-" * 85)

for res in results:
    features_str = ', '.join(res['Features'])
    model_label = "🔥 EXP" if res['Model_Type'] == 'exponential' else "📏 LIN"
    if np.isnan(res['CV_R2_Mean']):
        cv_str = "nan (N/A)"
    else:
        cv_str = f"{res['CV_R2_Mean']:.3f} (±{res['CV_R2_Std']:.3f})"
    print(f"{res['Target']:<15} | {model_label:<8} | {features_str:<25} | {cv_str:<15} | {res['Full_R2']:<12.3f}")

print("="*80)

print("\n💡 ИНТЕРПРЕТАЦИЯ ДЛЯ ВКР:")
print("   1. TAN: Экспоненциальная модель (окисление масла ускоряется со временем)")
print("   2. Остальные параметры: Линейная регрессия")
print("   3. Формула экспоненты: TAN = exp(a·X + b)")
print("   4. Физическое обоснование: скорость окисления растёт с накоплением продуктов")

print("\n" + "="*80)
print("✅ МОДЕЛИ ГОТОВЫ. Запускайте rul.py")
print("="*80)

# ===============================================================
# ВЫВОД ФОРМУЛ МОДЕЛЕЙ
# ===============================================================
print("\n" + "="*80)
print("ФОРМУЛЫ МОДЕЛЕЙ")
print("="*80)

for res in results:
    name = res['Target']
    model_type = res['Model_Type']
    features = res['Features']
    coef = res['Coefficient']
    intercept = res['Intercept']
    
    print(f"\n📊 {name}:")
    print(f"   Тип: {model_type}")
    print(f"   Признаки: {features}")
    print(f"   Intercept (b): {intercept:.6f}")
    
    if len(features) == 1:
        print(f"   Coef (a): {coef[0]:.6f}")
    else:
        for i, (feat, c) in enumerate(zip(features, coef)):
            print(f"   Coef {feat}: {c:.6f}")
    
    # Формула
    if model_type == 'exponential':
        if len(features) == 1:
            print(f"\n   ФОРМУЛА: {name} = exp({coef[0]:.4f}·{features[0]} + {intercept:.4f})")
        else:
            terms = [f"{c:.4f}·{f}" for f, c in zip(features, coef)]
            formula = " + ".join(terms) + f" + {intercept:.4f}"
            print(f"\n   ФОРМУЛА: {name} = exp({formula})")
    else:
        if len(features) == 1:
            print(f"\n   ФОРМУЛА: {name} = {coef[0]:.4f}·{features[0]} + {intercept:.4f}")
        else:
            terms = [f"{c:.4f}·{f}" for f, c in zip(features, coef)]
            formula = " + ".join(terms) + f" + {intercept:.4f}"
            print(f"\n   ФОРМУЛА: {name} = {formula}")

print("\n" + "="*80)