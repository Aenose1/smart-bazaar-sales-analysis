import React from 'react';

export const ChartCard = ({ title, subtitle, children, actionElement }) => {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title-box">
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actionElement && <div>{actionElement}</div>}
      </div>
      <div className="chart-container">
        {children}
      </div>
    </div>
  );
};
