import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export const CSVUploader = ({ onFileUpload, onLoadSample, isLoading, error }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isLoading) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        onFileUpload(file);
      } else {
        alert('Please upload a valid .csv file.');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div
        className="upload-dropzone"
        style={{
          backgroundColor: isDragOver ? '#dbeafe' : 'var(--accent-blue-light)',
          borderColor: isDragOver ? '#1d4ed8' : 'var(--accent-blue)',
          opacity: isLoading ? 0.7 : 1,
          cursor: isLoading ? 'not-allowed' : 'pointer'
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv"
          style={{ display: 'none' }}
          disabled={isLoading}
          onChange={handleFileChange}
        />

        <div className="upload-icon-circle">
          {isLoading ? (
            <RefreshCw className="animate-spin" size={32} />
          ) : (
            <UploadCloud size={32} />
          )}
        </div>

        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
          {isLoading ? 'Processing CSV Dataset...' : 'Drag and Drop your Sales CSV here'}
        </h3>
        <p style={{ marginBottom: '1.25rem' }}>
          Supports product names, selling prices (INR), units sold, transaction dates, categories, and order IDs.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={isLoading}
            onClick={(e) => {
              e.stopPropagation();
              if (!isLoading) fileInputRef.current?.click();
            }}
          >
            <FileSpreadsheet size={16} />
            Browse File from Computer
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            disabled={isLoading}
            onClick={(e) => {
              e.stopPropagation();
              if (!isLoading) onLoadSample();
            }}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Loading Sample...' : 'Load Sample Indian Retail CSV'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md)',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}
        >
          <AlertCircle size={20} />
          <div>
            <strong>CSV Processing Error:</strong> {error}
          </div>
        </div>
      )}

      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)'
        }}
      >
        <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} color="var(--accent-green)" />
          Supported CSV Column Formats
        </h4>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div><strong>Product Name:</strong> Product, Item_Name, Product_Name</div>
          <div><strong>Selling Price:</strong> Price, Unit_Price, Selling_Price (₹)</div>
          <div><strong>Quantity Sold:</strong> Quantity, Units_Sold, Qty</div>
          <div><strong>Sales / Revenue:</strong> Revenue, Sales_Amount, Total_Amount (₹)</div>
          <div><strong>Transaction Date:</strong> Order_Date, Date (DD/MM/YYYY or YYYY-MM-DD)</div>
          <div><strong>Category & Region:</strong> Category, Region, Location</div>
        </div>
      </div>
    </div>
  );
};
