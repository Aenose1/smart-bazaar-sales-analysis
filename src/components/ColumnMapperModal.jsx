import React, { useState } from 'react';
import { STANDARD_FIELDS } from '../utils/csvParser.js';
import { Settings, Check, X } from 'lucide-react';

export const ColumnMapperModal = ({ headers, currentMapping, onSave, onClose }) => {
  const [mapping, setMapping] = useState({ ...currentMapping });

  const handleSelectChange = (field, selectedHeader) => {
    setMapping(prev => ({
      ...prev,
      [field]: selectedHeader === '-- NONE --' ? null : selectedHeader
    }));
  };

  const fieldLabels = {
    [STANDARD_FIELDS.PRODUCT]: 'Product Name *',
    [STANDARD_FIELDS.PRICE]: 'Unit Price (₹) *',
    [STANDARD_FIELDS.QUANTITY]: 'Quantity Sold *',
    [STANDARD_FIELDS.REVENUE]: 'Sales Revenue (₹) (Optional)',
    [STANDARD_FIELDS.DATE]: 'Order Date (Optional for Forecasting)',
    [STANDARD_FIELDS.CATEGORY]: 'Category (Optional)',
    [STANDARD_FIELDS.ORDER_ID]: 'Order ID (Optional)',
    [STANDARD_FIELDS.REGION]: 'Region / Zone (Optional)'
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
            <Settings size={20} color="var(--accent-blue)" />
            Confirm CSV Column Mapping
          </h3>
          <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Match your uploaded CSV header columns with the Smart Bazaar analysis fields below.
        </p>

        <div style={{ maxHeight: '360px', overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1.5rem' }}>
          {Object.entries(fieldLabels).map(([fieldKey, label]) => (
            <div key={fieldKey} className="mapping-row">
              <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>{label}</label>
              <select
                className="select-input"
                value={mapping[fieldKey] || '-- NONE --'}
                onChange={(e) => handleSelectChange(fieldKey, e.target.value)}
              >
                <option value="-- NONE --">-- Not Mapped --</option>
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={() => onSave(mapping)}>
            <Check size={16} />
            Apply Mapping & Process Dataset
          </button>
        </div>
      </div>
    </div>
  );
};
