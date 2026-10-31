# SMART BAZAAR SALES ANALYSIS
> **An Interactive Retail Sales Analytics and Predictive Forecasting System**  
> *Data Warehousing and Mining (DWM) College Mini Project*

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live_Demo-success?logo=vercel&style=for-the-badge)](https://smart-bazaar-sales-analysis-theta.vercel.app)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Aenose1/smart-bazaar-sales-analysis)

---

## 🌐 Live Deployments
- **Frontend (Vercel)**: [https://smart-bazaar-sales-analysis-theta.vercel.app](https://smart-bazaar-sales-analysis-theta.vercel.app)
- **Alternate Vercel URL**: [https://smart-bazaar-sales-analysis-chjp2q5o8-aenose1s-projects.vercel.app](https://smart-bazaar-sales-analysis-chjp2q5o8-aenose1s-projects.vercel.app)
- **1-Click Render Deploy**: [Deploy Backend to Render](https://render.com/deploy?repo=https://github.com/Aenose1/smart-bazaar-sales-analysis)

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

## ☁️ Deployment Details

### Frontend on Vercel
Deployed directly from repository via Vercel CLI & GitHub Integration.
- **Production URL**: [https://smart-bazaar-sales-analysis-theta.vercel.app](https://smart-bazaar-sales-analysis-theta.vercel.app)
- Automatically redeploys on every `git push` to `main`.

---

### Backend on Render
The repository includes a ready-to-run Blueprint [`render.yaml`](render.yaml) and [`backend/Procfile`](backend/Procfile).
To launch the backend on your Render account:
1. Click the **[Deploy to Render](https://render.com/deploy?repo=https://github.com/Aenose1/smart-bazaar-sales-analysis)** button or link.
2. Render automatically reads `render.yaml` and deploys the Flask application with Gunicorn.

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
