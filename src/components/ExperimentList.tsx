import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  BarChart3,
  Settings2,
  Beaker,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Experiment, Dataset } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { suggestHyperparameters } from '../services/geminiService';
import Markdown from 'react-markdown';

export default function ExperimentList() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedExp, setSelectedExp] = useState<Experiment | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [autoRunProgress, setAutoRunProgress] = useState(0);
  const [showAutoRunModal, setShowAutoRunModal] = useState(false);
  const [autoRunDatasetId, setAutoRunDatasetId] = useState('');

  const [newExp, setNewExp] = useState({
    name: '',
    dataset_id: '',
    model_type: 'Random Forest',
    hyperparameters: { 
      n_estimators: 100, 
      max_depth: 10,
      learning_rate: 0.1,
      subsample: 1.0,
      validation_split: 0.2,
      cross_validation: 5,
      optimizer: 'Adam',
      loss: 'CrossEntropy'
    }
  });

  useEffect(() => {
    fetchExperiments();
    fetchDatasets();
  }, []);

  const fetchExperiments = async () => {
    const res = await fetch('/api/experiments');
    const data = await res.json();
    setExperiments(data);
  };

  const fetchDatasets = async () => {
    const res = await fetch('/api/datasets');
    const data = await res.json();
    setDatasets(data);
  };

  const handleCreate = async () => {
    const id = Math.random().toString(36).substring(7);
    await fetch('/api/experiments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newExp, id })
    });
    setShowNewModal(false);
    setAiSuggestion(null);
    fetchExperiments();
  };

  const handleRun = async (id: string) => {
    await fetch(`/api/experiments/${id}/run`, { method: 'POST' });
    fetchExperiments();
    if (selectedExp?.id === id) {
      fetchLogs(id);
    }
  };

  const fetchLogs = async (id: string) => {
    const res = await fetch(`/api/experiments/${id}/logs`);
    const data = await res.json();
    setLogs(data);
  };

  const viewDetails = (exp: Experiment) => {
    setSelectedExp(exp);
    fetchLogs(exp.id);
  };

  const handleAiSuggest = async () => {
    if (!newExp.dataset_id) return;
    setIsSuggesting(true);
    try {
      const dataset = datasets.find(d => d.id === newExp.dataset_id);
      const res = await suggestHyperparameters(newExp.model_type, `Dataset: ${dataset?.name}, Columns: ${dataset?.columns}`);
      setAiSuggestion(res || "No suggestions available.");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleAutoRun = async () => {
    if (!autoRunDatasetId) return;

    setShowAutoRunModal(false);
    setIsAutoRunning(true);
    setAutoRunProgress(0);

    try {
      const res = await fetch('/api/experiments/auto-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset_id: autoRunDatasetId })
      });

      if (!res.ok) throw new Error("Auto-run failed");

      const result = await res.json();
      
      // Simulate progress
      for (let i = 1; i <= 10; i++) {
        setAutoRunProgress(i * 10);
        await new Promise(r => setTimeout(r, 300));
      }

      fetchExperiments();
    } catch (error) {
      console.error(error);
      alert("Auto-run failed. Please try again.");
    } finally {
      setIsAutoRunning(false);
      setAutoRunProgress(0);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="text-emerald-500" size={18} />;
      case 'running': return <Activity className="text-indigo-500 animate-pulse" size={18} />;
      case 'failed': return <AlertCircle className="text-red-500" size={18} />;
      default: return <Clock className="text-slate-400" size={18} />;
    }
  };

  const updateHyperparam = (key: string, value: any) => {
    setNewExp({
      ...newExp,
      hyperparameters: {
        ...newExp.hyperparameters,
        [key]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Experiments</h2>
          <p className="text-slate-500 text-sm">Train and evaluate your machine learning models</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              if (datasets.length === 0) {
                alert("Please upload a dataset first.");
                return;
              }
              setAutoRunDatasetId(datasets[0]?.id || '');
              setShowAutoRunModal(true);
            }}
            disabled={isAutoRunning || datasets.length === 0}
            className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isAutoRunning ? (
              <>
                <Activity size={18} className="animate-spin" />
                Auto-running ({autoRunProgress}%)
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Auto Run
              </>
            )}
          </button>
          <button 
            onClick={() => setShowNewModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Plus size={18} />
            New Experiment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* List */}
        <div className="xl:col-span-4 space-y-4">
          {experiments.map((exp) => (
            <button
              key={exp.id}
              onClick={() => viewDetails(exp)}
              className={`w-full text-left bg-white border rounded-2xl p-4 transition-all ${
                selectedExp?.id === exp.id ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {exp.model_type}
                </span>
                {getStatusIcon(exp.status)}
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{exp.name}</h3>
              <p className="text-xs text-slate-500 truncate mb-3">Dataset: {exp.dataset_name || 'None'}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  {exp.status === 'completed' && exp.metrics && (
                    <div className="flex items-center gap-1">
                      <BarChart3 size={12} className="text-emerald-500" />
                      <span className="text-xs font-medium text-slate-700">
                        {(JSON.parse(exp.metrics).final_accuracy * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                {exp.status === 'pending' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleRun(exp.id); }}
                    className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <Play size={14} fill="currentColor" />
                  </button>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Details & Charts */}
        <div className="xl:col-span-8">
          {selectedExp ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 h-full">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-slate-900">{selectedExp.name}</h2>
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                      selectedExp.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                      selectedExp.status === 'running' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500'
                    }`}>
                      {selectedExp.status}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm">Model: {selectedExp.model_type} • Dataset: {selectedExp.dataset_name}</p>
                </div>
                <div className="flex gap-2">
                  {selectedExp.status === 'completed' && (
                    <button 
                      onClick={() => window.open(`/api/experiments/${selectedExp.id}/report`, '_blank')}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
                    >
                      <FileDown size={16} />
                      Report
                    </button>
                  )}
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                    <Settings2 size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {Object.entries(JSON.parse(selectedExp.hyperparameters)).map(([key, value]) => (
                  <div key={key} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{key.replace('_', ' ')}</p>
                    <p className="text-sm font-semibold text-slate-700">{String(value)}</p>
                  </div>
                ))}
              </div>

              {logs.length > 0 ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-slate-50 rounded-2xl p-6">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Final Accuracy</p>
                      <p className="text-3xl font-bold text-slate-900">
                        {(logs[logs.length - 1].accuracy * 100).toFixed(2)}%
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-6">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Final Loss</p>
                      <p className="text-3xl font-bold text-slate-900">
                        {logs[logs.length - 1].loss.toFixed(4)}
                      </p>
                    </div>
                  </div>

                  <div className="h-[300px] w-full">
                    <p className="text-sm font-semibold text-slate-900 mb-4">Training Progress</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={logs}>
                        <defs>
                          <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="epoch" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area type="monotone" dataKey="accuracy" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorAcc)" />
                        <Area type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={3} fillOpacity={0} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                    <Activity size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">No training data</h3>
                  <p className="text-slate-500 max-w-xs mx-auto mt-2">Run the experiment to see real-time training metrics and performance curves.</p>
                  {selectedExp.status === 'pending' && (
                    <button 
                      onClick={() => handleRun(selectedExp.id)}
                      className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                      <Play size={18} fill="currentColor" /> Start Training
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-white border border-slate-200 border-dashed rounded-3xl text-slate-400">
              <Beaker size={48} className="mb-4 opacity-20" />
              <p>Select an experiment to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Auto Run Selection Modal */}
      <AnimatePresence>
        {showAutoRunModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Auto Run Setup</h3>
                  <p className="text-slate-500 text-sm">Select a dataset to optimize</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target Dataset</label>
                  <div className="relative">
                    <select 
                      value={autoRunDatasetId}
                      onChange={(e) => setAutoRunDatasetId(e.target.value)}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      {datasets.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.rows} rows)</option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                  <div className="flex gap-3">
                    <Info size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-indigo-700 leading-relaxed">
                      Auto Run will automatically test multiple model architectures and hyperparameter configurations to find the best fit for your data.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setShowAutoRunModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAutoRun}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  Start Optimization
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Experiment Modal */}
      <AnimatePresence>
        {showNewModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Configure Experiment</h3>
                <button 
                  onClick={handleAiSuggest}
                  disabled={isSuggesting || !newExp.dataset_id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                  {isSuggesting ? <Activity size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Suggest via AI
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Experiment Name</label>
                    <input 
                      type="text" 
                      value={newExp.name}
                      onChange={(e) => setNewExp({...newExp, name: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      placeholder="e.g. Sales Prediction v1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Dataset</label>
                    <select 
                      value={newExp.dataset_id}
                      onChange={(e) => setNewExp({...newExp, dataset_id: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    >
                      <option value="">Select a dataset</option>
                      {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Model Type</label>
                    <select 
                      value={newExp.model_type}
                      onChange={(e) => setNewExp({...newExp, model_type: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    >
                      <option>Random Forest</option>
                      <option>XGBoost</option>
                      <option>Neural Network</option>
                      <option>Logistic Regression</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center justify-between w-full text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-slate-900 transition-colors"
                    >
                      Advanced Configuration
                      {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    
                    {showAdvanced && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="space-y-4 mt-4 overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Validation Split</label>
                            <input 
                              type="number" 
                              step="0.05"
                              min="0"
                              max="0.5"
                              value={newExp.hyperparameters.validation_split}
                              onChange={(e) => updateHyperparam('validation_split', parseFloat(e.target.value))}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">CV Folds</label>
                            <input 
                              type="number" 
                              value={newExp.hyperparameters.cross_validation}
                              onChange={(e) => updateHyperparam('cross_validation', parseInt(e.target.value))}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Optimizer</label>
                          <select 
                            value={newExp.hyperparameters.optimizer}
                            onChange={(e) => updateHyperparam('optimizer', e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                          >
                            <option>Adam</option>
                            <option>SGD</option>
                            <option>RMSprop</option>
                            <option>Adagrad</option>
                          </select>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Settings2 size={14} /> Hyperparameters
                    </h4>
                    <div className="space-y-3">
                      {newExp.model_type === 'Random Forest' || newExp.model_type === 'XGBoost' ? (
                        <>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Estimators</label>
                            <input 
                              type="range" min="10" max="500" step="10"
                              value={newExp.hyperparameters.n_estimators}
                              onChange={(e) => updateHyperparam('n_estimators', parseInt(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                              <span>10</span>
                              <span className="font-bold text-indigo-600">{newExp.hyperparameters.n_estimators}</span>
                              <span>500</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Max Depth</label>
                            <input 
                              type="range" min="1" max="50" step="1"
                              value={newExp.hyperparameters.max_depth}
                              onChange={(e) => updateHyperparam('max_depth', parseInt(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                              <span>1</span>
                              <span className="font-bold text-indigo-600">{newExp.hyperparameters.max_depth}</span>
                              <span>50</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Learning Rate</label>
                            <input 
                              type="number" step="0.001"
                              value={newExp.hyperparameters.learning_rate}
                              onChange={(e) => updateHyperparam('learning_rate', parseFloat(e.target.value))}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm outline-none"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {aiSuggestion && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-indigo-900 rounded-2xl p-4 text-white text-xs overflow-hidden relative"
                    >
                      <div className="relative z-10">
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                          <Sparkles size={12} /> AI Recommendation
                        </h4>
                        <div className="markdown-body text-indigo-100 max-h-[150px] overflow-y-auto scrollbar-hide">
                          <Markdown>{aiSuggestion}</Markdown>
                        </div>
                      </div>
                      <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-indigo-500/20 rounded-full blur-2xl" />
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => { setShowNewModal(false); setAiSuggestion(null); }}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreate}
                  disabled={!newExp.name || !newExp.dataset_id}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  Create Experiment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
