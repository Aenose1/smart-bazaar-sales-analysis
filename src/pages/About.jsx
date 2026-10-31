import React from 'react';
import { Store, Code, Database, TrendingUp, CheckCircle2 } from 'lucide-react';

export const AboutPage = () => {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
            color: 'white',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <Store size={36} />
        </div>
        <h1>SMART BAZAAR SALES ANALYSIS</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          An Interactive Retail Sales Analytics and Predictive Forecasting System
        </p>
        <span className="badge badge-info" style={{ marginTop: '0.75rem', padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}>
          Data Warehousing & Mining (DWM) College Mini Project
        </span>
      </div>

      {/* Project Specifications */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '1.75rem',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          Project Specifications & Metadata
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          <div>
            <strong style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase' }}>Academic Domain</strong>
            <p style={{ fontWeight: 600 }}>Retail Data Analytics & Mining</p>
          </div>

          <div>
            <strong style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase' }}>Currency Standard</strong>
            <p style={{ fontWeight: 600 }}>Indian Rupee (₹ INR)</p>
          </div>

          <div>
            <strong style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase' }}>Frontend Framework</strong>
            <p style={{ fontWeight: 600 }}>React 18 + Vite</p>
          </div>

          <div>
            <strong style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase' }}>Visualization Engine</strong>
            <p style={{ fontWeight: 600 }}>Recharts Library</p>
          </div>
        </div>
      </div>

      {/* Project Objective */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '1.75rem',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>Core Objective</h3>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          To develop a localized web analytics platform that enables retail business managers to upload transaction CSV datasets, execute automatic data cleaning and validation, extract product-level revenue metrics, visualize performance via interactive multi-dimensional charts, project 5-year and 7-year future sales trajectories using linear regression models, and export comprehensive analytical reports in Indian Rupees (₹).
        </p>
      </div>

      {/* Key System Modules */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '1.75rem',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Core Architecture & System Modules</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {[
            { title: '1. CSV Parsing & Column Auto-Detection', desc: 'PapaParse engine supporting dynamic column aliases and manual re-mapping.' },
            { title: '2. Data Sanitization & Cleaning', desc: 'Sanitizes prices, quantities, and dates while tracking validation statistics.' },
            { title: '3. Executive KPI Computation', desc: 'Calculates total revenue (₹), units sold, unique items, avg price, and YoY growth.' },
            { title: '4. Multi-Chart Sales Dashboard', desc: '8 interactive Recharts visualizations including horizontal bars, pie charts, scatter plots, and trends.' },
            { title: '5. Product Performance Deep-Dive', desc: 'Detailed individual product lookup, revenue contribution %, and order statistics.' },
            { title: '6. 5/7-Year Sales Forecasting', desc: 'OLS Linear regression trend forecasting with confidence intervals and scenario modes.' },
            { title: '7. Data Explorer & Search Grid', desc: 'Searchable, sortable, paginated transaction view with category filters.' },
            { title: '8. Numeric CSV Report Exporter', desc: 'Generates clean CSV exports with explicit INR metadata headers.' }
          ].map((m, i) => (
            <div key={i} style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-blue)', marginBottom: '0.35rem' }}>
                {m.title}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer / Limitations */}
      <div
        style={{
          backgroundColor: '#eff6ff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #bfdbfe',
          padding: '1.5rem',
          color: '#1e40af'
        }}
      >
        <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} /> Forecasting Accuracy & Methodological Note
        </h4>
        <p style={{ fontSize: '0.88rem', lineHeight: '1.5' }}>
          Forecast accuracy directly depends on the quality, volume, and time span of historical transaction dates provided in the uploaded CSV dataset. Projections are calculated using Ordinary Least Squares linear regression extrapolation. Predictions represent statistical estimations based on historical momentum and should be evaluated alongside external market conditions.
        </p>
      </div>
    </div>
  );
};
