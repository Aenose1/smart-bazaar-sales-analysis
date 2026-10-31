import React from 'react';
import { Database, FileText, RefreshCw, UploadCloud } from 'lucide-react';

export const Header = ({ isSample, datasetSummary, onLoadSample, onNavigateUpload, isLoading }) => {
  return (
    <header className="top-header">
      <div className="header-title-area">
        <h2>SMART BAZAAR SALES ANALYSIS</h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
          An Interactive Retail Sales Analytics and Forecasting System (DWM Mini Project)
        </p>
      </div>

      <div className="header-actions">
        {datasetSummary ? (
          <div className="dataset-status-badge">
            <Database size={15} />
            <span>
              {isSample ? 'Demonstration Dataset' : 'Custom Uploaded CSV'} (
              {datasetSummary.validRowsCount} rows)
            </span>
          </div>
        ) : (
          <div className="dataset-status-badge" style={{ backgroundColor: '#fef3c7', color: '#b45309', borderColor: '#fde68a' }}>
            <FileText size={15} />
            <span>No Dataset Loaded</span>
          </div>
        )}

        <button 
          className="btn btn-secondary" 
          onClick={onLoadSample} 
          disabled={isLoading}
          title="Load Demonstration Dataset"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          <span>{isLoading ? 'Loading Sample...' : 'Load Sample Data'}</span>
        </button>

        <button className="btn btn-primary" onClick={onNavigateUpload} disabled={isLoading}>
          <UploadCloud size={15} />
          <span>Upload CSV</span>
        </button>
      </div>
    </header>
  );
};
