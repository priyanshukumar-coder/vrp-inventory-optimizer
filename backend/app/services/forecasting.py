import os
import pandas as pd
import numpy as np
try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except ImportError:
    xgb = None
    XGB_AVAILABLE = False

try:
    from sklearn.ensemble import GradientBoostingRegressor
except Exception:
    GradientBoostingRegressor = None
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "historical_demand.csv")

def load_historical_data(filepath: str = DATA_PATH) -> pd.DataFrame:
    """
    Load historical demand data and ensure proper date parsing and sorting.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Historical demand data file not found at {filepath}")
    
    df = pd.read_csv(filepath)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(by=['dealer_id', 'date']).reset_index(drop=True)
    return df

def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineer time-series features: calendar indicators, lag features, and rolling statistics.
    Groups by dealer_id to prevent cross-dealer leakage.
    """
    data = df.copy()
    data['day_of_week'] = data['date'].dt.dayofweek
    data['day_of_month'] = data['date'].dt.day
    data['month'] = data['date'].dt.month
    data['quarter'] = data['date'].dt.quarter
    data['is_weekend'] = data['day_of_week'].isin([5, 6]).astype(int)

    # Lag features per dealer
    for lag in [1, 2, 7, 14, 21, 28]:
        data[f'lag_{lag}'] = data.groupby('dealer_id')['demand'].shift(lag)

    # Rolling statistics per dealer (shifted by 1 to prevent target leakage)
    for window in [7, 14, 30]:
        data[f'rolling_mean_{window}'] = (
            data.groupby('dealer_id')['demand']
            .transform(lambda x: x.shift(1).rolling(window=window, min_periods=3).mean())
        )
        data[f'rolling_std_{window}'] = (
            data.groupby('dealer_id')['demand']
            .transform(lambda x: x.shift(1).rolling(window=window, min_periods=3).std())
        )

    # Drop early rows where lags are not available
    data = data.dropna().reset_index(drop=True)
    return data

