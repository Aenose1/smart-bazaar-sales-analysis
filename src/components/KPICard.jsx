import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export const KPICard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  growth = null,
  colorScheme = 'blue'
}) => {
  const colorMap = {
    blue: { bg: '#eff6ff', color: '#2563eb' },
    purple: { bg: '#f5f3ff', color: '#7c3aed' },
    teal: { bg: '#f0fdf4', color: '#0d9488' },
    green: { bg: '#f0fdf4', color: '#16a34a' },
    orange: { bg: '#fff7ed', color: '#ea580c' },
    pink: { bg: '#fdf2f8', color: '#db2777' }
  };

  const scheme = colorMap[colorScheme] || colorMap.blue;

  return (
    <div className="kpi-card">
      <div>
        <div className="kpi-header">
          <span className="kpi-title">{title}</span>
          <div className="kpi-icon-box" style={{ backgroundColor: scheme.bg, color: scheme.color }}>
            {Icon && <Icon size={20} />}
          </div>
        </div>

        <div className="kpi-value">{value}</div>
      </div>

      <div className="kpi-footer">
        {growth !== null && growth !== undefined ? (
          <span
            className={`badge ${
              growth > 0 ? 'badge-success' : growth < 0 ? 'badge-warning' : 'badge-info'
            }`}
          >
            {growth > 0 ? <ArrowUpRight size={12} /> : growth < 0 ? <ArrowDownRight size={12} /> : <Minus size={12} />}
            {Math.abs(growth).toFixed(1)}% YoY
          </span>
        ) : null}
        <span>{subtitle}</span>
      </div>
    </div>
  );
};
