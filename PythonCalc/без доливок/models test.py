"""
ПОСТРОЕНИЕ ПРОГНОЗНЫХ МОДЕЛЕЙ
Версия: 2.1 (Экспоненциальная модель для TAN + t-тест Стьюдента)
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
from scipy import stats as scipy_stats

print("="*80)
print("ПОСТРОЕНИЕ ПРОГНОЗНЫХ МОДЕЛЕЙ (KFOLD CV + EXP для TAN)")
print("="*80)

# ===============================================================
# 1. ЗАГРУЗКА ДАННЫХ
# ===============================================================
print("\n[1/4] Загрузка данных...")
# Используем имя data, чтобы не конфликтовать с df (degrees of freedom) внутри цикла
data = pd.read_csv("training_data_combined.csv")

print(f"✅ Загружено {len(data)} записей")
print(f"📊 Тип: {type(data)}, Форма: {data.shape}")
print(f"📋 Столбцы: {list(data.columns)}")

# ===============================================================
# 2. КОНФИГУРАЦИЯ МОДЕЛЕЙ
# ===============================================================
print("\n[2/4] Выбор признаков и типа моделей...")

targets_config = {
    'TAN': {
        'target_col': 'TAN',
        'features': ['operating_hours', 'mean_oil_temp'],
        'model_type': 'exponential' 
    },
    'Water': {
        'target_col': 'water_pct',
        'features': ['mean_vibration', 'mean_oil_temp'],
        'model_type': 'linear'
    },
    'Impurities': {
        'target_col': 'impurities_pct',
        'features': ['mean_vibration', 'operating_hours'],
        'model_type': 'linear'
    },
    'Flash Point': {
        'target_col': 'flash_point_C',
        'features': ['operating_hours', 'impurities_pct'],
        'model_type': 'linear'
    }
}

for name, config in targets_config.items():
    model_type = "🔥 EXP" if config['model_type'] == 'exponential' else "📏 LINEAR"
    print(f"   {name}: {config['features']} [{model_type}]")

# ===============================================================
# 3. ОБУЧЕНИЕ И СТАТИСТИЧЕСКАЯ ПРОВЕРКА
# ===============================================================
print("\n[3/4] Обучение моделей и проверка значимости (t-тест Стьюдента)...")

scaler_dict = {}
models = {}
results = []

kf = KFold(n_splits=5, shuffle=True, random_state=42)

for name, config in targets_config.items():
    print(f"\n🔧 {name}:")
    
    target_col = config['target_col']
    feature_list = config['features']
    model_type = config['model_type']
    
    # Безопасное извлечение признаков
    if len(feature_list) == 1:
        X = data[[feature_list[0]]].values
    else:
        X = data[feature_list].values
    
    y = data[target_col].values
    
    # 🔥 Для экспоненциальной модели: log(y) = a*X + b
    if model_type == 'exponential':
        y_transformed = np.log(y + 0.001)
    else:
        y_transformed = y
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    model = LinearRegression()
    model.fit(X_scaled, y_transformed)
    
    # ===============================================================
    # СТАТИСТИЧЕСКАЯ ПРОВЕРКА: t-тест Стьюдента
    # ===============================================================
    X_with_const = np.column_stack([np.ones(len(X_scaled)), X_scaled])
    beta = np.linalg.lstsq(X_with_const, y_transformed, rcond=None)[0]

    y_pred_calc = X_with_const @ beta
    residuals = y_transformed - y_pred_calc
    
    n, p = len(y_transformed), X_scaled.shape[1]
    
    # ВАЖНО: degrees_of_freedom (df), чтобы не затирать DataFrame
    degrees_of_freedom = n - p - 1
    
    sigma_sq = np.sum(residuals**2) / degrees_of_freedom

    XtX_inv = np.linalg.inv(X_with_const.T @ X_with_const)
    se = np.sqrt(np.diag(XtX_inv) * sigma_sq)

    t_stats = beta / se
    
    # p-value через t-распределение Стьюдента
    p_values_calc = [2 * (1 - scipy_stats.t.cdf(abs(t), degrees_of_freedom)) for t in t_stats]
    p_values = p_values_calc[1:]
    t_stats_features = t_stats[1:]

    t_critical = scipy_stats.t.ppf(1 - 0.025, degrees_of_freedom)

    # F-статистика
    ss_res = np.sum(residuals**2)
    ss_tot = np.sum((y_transformed - np.mean(y_transformed))**2)
    f_stat = ((ss_tot - ss_res) / p) / (ss_res / degrees_of_freedom)
    f_pvalue = 1 - scipy_stats.f.cdf(f_stat, p, degrees_of_freedom)

    adj_r2 = 1 - (1 - r2_score(y_transformed, y_pred_calc)) * (n - 1) / degrees_of_freedom

    shapiro_stat, shapiro_p = scipy_stats.shapiro(residuals)
    residuals_normal = shapiro_p > 0.05

    # Кросс-валидация
    cv_scores = cross_val_score(model, X_scaled, y_transformed, cv=kf, scoring='r2')
    cv_scores_clean = cv_scores[~np.isnan(cv_scores)]
    
    if len(cv_scores_clean) > 0:
        cv_mean = cv_scores_clean.mean()
        cv_std = cv_scores_clean.std()
    else:
        cv_mean = np.nan
        cv_std = np.nan
    
    y_pred_transformed = model.predict(X_scaled)
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
        'Adj_R2': adj_r2,
        'F_Stat': f_stat,
        'F_P_Value': f_pvalue,
        'P_Values': p_values,
        'T_Stats': t_stats_features,
        'Residuals_Normal': residuals_normal,
        'Coefficient': model.coef_[0] if len(feature_list) == 1 else model.coef_,
        'Intercept': model.intercept_
    })
    
    # Вывод в консоль
    if np.isnan(cv_mean):
        print(f"   ⚠️  CV R²: nan")
    else:
        print(f"   CV R²: {cv_mean:.3f} (±{cv_std:.3f})")
    print(f"   Full R²: {full_r2:.3f}, Adj R²: {adj_r2:.3f}, MAE: {mae:.5f}")
    print(f"   F-тест (адекватность): F={f_stat:.2f}, p={f_pvalue:.5f} {'✅' if f_pvalue < 0.05 else '❌'}")
    print(f"   t-тест Стьюдента (α=0.05, df={degrees_of_freedom}): критическое t = ±{t_critical:.3f}")
    print(f"   Нормальность остатков: {'✅ Да' if residuals_normal else '❌ Нет'} (Shapiro p={shapiro_p:.4f})")
    
    for feat, t, p in zip(feature_list, t_stats_features, p_values):
        sig = "***" if p < 0.001 else "**" if p < 0.01 else "*" if p < 0.05 else ""
        status = "✅ значим" if abs(t) > t_critical else "❌ не значим"
        print(f"   ├ {feat}: t={t:.3f}, p={p:.5f} {sig} [{status}]")
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

# Графики предсказаний
fig, axes = plt.subplots(2, 2, figsize=(14, 10))
axes = axes.flatten()

for idx, res in enumerate(results):
    ax = axes[idx]
    name = res['Target']
    target_col = res['Target_Col']
    model_type = res['Model_Type']
    
    X = data[res['Features']]
    y_true = data[target_col].values
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
    cv_str = f"{res['CV_R2_Mean']:.3f} (±{res['CV_R2_Std']:.3f})" if not np.isnan(res['CV_R2_Mean']) else "nan (N/A)"
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