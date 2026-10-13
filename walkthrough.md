# Walkthrough: XGBoost Demand Forecasting & Mathematical Model Dashboard Integration

We have integrated an end-to-end **XGBoost machine learning demand forecasting model** into the automotive spare-parts distribution network and updated the dashboard to align with the mathematical formulations ($SS_{if} = z \cdot \sigma_i \cdot \sqrt{f}$, $I_{if} = d_i \cdot f + SS_{if}$, $\min Z = \sum c_{ij} x_{ijvt} + \sum h_i I_{if} y_{if}$) from the project poster.

---

## 1. What Was Implemented

### Machine Learning Demand Forecasting with XGBoost
- **Dataset**: Created [backend/data/historical_demand.csv](file:///d:/vrp-inventory-optimizer/backend/data/historical_demand.csv) with 5,475 daily transaction records across 15 automotive dealers (covering 365 days) featuring weekly seasonality, monthly spikes, promotions, and lead times.
- **Service**: Implemented [backend/app/services/forecasting.py](file:///d:/vrp-inventory-optimizer/backend/app/services/forecasting.py) adhering to `ml-best-practices`:
  - Temporal feature engineering: Calendar indicators (`day_of_week`, `day_of_month`, `month`, `is_weekend`), multi-horizon lag features (`lag_1`, `lag_2`, `lag_7`, `lag_14`, `lag_21`, `lag_28`), and rolling window statistics (`rolling_mean_7`, `rolling_std_7`, `rolling_mean_14`, `rolling_mean_30`).
  - Chronological 85/15 train-test split to prevent temporal data leakage.
  - Model training using `xgboost.XGBRegressor` with tree depth and regularization tuning.
  - Evaluation metrics computation: **RMSE (19.87)**, **MAE (14.60)**, **$R^2$ Score (0.7733)**, and **MAPE (19.96%)**.
  - Feature importance extraction (highlighting 7-day and 14-day seasonal lags).
  - 7-day multi-step forward forecasting to derive daily mean demand $d_i$ and uncertainty $\sigma_i$.
- **API Endpoints**: Created [backend/app/routers/forecast.py](file:///d:/vrp-inventory-optimizer/backend/app/routers/forecast.py):
  - `POST /api/forecast`: Trigger XGBoost model training and forecasting.
  - `GET /api/forecast/sample`: Instant retrieval of precomputed model metrics and forecasts.
  - `POST /api/forecast/upload`: Upload custom historical order CSVs to train and forecast on custom datasets.

### Mathematical Formulation & Poster Alignment
- **Formulation Alignment**: In [backend/app/services/preprocessing.py](file:///d:/vrp-inventory-optimizer/backend/app/services/preprocessing.py):
  $$SS_{if} = z \cdot \sigma_i \cdot \sqrt{f}$$
  $$I_{if} = d_i \cdot f + SS_{if} = d_i \cdot f + z \cdot \sigma_i \cdot \sqrt{f}$$
  with delivery frequency intervals $F = \{1, 3, 5, 7\}$ days and service level factor $z = 1.65$ (95% service level) as defined in Section 3 & 5 of the poster.
- **Inventory Matrix**: Updated [backend/app/services/result_parser.py](file:///d:/vrp-inventory-optimizer/backend/app/services/result_parser.py) to calculate the full candidate frequency matrix ($SS_{if}$, $I_{if}$, holding costs) for all $f \in F$, annotating the chosen optimal frequency $y_{if}^* = 1$.

### Interactive Dashboard Enhancements
- **Mathematical Model Tab**: Created [frontend/src/components/ModelFormulation.tsx](file:///d:/vrp-inventory-optimizer/frontend/src/components/ModelFormulation.tsx) displaying the exact equations, parameters, decision variables, and 8 MILP constraints from the poster.
- **XGBoost Demand Forecast Tab**: Created [frontend/src/components/DemandForecast.tsx](file:///d:/vrp-inventory-optimizer/frontend/src/components/DemandForecast.tsx):
  - 4 Model performance cards (RMSE, MAE, $R^2$, MAPE).
  - Actual vs. Predicted time-series line chart with 7-day future forecast projection and dealer filter.
  - XGBoost feature importance chart.
  - Dealer-wise forecast table ($d_i, \sigma_i$) and "Apply Forecast to Optimization" button.
- **Safety Stock & Inventory Tab**: Enhanced [frontend/src/components/InventoryResults.tsx](file:///d:/vrp-inventory-optimizer/frontend/src/components/InventoryResults.tsx) with:
  - Visual formula callouts.
  - Toggle between **Optimal Policy Summary** and **All Frequencies Matrix ($f \in \{1, 3, 5, 7\}$)**.
- **Unified Workflow**: Updated [frontend/src/components/FileUpload.tsx](file:///d:/vrp-inventory-optimizer/frontend/src/components/FileUpload.tsx), [frontend/src/components/Dashboard.tsx](file:///d:/vrp-inventory-optimizer/frontend/src/components/Dashboard.tsx), and [frontend/src/app/page.tsx](file:///d:/vrp-inventory-optimizer/frontend/src/app/page.tsx) with a one-click **"⚡ Optimize with XGBoost Demand Forecast"** action.

---

## 2. Verification & Validation Results

| Test Category | Command / Step | Result |
| :--- | :--- | :--- |
| **Python ML Packages** | `pip install xgboost scikit-learn` | Installed successfully in `backend\venv` |
| **Data Generation** | `generate_historical_data.py` | Generated 5,475 rows of realistic historical daily demand |
| **XGBoost Model Training** | `train_xgboost_forecast()` | Train size: 4,290, Test size: 765, RMSE: 19.87, MAE: 14.60, $R^2$: 0.7733 |
| **Backend API Health** | `GET /api/health` | HTTP 200 `{"status":"healthy"}` |
| **Forecast Endpoint** | `GET /api/forecast/sample` | HTTP 200 with full time series, metrics, and dealer summaries |
| **Optimization Pipeline** | `POST /api/optimize` | HTTP 200 with $SS_{if}$, $I_{if}$, routes, and holding cost calculations |
| **Frontend Production Build** | `npm.cmd run build` | `✓ Compiled successfully` with zero errors |
| **Dev Servers** | Ports 8000 & 3000 | Both servers actively listening |

---

## 3. How to Use the New Features in the UI

1. Open **`http://localhost:3000`** in your browser.
2. Click **"⚡ Optimize with XGBoost Demand Forecast"** (or click "Load Sample Data" and then select the forecast button).
3. The dashboard will load with 6 dedicated tabs:
   - 📈 **Demand Forecast (XGBoost)**: Explore model accuracy metrics, examine actual vs. predicted curves, inspect feature importances, and view predicted daily demand $d_i$ and uncertainty $\sigma_i$.
   - 📐 **Mathematical Model**: View the complete reference formulation, sets, parameters, and constraints corresponding to your project poster.
   - 🗺️ **Route Schedules & Map**: Review vehicle routes, delivery sequences, and interactive Leaflet map of the Chennai dealer network.
   - 📅 **Delivery Frequencies**: Check the optimal delivery frequency $y_{if}^*$ assigned to each dealer.
   - 📦 **Safety Stock & Inventory**: Inspect the stacked inventory bar chart or toggle to the **All Frequencies Matrix** to see the exact values of $SS_{if} = z \cdot \sigma_i \cdot \sqrt{f}$ and $I_{if} = d_i \cdot f + SS_{if}$ for each interval $f \in \{1, 3, 5, 7\}$.
   - 💰 **Executive Cost Summary**: Review the total distribution cost in ₹ (transportation cost + inventory holding cost) and solver runtime statistics.
