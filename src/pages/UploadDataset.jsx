import React from 'react';
import { CSVUploader } from '../components/CSVUploader.jsx';
import { FileSpreadsheet, Settings, CheckCircle2 } from 'lucide-react';

export const UploadDatasetPage = ({
  onFileUpload,
  onLoadSample,
  isLoading,
  error,
  parseResult,
  cleaningResult,
  columnMapping,
  onOpenMapperModal,
  successMessage
}) => {
  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1>Upload & Preprocess Retail Dataset</h1>
        <p>Upload your retail sales CSV file or load our sample Indian retail dataset for instant analysis.</p>
      </div>

      {successMessage && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 'var(--radius-md)',
            color: '#166534',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem',
            maxWidth: '800px',
            margin: '0 auto 1.5rem auto'
          }}
        >
          <CheckCircle2 size={20} color="#16a34a" />
          <div style={{ fontWeight: 600 }}>{successMessage}</div>
        </div>
      )}

      {/* Main Upload Dropzone */}
      <CSVUploader
        onFileUpload={onFileUpload}
        onLoadSample={onLoadSample}
        isLoading={isLoading}
        error={error}
      />

      {/* Dataset Inspection & Column Mapping Status */}
      {parseResult && (
        <div style={{ marginTop: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Dataset Column Mapping & Processing Preview</h2>
            <button className="btn btn-secondary" onClick={onOpenMapperModal} disabled={isLoading}>
              <Settings size={16} />
              Adjust Column Mapping
            </button>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 600 }}>Detected Column Mappings:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
              {Object.entries(columnMapping).map(([fieldKey, mappedCol]) => (
                <div
                  key={fieldKey}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: mappedCol ? '#f0fdf4' : '#fff7ed',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {fieldKey}
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: mappedCol ? 'var(--accent-green)' : 'var(--accent-orange)' }}>
                    {mappedCol ? mappedCol : 'Not Mapped'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* First 10 Rows Preview Table */}
          <div className="table-container" style={{ marginBottom: '2rem' }}>
            <div className="table-header-bar">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                <FileSpreadsheet size={18} color="var(--accent-blue)" />
                First 10 Rows Data Preview ({parseResult.totalRows} Total Records)
              </h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {parseResult.headers.map((h, i) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parseResult.previewRows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {parseResult.headers.map((h, cIdx) => (
                        <td key={cIdx}>{row[h] !== undefined ? String(row[h]) : ''}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
