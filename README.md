# SMART BAZAAR SALES ANALYSIS
> **An Interactive Retail Sales Analytics and Predictive Forecasting System**  
> *Data Warehousing and Mining (DWM) Project*

---

## 📌 Project Overview
**Smart Bazaar Sales Analysis** is a complete, full-stack interactive business intelligence and predictive sales forecasting web application built for Indian retail enterprises. It provides automated CSV data cleaning, data warehousing metrics calculation in **Indian Rupees (₹)**, 8 colourful interactive Recharts visualizations, 5-year and 7-year predictive sales forecasting using Machine Learning (OLS Linear Regression), and downloadable analytical reports.

---

## 🛠️ Technology Stack

### Frontend:
- **Framework**: React 18 + Vite
- **Visualizations**: Recharts (Bar, Area, Pie, Donut, Scatter, Line)
- **CSV Processing Engine**: PapaParse
- **Icons**: Lucide React
- **Regional Currency**: Indian Rupees (`₹` INR, Lakhs `L`, Crores `Cr`)
- **Hosting**: Vercel

### Backend:
- **Language**: Python 3.10+
- **Framework**: Flask + Flask-CORS
- **Data Engineering**: Pandas, NumPy
- **Machine Learning**: Scikit-learn (Ordinary Least Squares Linear Regression)
- **Production Server**: Gunicorn
- **Hosting**: Render

---

## 🚀 How to Run Locally

### 1. Run the Python Backend (Port 5000)
```powershell
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Start backend API server
python app.py
```
Backend API will be running at `http://localhost:5000` (`http://localhost:5000/api/health`).

---

### 2. Run the React Frontend (Port 5173)
```powershell
# Navigate to project root
cd ..

# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## ☁️ Deployment Guide

### Deploying Frontend to Vercel
1. Go to [Vercel](https://vercel.com) and log in with GitHub.
2. Click **Add New Project** ➔ **Import Git Repository**.
3. Select `smart-bazaar-sales-analysis`.
4. Vercel automatically detects the Vite configuration using `vercel.json`:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Click **Deploy**.

---

### Deploying Backend to Render
1. Go to [Render](https://render.com) and sign in.
2. Click **New +** ➔ **Web Service**.
3. Connect your GitHub repository: `https://github.com/Aenose1/smart-bazaar-sales-analysis`.
4. Configure the service:
   - **Name**: `smart-bazaar-backend`
   - **Language / Runtime**: `Python 3`
   - **Root Directory**: leave blank (or `backend`)
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `gunicorn --chdir backend app:app`
5. Click **Create Web Service**.

---

## 📁 Project Structure
```
smart-bazaar-sales-analysis/
├── backend/
│   ├── app.py                 # Flask REST API endpoints
│   ├── sample-sales.csv       # Indian retail dataset
│   ├── requirements.txt       # Python dependencies
│   └── Procfile               # Production start configuration
├── public/
│   └── sample-sales.csv       # Public sample data asset
├── src/
│   ├── components/            # Header, Sidebar, KPICard, CSVUploader, DataTable, ChartCard
│   ├── pages/                 # Overview, Upload, Dashboard, Product, Forecast, Explorer, Insights, About
│   ├── utils/                 # csvParser, dataCleaning, salesCalculations, forecasting, csvExport, formatters
│   ├── styles/                # global.css, dashboard.css
│   ├── App.jsx                # Main Application State & Router
│   └── main.jsx               # React entry point
├── render.yaml                # Render Blueprint deployment
├── vercel.json                # Vercel SPA deployment configuration
├── package.json
└── vite.config.js
```
