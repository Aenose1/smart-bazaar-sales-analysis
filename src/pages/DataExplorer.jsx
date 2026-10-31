import React, { useState } from 'react';
import { DataTable } from '../components/DataTable.jsx';
import { 
  exportOriginalCSV, 
  exportCleanedCSV, 
  exportProductSummaryCSV, 
  exportFilteredTableCSV 
} from '../utils/csvExport.js';
import { Database, FileSpreadsheet, Download, Layers, Table } from 'lucide-react';

export const DataExplorerPage = ({ rawData, cleanedRows, metrics }) => {
  const [activeView, setActiveView] = useState('cleaned'); // 'cleaned' | 'original' | 'product_summary'

  if (!cleanedRows || cleanedRows.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2>No Data Available to Explore</h2>
        <p style={{ marginTop: '0.5rem' }}>Upload a CSV file to inspect cleaned records and export reports.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Retail Data Explorer & CSV Export Studio</h1>
          <p>Inspect, filter, sort, and export sales transaction records and product performance summaries.</p>
        </div>

        {/* Quick Download Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => exportOriginalCSV(rawData)}>
            <Download size={15} />
            Download Original CSV
          </button>
          <button className="btn btn-secondary" onClick={() => exportCleanedCSV(cleanedRows)}>
            <Download size={15} />
            Download Cleaned CSV
          </button>
          <button className="btn btn-primary" onClick={() => exportProductSummaryCSV(metrics?.productSummaries)}>
            <Download size={15} />
            Download Product Summary CSV
          </button>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.5rem'
        }}
      >
        <button
          className={`btn ${activeView === 'cleaned' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveView('cleaned')}
        >
          <Table size={16} />
          Cleaned Sales Transactions ({cleanedRows.length} Rows)
        </button>

        <button
          className={`btn ${activeView === 'product_summary' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveView('product_summary')}
        >
          <Layers size={16} />
          Product Summaries ({metrics?.productSummaries.length || 0} Products)
        </button>

        <button
          className={`btn ${activeView === 'original' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveView('original')}
        >
          <FileSpreadsheet size={16} />
          Original Raw CSV View ({rawData?.length || 0} Rows)
        </button>
      </div>

      {/* Render Table based on active tab */}
      {activeView === 'cleaned' && (
        <DataTable
          data={cleanedRows}
          onDownload={(filteredData) => exportFilteredTableCSV(filteredData)}
        />
      )}

      {activeView === 'product_summary' && metrics && (
        <div className="table-container">
          <div className="table-header-bar">
            <h3>Aggregated Product Performance Summaries</h3>
            <button className="btn btn-primary" onClick={() => exportProductSummaryCSV(metrics.productSummaries)}>
              <Download size={15} />
              Export Product Summary CSV
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Avg Unit Price (₹)</th>
                  <th style={{ textAlign: 'right' }}>Units Sold</th>
                  <th style={{ textAlign: 'right' }}>Total Revenue (₹)</th>
                  <th style={{ textAlign: 'right' }}>Total Orders</th>
                  <th style={{ textAlign: 'right' }}>Revenue Share (%)</th>
                </tr>
              </thead>
              <tbody>
                {metrics.productSummaries.map((p, idx) => (
                  <tr key={idx}>
                    <td><strong>{p.name}</strong></td>
                    <td><span className="badge badge-info">{p.category}</span></td>
                    <td style={{ textAlign: 'right' }}>{p.avgPrice.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{p.totalQuantity}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-blue)' }}>
                      ₹{p.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right' }}>{p.orderCount}</td>
                    <td style={{ textAlign: 'right' }}>{p.revenueContribution.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeView === 'original' && rawData && (
        <div className="table-container">
          <div className="table-header-bar">
            <h3>Original Uploaded CSV Unfiltered Rows</h3>
            <button className="btn btn-secondary" onClick={() => exportOriginalCSV(rawData)}>
              <Download size={15} />
              Download Unmodified Original CSV
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {Object.keys(rawData[0] || {}).map((header, i) => (
                    <th key={i}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rawData.slice(0, 100).map((row, rIdx) => (
                  <tr key={rIdx}>
                    {Object.keys(rawData[0] || {}).map((header, cIdx) => (
                      <td key={cIdx}>{row[header] !== undefined ? String(row[header]) : ''}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '0.85rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Displaying first 100 rows of original CSV file.
          </div>
        </div>
      )}
    </div>
  );
};
