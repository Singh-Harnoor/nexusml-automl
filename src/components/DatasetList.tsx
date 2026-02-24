import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  FileText, 
  Database as DbIcon, 
  Search, 
  Info, 
  Wand2, 
  Upload, 
  Globe, 
  Download,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Dataset } from '../types';
import { getDatasetInsights } from '../services/geminiService';
import Markdown from 'react-markdown';
import Papa from 'papaparse';

export default function DatasetList() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [insights, setInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [showPreprocessModal, setShowPreprocessModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTab, setImportTab] = useState<'local' | 'kaggle'>('local');
  const [preprocessingDataset, setPreprocessingDataset] = useState<Dataset | null>(null);
  const [preprocessSteps, setPreprocessSteps] = useState<string[]>([]);
  const [kaggleSlug, setKaggleSlug] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    const res = await fetch('/api/datasets');
    const data = await res.json();
    setDatasets(data);
  };

  const handleLocalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const id = Math.random().toString(36).substring(7);
        // Store up to 500 rows for visualization
        const sampleData = results.data.slice(0, 500);
        
        const newDataset = {
          id,
          name: file.name.replace('.csv', ''),
          type: 'csv',
          size: file.size,
          rows: results.data.length,
          columns: results.meta.fields || [],
          data: sampleData
        };

        await fetch('/api/datasets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newDataset)
        });
        
        setIsUploading(false);
        setShowImportModal(false);
        fetchDatasets();
      },
      error: (error) => {
        console.error('CSV Parse Error:', error);
        setIsUploading(false);
        alert('Failed to parse CSV file');
      }
    });
  };

  const handleKaggleImport = async () => {
    if (!kaggleSlug) return;
    setIsUploading(true);
    try {
      const res = await fetch('/api/kaggle/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: kaggleSlug })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to import from Kaggle');
      }

      setShowImportModal(false);
      setKaggleSlug('');
      fetchDatasets();
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to import from Kaggle. Make sure your KAGGLE_USERNAME and KAGGLE_KEY are set in environment variables.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/datasets/${id}`, { method: 'DELETE' });
    fetchDatasets();
  };

  const handleGetInsights = async (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setLoadingInsights(true);
    setInsights(null);
    try {
      const columns = typeof dataset.columns === 'string' ? JSON.parse(dataset.columns) : dataset.columns;
      const res = await getDatasetInsights(dataset.name, columns);
      setInsights(res || "No insights available.");
    } catch (error) {
      console.error(error);
      setInsights("Error fetching insights.");
    } finally {
      setLoadingInsights(false);
    }
  };

  const handlePreprocess = async () => {
    if (!preprocessingDataset) return;
    await fetch(`/api/datasets/${preprocessingDataset.id}/preprocess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ steps: preprocessSteps })
    });
    setShowPreprocessModal(false);
    setPreprocessSteps([]);
    alert("Preprocessing pipeline initiated!");
  };

  const toggleStep = (step: string) => {
    setPreprocessSteps(prev => 
      prev.includes(step) ? prev.filter(s => s !== step) : [...prev, step]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Datasets</h2>
          <p className="text-slate-500 text-sm">Manage your training and validation data</p>
        </div>
        <button 
          onClick={() => setShowImportModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Plus size={18} />
          Import Dataset
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {datasets.map((dataset) => (
            <motion.div 
              layout
              key={dataset.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <DbIcon size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{dataset.name}</h3>
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <FileText size={12} /> {(dataset.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Search size={12} /> {dataset.rows} rows
                      </span>
                      {dataset.type === 'kaggle' && (
                        <span className="text-xs text-indigo-500 font-bold flex items-center gap-1">
                          <Globe size={12} /> Kaggle
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setPreprocessingDataset(dataset); setShowPreprocessModal(true); }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Preprocess Data"
                  >
                    <Wand2 size={18} />
                  </button>
                  <button 
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Download Dataset"
                  >
                    <Download size={18} />
                  </button>
                  <button 
                    onClick={() => handleGetInsights(dataset)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="AI Insights"
                  >
                    <Info size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(dataset.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {datasets.length === 0 && (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <DbIcon size={32} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No datasets found</h3>
              <p className="text-slate-500 max-w-xs mx-auto mt-2">Upload your first dataset to start building AutoML experiments.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-900 rounded-3xl p-6 text-white overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-2">AI Dataset Analyzer</h3>
              <p className="text-indigo-200 text-xs leading-relaxed mb-4">
                Select a dataset to get automated insights on data quality, target variables, and recommended preprocessing.
              </p>
              
              {loadingInsights ? (
                <div className="flex items-center gap-3 py-4">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-sm text-indigo-100">Analyzing schema...</span>
                </div>
              ) : insights ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-sm max-h-[400px] overflow-y-auto scrollbar-hide"
                >
                  <div className="markdown-body text-indigo-50">
                    <Markdown>{insights}</Markdown>
                  </div>
                </motion.div>
              ) : (
                <div className="py-8 text-center border border-white/10 rounded-2xl bg-white/5">
                  <p className="text-xs text-indigo-300">No dataset selected</p>
                </div>
              )}
            </div>
            {/* Abstract background element */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />
          </div>
        </div>
      </div>

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Import Dataset</h3>
                <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                <button 
                  onClick={() => setImportTab('local')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${importTab === 'local' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  <Upload size={16} /> Local File
                </button>
                <button 
                  onClick={() => setImportTab('kaggle')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${importTab === 'kaggle' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  <Globe size={16} /> Kaggle
                </button>
              </div>

              {importTab === 'local' ? (
                <div className="space-y-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer group"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleLocalUpload} 
                      accept=".csv" 
                      className="hidden" 
                    />
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                      <Upload size={24} />
                    </div>
                    <p className="text-sm font-bold text-slate-900">Click to upload CSV</p>
                    <p className="text-xs text-slate-500 mt-1">Max file size: 50MB</p>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
                    <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-500 leading-relaxed">
                      We'll automatically detect columns, data types, and potential target variables from your CSV.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kaggle Dataset Slug</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={kaggleSlug}
                        onChange={(e) => setKaggleSlug(e.target.value)}
                        placeholder="e.g. jacksaleeby/global-stock-market-indices"
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Globe size={18} />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                    <p className="text-[11px] text-indigo-700 leading-relaxed">
                      Enter the dataset slug from Kaggle. Our backend will use <code className="bg-white px-1 rounded">kagglehub</code> to fetch the latest version and sync it with your workspace.
                    </p>
                  </div>
                  <button 
                    onClick={handleKaggleImport}
                    disabled={!kaggleSlug || isUploading}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUploading ? <Download size={18} className="animate-spin" /> : <Download size={18} />}
                    {isUploading ? 'Importing...' : 'Import from Kaggle'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preprocessing Modal */}
      <AnimatePresence>
        {showPreprocessModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-2">Preprocess Data</h3>
              <p className="text-slate-500 text-sm mb-6">Select automated cleaning and transformation steps for <span className="font-semibold">{preprocessingDataset?.name}</span>.</p>
              
              <div className="space-y-3">
                {[
                  { id: 'scaling', label: 'Feature Scaling (StandardScaler)', desc: 'Normalize numerical features to zero mean and unit variance.' },
                  { id: 'encoding', label: 'One-Hot Encoding', desc: 'Convert categorical variables into binary vectors.' },
                  { id: 'imputation', label: 'Missing Value Imputation', desc: 'Fill null values using mean/median strategy.' },
                  { id: 'outliers', label: 'Outlier Detection', desc: 'Identify and clip extreme values using IQR method.' },
                  { id: 'balancing', label: 'Class Balancing (SMOTE)', desc: 'Oversample minority classes for imbalanced datasets.' }
                ].map(step => (
                  <button
                    key={step.id}
                    onClick={() => toggleStep(step.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      preprocessSteps.includes(step.id) 
                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-sm font-bold text-slate-900">{step.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{step.desc}</p>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setShowPreprocessModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePreprocess}
                  disabled={preprocessSteps.length === 0}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  Run Pipeline
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