def train_xgboost_forecast(df: pd.DataFrame = None, forecast_days: int = 7) -> Dict[str, Any]:
    """
    Trains an XGBoost regression model using strict chronological split,
    computes evaluation metrics, feature importances, and forecasts future demand for all dealers.
    """
    if df is None:
        df = load_historical_data()

    featured_df = build_features(df)

    feature_cols = [
        'dealer_id', 'day_of_week', 'day_of_month', 'month', 'quarter', 'is_weekend',
        'is_promotion', 'lead_time_days',
        'lag_1', 'lag_2', 'lag_7', 'lag_14', 'lag_21', 'lag_28',
        'rolling_mean_7', 'rolling_std_7', 'rolling_mean_14', 'rolling_std_14',
        'rolling_mean_30', 'rolling_std_30'
    ]
    target_col = 'demand'

    # Chronological train/test split: 85% train, 15% test
    unique_dates = featured_df['date'].sort_values().unique()
    split_idx = int(len(unique_dates) * 0.85)
    split_date = unique_dates[split_idx]

    train_mask = featured_df['date'] < split_date
    test_mask = featured_df['date'] >= split_date

    X_train = featured_df.loc[train_mask, feature_cols]
    y_train = featured_df.loc[train_mask, target_col]
    X_test = featured_df.loc[test_mask, feature_cols]
    y_test = featured_df.loc[test_mask, target_col]

    if XGB_AVAILABLE and xgb is not None:
        logger.info(f"Training XGBoost Regressor on {len(X_train)} samples, testing on {len(X_test)} samples.")
        model = xgb.XGBRegressor(
            n_estimators=180,
            max_depth=5,
            learning_rate=0.06,
            subsample=0.85,
            colsample_bytree=0.85,
            random_state=42,
            n_jobs=-1
        )
        model.fit(
            X_train, y_train,
            eval_set=[(X_train, y_train), (X_test, y_test)],
            verbose=False
        )
        model_type_name = "XGBoost Regressor (Tree-based)"
    else:
        logger.info(f"Training GradientBoostingRegressor (Fallback) on {len(X_train)} samples, testing on {len(X_test)} samples.")
        model = GradientBoostingRegressor(
            n_estimators=120,
            max_depth=5,
            learning_rate=0.06,
            subsample=0.85,
            random_state=42
        )
        model.fit(X_train, y_train)
        model_type_name = "Gradient Boosting Regressor (Fallback)"

    # Predictions & Metrics on test set
    y_pred = model.predict(X_test)
    y_pred = np.maximum(0, y_pred)

    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
    mae = float(mean_absolute_error(y_test, y_pred))
    r2 = float(r2_score(y_test, y_pred))
    mape = float(np.mean(np.abs((y_test - y_pred) / np.maximum(y_test, 1.0))) * 100)

    # Feature importances
    importances = model.feature_importances_
    feature_importance_list = [
        {"feature": col, "importance": round(float(imp), 4)}
        for col, imp in sorted(zip(feature_cols, importances), key=lambda x: x[1], reverse=True)
    ]

    # Generate 7-day future forecast for each dealer
    last_date = df['date'].max()
    future_dates = [last_date + pd.Timedelta(days=d) for d in range(1, forecast_days + 1)]
    dealers = sorted(df['dealer_id'].unique())

    # Build recursive/rolling forecast for future dates
    dealer_names = df[['dealer_id', 'dealer_name']].drop_duplicates().set_index('dealer_id')['dealer_name'].to_dict()
    
    sim_df = df.copy()
    daily_forecasts = []
    dealer_summaries = {}

    for d_id in dealers:
        dealer_preds = []
        d_name = dealer_names.get(d_id, f"Dealer {d_id}")

        for f_date in future_dates:
            dealer_history = sim_df[sim_df['dealer_id'] == d_id].sort_values('date').tail(60)
            
            lag_1 = float(dealer_history.iloc[-1]['demand'])
            lag_2 = float(dealer_history.iloc[-2]['demand']) if len(dealer_history) >= 2 else lag_1
            lag_7 = float(dealer_history.iloc[-7]['demand']) if len(dealer_history) >= 7 else lag_1
            lag_14 = float(dealer_history.iloc[-14]['demand']) if len(dealer_history) >= 14 else lag_1
            lag_21 = float(dealer_history.iloc[-21]['demand']) if len(dealer_history) >= 21 else lag_1
            lag_28 = float(dealer_history.iloc[-28]['demand']) if len(dealer_history) >= 28 else lag_1

            roll_7 = float(dealer_history['demand'].tail(7).mean())
            roll_std_7 = float(dealer_history['demand'].tail(7).std(ddof=0)) if len(dealer_history) >= 3 else 5.0
            roll_14 = float(dealer_history['demand'].tail(14).mean())
            roll_std_14 = float(dealer_history['demand'].tail(14).std(ddof=0)) if len(dealer_history) >= 3 else 5.0
            roll_30 = float(dealer_history['demand'].tail(30).mean())
            roll_std_30 = float(dealer_history['demand'].tail(30).std(ddof=0)) if len(dealer_history) >= 3 else 5.0

            feat_dict = {
                'dealer_id': d_id,
                'day_of_week': f_date.dayofweek,
                'day_of_month': f_date.day,
                'month': f_date.month,
                'quarter': f_date.quarter,
                'is_weekend': 1 if f_date.dayofweek in [5, 6] else 0,
                'is_promotion': 1 if f_date.day in [1, 15] else 0,
                'lead_time_days': 1,
                'lag_1': lag_1,
                'lag_2': lag_2,
                'lag_7': lag_7,
                'lag_14': lag_14,
                'lag_21': lag_21,
                'lag_28': lag_28,
                'rolling_mean_7': roll_7,
                'rolling_std_7': roll_std_7,
                'rolling_mean_14': roll_14,
                'rolling_std_14': roll_std_14,
                'rolling_mean_30': roll_30,
                'rolling_std_30': roll_std_30
            }
            feat_row = pd.DataFrame([feat_dict])[feature_cols]
            pred_val = float(model.predict(feat_row)[0])
            pred_val = max(1.0, round(pred_val, 2))
            dealer_preds.append(pred_val)

            new_row = pd.DataFrame([{
                'date': f_date,
                'dealer_id': d_id,
                'dealer_name': d_name,
                'demand': pred_val,
                'is_promotion': feat_dict['is_promotion'],
                'lead_time_days': 1
            }])
            sim_df = pd.concat([sim_df, new_row], ignore_index=True)

            daily_forecasts.append({
                "date": f_date.strftime("%Y-%m-%d"),
                "day_number": int(f_date.dayofweek + 1),
                "dealer_id": int(d_id),
                "dealer_name": str(d_name),
                "predicted_demand": round(pred_val, 2)
            })

        mean_pred = float(np.mean(dealer_preds))
        intra_std = float(np.std(dealer_preds, ddof=0))
        dealer_sigma = round(float(np.sqrt(intra_std**2 + (rmse * 0.3)**2)), 2)

        dealer_summaries[int(d_id)] = {
            "dealer_id": int(d_id),
            "dealer_name": str(d_name),
            "predicted_mean_demand": round(mean_pred, 2),
            "predicted_std_demand": dealer_sigma,
            "forecast_period_days": forecast_days,
            "daily_predictions": [round(p, 2) for p in dealer_preds]
        }

    chart_series = []
    sample_dealers = [1, 2, 3, 5, 6, 8]
    recent_dates = unique_dates[-28:]
    
    for dt in recent_dates:
        dt_str = pd.to_datetime(dt).strftime("%Y-%m-%d")
        day_actuals = featured_df[featured_df['date'] == dt]
        for _, row in day_actuals.iterrows():
            if int(row['dealer_id']) in sample_dealers:
                is_test_day = dt >= split_date
                pred_val = float(model.predict(pd.DataFrame([row[feature_cols]]))[0]) if is_test_day else None
                chart_series.append({
                    "date": dt_str,
                    "dealer_id": int(row['dealer_id']),
                    "dealer_name": dealer_names.get(int(row['dealer_id']), f"Dealer {row['dealer_id']}"),
                    "actual": round(float(row['demand']), 2),
                    "predicted": round(pred_val, 2) if pred_val is not None else None,
                    "is_forecast": False
                })

    for item in daily_forecasts:
        if item['dealer_id'] in sample_dealers:
            chart_series.append({
                "date": item['date'],
                "dealer_id": item['dealer_id'],
                "dealer_name": item['dealer_name'],
                "actual": None,
                "predicted": item['predicted_demand'],
                "is_forecast": True
            })

    return {
        "metrics": {
            "rmse": round(rmse, 2),
            "mae": round(mae, 2),
            "r2_score": round(r2, 4),
            "mape": round(mape, 2),
            "model_type": model_type_name,
            "training_samples": len(X_train),
            "test_samples": len(X_test)
        },
        "feature_importances": feature_importance_list[:10],
        "dealer_summaries": list(dealer_summaries.values()),
        "daily_forecasts": daily_forecasts,
        "chart_series": chart_series
    }
