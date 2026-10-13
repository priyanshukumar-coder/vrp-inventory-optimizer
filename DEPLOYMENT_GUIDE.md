# 🚀 Complete Free Deployment Guide: Vercel + Render / Hugging Face

This project consists of two modern layers:
1. **Frontend**: Next.js 14 Web Application (Hosted on **Vercel** — Free & Instant).
2. **Backend**: FastAPI Python API with XGBoost, NumPy & Scikit-learn (Hosted on **Render.com** or **Hugging Face Spaces** — Free Web Service).

---

## 🏆 Recommended Free Architecture: Vercel (Frontend) + Render (Backend)

Because the Python backend uses machine learning libraries (`xgboost`, `scikit-learn`, `pandas`) that exceed Vercel's 250MB serverless limit, the best and most reliable architecture is:
- **Frontend** on **Vercel** (Global Edge CDN, automatic HTTPS, custom domains).
- **Backend** on **Render.com** (Free tier web service running FastAPI).

---

## Step 1: Push Your Code to GitHub

If your project is not already on GitHub:
```bash
git init
git add .
git commit -m "Complete VRP Inventory Optimizer with What-If Simulator"
git branch -M main
git remote add origin https://github.com/<your-username>/vrp-inventory-optimizer.git
git push -u origin main
```

---

## Step 2: Deploy the Backend on Render.com (Free)

1. Sign up / Log in to [Render.com](https://render.com) (free account).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository (`vrp-inventory-optimizer`).
4. Configure the settings:
   - **Name**: `vrp-inventory-backend` (or any name)
   - **Region**: Choose the closest region (e.g., Singapore / Frankfurt / Oregon)
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Select **Free**
5. Click **Create Web Service**.
6. Render will build and deploy your API in ~2-3 minutes.
7. Once finished, copy your Render API URL (e.g., `https://vrp-inventory-backend.onrender.com`).
   - You can test it by visiting: `https://vrp-inventory-backend.onrender.com/api/health` → `{"status":"healthy"}`.

---

## Step 3: Deploy the Frontend on Vercel (Free)

1. Sign up / Log in to [Vercel.com](https://vercel.com).
2. Click **Add New…** → **Project**.
3. Import your GitHub repository (`vrp-inventory-optimizer`).
4. In the Project Configuration screen:
   - **Framework Preset**: Next.js
   - **Root Directory**: Click *Edit* and select **`frontend`** *(Critical step!)*
   - **Environment Variables**: Add one variable:
     - **Key**: `NEXT_PUBLIC_API_URL`
     - **Value**: Your Render backend URL from Step 2 (e.g., `https://vrp-inventory-backend.onrender.com` — *no trailing slash*).
5. Click **Deploy**.
6. Vercel will build and launch your live website in ~60 seconds!
   - You will receive a live URL: `https://your-project.vercel.app`.

---

## 🌟 Alternative Free Backend Host: Hugging Face Spaces (16GB RAM Free!)

If you want a dedicated machine learning container with **16GB RAM and 2 vCPUs completely free**:
1. Go to [Hugging Face Spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. Space SDK: Select **Docker** (Blank).
3. Push or upload your `backend/` directory and `backend/Dockerfile`.
4. Hugging Face will run the container and provide a permanent public HTTPS URL (e.g. `https://username-space.hf.space`) with zero cold-start timeouts.
5. In Vercel, simply set `NEXT_PUBLIC_API_URL=https://username-space.hf.space`.

---

## Summary Checklist

| Component | Host | Free Tier Specs | Config Required |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** | Unlimited bandwidth, Global Edge CDN | Set Root Directory to `frontend`, add `NEXT_PUBLIC_API_URL` |
| **Backend** | **Render.com** | Free Web Service (512MB RAM) | Root Directory: `backend`, Build: `pip install -r requirements.txt` |
| **Backend (Alt)** | **Hugging Face** | Free 16GB RAM + 2 vCPU Docker Space | Upload `backend/Dockerfile` |
