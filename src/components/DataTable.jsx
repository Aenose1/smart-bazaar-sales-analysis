import React, { useState, useMemo } from 'react';
import { formatCurrency, formatDate, formatNumber } from '../utils/formatters.js';
import { Search, Download, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

export const DataTable = ({ data, onDownload }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortField, setSortField] = useState('revenue');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const categories = useMemo(() => {
    if (!data) return [];
    const set = new Set(data.map(d => d.category).filter(Boolean));
    return Array.from(set);
  }, [data]);

  const filteredAndSortedData = useMemo(() => {
    if (!data) return [];

    let result = [...data];

    // Category Filter
    if (categoryFilter !== 'ALL') {
      result = result.filter(r => r.category === categoryFilter);
    }

    // Search Filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(
        r =>
          (r.productName && r.productName.toLowerCase().includes(query)) ||
          (r.orderId && r.orderId.toLowerCase().includes(query)) ||
          (r.region && r.region.toLowerCase().includes(query))
      );
    }

    // Sort
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (valA instanceof Date) valA = valA.getTime();
      if (valB instanceof Date) valB = valB.getTime();

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [data, searchTerm, categoryFilter, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedData.slice(start, start + pageSize);
  }, [filteredAndSortedData, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="table-container">
      <div className="table-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search product, order ID, region..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{
                width: '100%',
                padding: '0.5rem 0.5rem 0.5rem 2.2rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                fontSize: '0.88rem'
              }}
            />
          </div>

          {categories.length > 0 && (
            <select
              className="select-input"
              style={{ width: 'auto', padding: '0.5rem 0.75rem' }}
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {onDownload && (
            <button className="btn btn-secondary" onClick={() => onDownload(filteredAndSortedData)}>
              <Download size={15} />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('orderId')} style={{ cursor: 'pointer' }}>
                Order ID <ArrowUpDown size={12} />
              </th>
              <th onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>
                Date <ArrowUpDown size={12} />
              </th>
              <th onClick={() => handleSort('productName')} style={{ cursor: 'pointer' }}>
                Product Name <ArrowUpDown size={12} />
              </th>
              <th onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>
                Category <ArrowUpDown size={12} />
              </th>
              <th onClick={() => handleSort('price')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                Unit Price (₹) <ArrowUpDown size={12} />
              </th>
              <th onClick={() => handleSort('quantity')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                Quantity <ArrowUpDown size={12} />
              </th>
              <th onClick={() => handleSort('revenue')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                Total Revenue (₹) <ArrowUpDown size={12} />
              </th>
              <th onClick={() => handleSort('region')} style={{ cursor: 'pointer' }}>
                Region <ArrowUpDown size={12} />
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr key={row.id || idx}>
                  <td><strong>{row.orderId}</strong></td>
                  <td>{formatDate(row.date)}</td>
                  <td>{row.productName}</td>
                  <td>
                    <span className="badge badge-info">{row.category}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(row.price)}</td>
                  <td style={{ textAlign: 'right' }}><strong>{formatNumber(row.quantity)}</strong></td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-blue)' }}>
                    {formatCurrency(row.revenue)}
                  </td>
                  <td>{row.region}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No records match the active search and category filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-bar">
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Showing {filteredAndSortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(currentPage * pageSize, filteredAndSortedData.length)} of {filteredAndSortedData.length} records
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select
            className="select-input"
            style={{ width: 'auto', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>

          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.6rem' }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ padding: '0.35rem 0.75rem', fontSize: '0.88rem', fontWeight: 500 }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.6rem' }}
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
