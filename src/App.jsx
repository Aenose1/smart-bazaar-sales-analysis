import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar.jsx';
import { Header } from './components/Header.jsx';
import { ColumnMapperModal } from './components/ColumnMapperModal.jsx';

import { OverviewPage } from './pages/Overview.jsx';
import { UploadDatasetPage } from './pages/UploadDataset.jsx';
import { SalesDashboardPage } from './pages/SalesDashboard.jsx';
import { ProductAnalysisPage } from './pages/ProductAnalysis.jsx';
import { SalesForecastPage } from './pages/SalesForecast.jsx';
import { DataExplorerPage } from './pages/DataExplorer.jsx';
import { InsightsPage } from './pages/Insights.jsx';
import { AboutPage } from './pages/About.jsx';

import { parseCSVData } from './utils/csvParser.js';
import { cleanDataset } from './utils/dataCleaning.js';
import { computeSalesMetrics } from './utils/salesCalculations.js';
import { SAMPLE_CSV_STRING } from './utils/sampleData.js';

import './styles/global.css';
import './styles/dashboard.css';

export function App() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const [rawData, setRawData] = useState(null);
  const [parseResult, setParseResult] = useState(null);
  const [columnMapping, setColumnMapping] = useState(null);
  const [cleaningResult, setCleaningResult] = useState(null);
  
  const [isSample, setIsSample] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isMapperModalOpen, setIsMapperModalOpen] = useState(false);

  // Compute aggregated sales metrics whenever cleaned rows change
  const metrics = useMemo(() => {
    if (!cleaningResult || !cleaningResult.cleanedRows) return null;
    return computeSalesMetrics(cleaningResult.cleanedRows);
  }, [cleaningResult]);

  // Load and process CSV content helper
  const processCSVContent = async (fileOrString, isSampleData = false, shouldNavigate = false) => {
    setIsLoading(true);
    setError(null);

    try {
      let contentToParse = fileOrString;

      // If loading sample dataset and no string passed, attempt to fetch /sample-sales.csv
      if (isSampleData && typeof fileOrString !== 'string' && !(fileOrString instanceof File)) {
        try {
          const res = await fetch('/sample-sales.csv');
          if (res.ok) {
            contentToParse = await res.text();
          } else {
            console.warn('Could not fetch /sample-sales.csv, falling back to embedded sample data');
            contentToParse = SAMPLE_CSV_STRING;
          }
        } catch (fetchErr) {
          console.warn('Fetch failed, using embedded sample data:', fetchErr);
          contentToParse = SAMPLE_CSV_STRING;
        }
      }

      const parsed = await parseCSVData(contentToParse);
      setParseResult(parsed);
      setRawData(parsed.rawData);
      setColumnMapping(parsed.detectedMapping);

      const cleaned = cleanDataset(parsed.rawData, parsed.detectedMapping);
      setCleaningResult(cleaned);
      setIsSample(isSampleData);

      const count = cleaned.summary?.validRowsCount || cleaned.cleanedRows.length;
      const msg = isSampleData
        ? `Sample dataset loaded successfully: ${count} records.`
        : `Dataset uploaded successfully: ${count} records.`;
      
      setSuccessMessage(msg);

      if (shouldNavigate) {
        setActiveTab('overview');
      }
    } catch (err) {
      console.error('CSV Processing Error:', err);
      setError(err.message || 'An error occurred while parsing the CSV file.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-load sample Indian retail sales dataset on first mount
  useEffect(() => {
    processCSVContent(null, true, false);
  }, []);

  const handleFileUpload = (file) => {
    processCSVContent(file, false, true);
  };

  const handleLoadSample = () => {
    processCSVContent(null, true, true);
  };

  const handleSaveMapping = (newMapping) => {
    setColumnMapping(newMapping);
    if (rawData) {
      const cleaned = cleanDataset(rawData, newMapping);
      setCleaningResult(cleaned);
      setSuccessMessage(`Column mapping updated: ${cleaned.cleanedRows.length} valid records processed.`);
    }
    setIsMapperModalOpen(false);
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="main-content">
        {/* Top Header */}
        <Header
          isSample={isSample}
          datasetSummary={cleaningResult?.summary}
          onLoadSample={handleLoadSample}
          onNavigateUpload={() => setActiveTab('upload')}
          isLoading={isLoading}
        />

        {/* Page Content Body */}
        <main className="page-body">
          {activeTab === 'overview' && (
            <OverviewPage
              metrics={metrics}
              cleaningSummary={cleaningResult?.summary}
              isSample={isSample}
              onNavigate={(tab) => setActiveTab(tab)}
              successMessage={successMessage}
            />
          )}

          {activeTab === 'upload' && (
            <UploadDatasetPage
              onFileUpload={handleFileUpload}
              onLoadSample={handleLoadSample}
              isLoading={isLoading}
              error={error}
              parseResult={parseResult}
              cleaningResult={cleaningResult}
              columnMapping={columnMapping}
              onOpenMapperModal={() => setIsMapperModalOpen(true)}
              successMessage={successMessage}
            />
          )}

          {activeTab === 'dashboard' && (
            <SalesDashboardPage
              metrics={metrics}
              cleanedRows={cleaningResult?.cleanedRows}
            />
          )}

          {activeTab === 'product' && (
            <ProductAnalysisPage
              metrics={metrics}
              cleanedRows={cleaningResult?.cleanedRows}
            />
          )}

          {activeTab === 'forecast' && (
            <SalesForecastPage
              cleanedRows={cleaningResult?.cleanedRows}
              metrics={metrics}
            />
          )}

          {activeTab === 'explorer' && (
            <DataExplorerPage
              rawData={rawData}
              cleanedRows={cleaningResult?.cleanedRows}
              metrics={metrics}
            />
          )}

          {activeTab === 'insights' && (
            <InsightsPage metrics={metrics} />
          )}

          {activeTab === 'about' && (
            <AboutPage />
          )}
        </main>
      </div>

      {/* Manual Column Mapping Modal */}
      {isMapperModalOpen && parseResult && (
        <ColumnMapperModal
          headers={parseResult.headers}
          currentMapping={columnMapping}
          onSave={handleSaveMapping}
          onClose={() => setIsMapperModalOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
