import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, 
  LineChart, Line, 
  AreaChart, Area, 
  ScatterChart, Scatter, 
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart,
  FunnelChart, Funnel, LabelList,
  Treemap,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ZAxis
} from 'recharts';
import { 
  Table as TableIcon, 
  BarChart3, 
  LineChart as LineIcon, 
  AreaChart as AreaIcon, 
  ScatterChart as ScatterIcon, 
  PieChart as PieIcon,
  Activity,
  Layers,
  Filter,
  Grid3X3,
  ChevronDown,
  Database,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Dataset } from '../types';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const VIZ_TYPES = [
  { id: 'table', label: 'Data Table', icon: TableIcon },
  { id: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { id: 'line', label: 'Line Chart', icon: LineIcon },
  { id: 'area', label: 'Area Chart', icon: AreaIcon },
  { id: 'scatter', label: 'Scatter Plot', icon: ScatterIcon },
  { id: 'pie', label: 'Pie Chart', icon: PieIcon },
  { id: 'radar', label: 'Radar Chart', icon: Activity },
  { id: 'composed', label: 'Composed', icon: Layers },
  { id: 'funnel', label: 'Funnel', icon: Filter },
  { id: 'treemap', label: 'Treemap', icon: Grid3X3 },
];

export default function Visualization() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [activeViz, setActiveViz] = useState<string>('table');
  const [xAxisKey, setXAxisKey] = useState<string>('');
  const [yAxisKey, setYAxisKey] = useState<string>('');
  const [yAxisKey2, setYAxisKey2] = useState<string>('');

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    const res = await fetch('/api/datasets');
    const data = await res.json();
    setDatasets(data);
    if (data.length > 0) {
      setSelectedDatasetId(data[0].id);
    }
  };

  const selectedDataset = useMemo(() => 
    datasets.find(d => d.id === selectedDatasetId), 
    [datasets, selectedDatasetId]
  );

  const columns = useMemo(() => {
    if (!selectedDataset) return [];
    try {
      const cols = typeof selectedDataset.columns === 'string' 
        ? JSON.parse(selectedDataset.columns) 
        : selectedDataset.columns;
      return Array.isArray(cols) ? cols : [];
    } catch (e) {
      return [];
    }
  }, [selectedDataset]);

  useEffect(() => {
    if (columns.length > 0) {
      setXAxisKey(columns[0]);
      setYAxisKey(columns[1] || columns[0]);
      setYAxisKey2(columns[2] || (columns[1] || columns[0]));
    }
  }, [columns]);

  const data = useMemo(() => {
    if (!selectedDataset || !selectedDataset.data) return [];
    try {
      const parsedData = typeof selectedDataset.data === 'string' 
        ? JSON.parse(selectedDataset.data) 
        : selectedDataset.data;
      
      // Ensure numeric values are actually numbers for charts
      return Array.isArray(parsedData) ? parsedData.map(row => {
        const newRow = { ...row };
        Object.keys(newRow).forEach(key => {
          const val = newRow[key];
          if (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '') {
            newRow[key] = Number(val);
          }
        });
        return newRow;
      }) : [];
    } catch (e) {
      console.error("Error parsing dataset data:", e);
      return [];
    }
  }, [selectedDataset]);

  const renderViz = () => {
    if (!selectedDataset) return (
      <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
        <Database size={48} className="mb-4 opacity-20" />
        <p>Select a dataset to begin visualization</p>
      </div>
    );

    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
          <Info size={48} className="mb-4 opacity-20" />
          <p>No data available for this dataset</p>
        </div>
      );
    }

    const xKey = xAxisKey || columns[0] || 'name';
    const yKey = yAxisKey || columns[1] || columns[0] || 'value';
    const yKey2 = yAxisKey2 || columns[2] || yKey;

    switch (activeViz) {
      case 'table':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  {columns.map(col => (
                    <th key={col} className="px-6 py-3 font-bold">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 15).map((row, i) => (
                  <tr key={i} className="bg-white border-b hover:bg-slate-50">
                    {columns.map(col => (
                      <td key={col} className="px-6 py-4 truncate max-w-[200px]">{row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-slate-400 mt-4 italic">* Showing first 15 rows of the dataset</p>
          </div>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.slice(0, 50)} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} label={{ value: xKey, position: 'insideBottom', offset: -10, fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} label={{ value: yKey, angle: -90, position: 'insideLeft', fontSize: 12, fill: '#64748b' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Legend verticalAlign="top" height={36}/>
              <Bar name={yKey} dataKey={yKey} fill="#4f46e5" radius={[4, 4, 0, 0]} />
              {yKey2 !== yKey && <Bar name={yKey2} dataKey={yKey2} fill="#10b981" radius={[4, 4, 0, 0]} />}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data.slice(0, 50)} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} label={{ value: xKey, position: 'insideBottom', offset: -10, fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} label={{ value: yKey, angle: -90, position: 'insideLeft', fontSize: 12, fill: '#64748b' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Legend verticalAlign="top" height={36}/>
              <Line name={yKey} type="monotone" dataKey={yKey} stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              {yKey2 !== yKey && <Line name={yKey2} type="monotone" dataKey={yKey2} stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data.slice(0, 50)} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="colorY" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} label={{ value: xKey, position: 'insideBottom', offset: -10, fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} label={{ value: yKey, angle: -90, position: 'insideLeft', fontSize: 12, fill: '#64748b' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Area name={yKey} type="monotone" dataKey={yKey} stroke="#4f46e5" fillOpacity={1} fill="url(#colorY)" />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" dataKey={xKey} name={xKey} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} label={{ value: xKey, position: 'insideBottom', offset: -10, fontSize: 12, fill: '#64748b' }} />
              <YAxis type="number" dataKey={yKey} name={yKey} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} label={{ value: yKey, angle: -90, position: 'insideLeft', fontSize: 12, fill: '#64748b' }} />
              <ZAxis type="number" range={[64, 144]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend verticalAlign="top" height={36}/>
              <Scatter name={`${xKey} vs ${yKey}`} data={data.slice(0, 100)} fill="#4f46e5" />
            </ScatterChart>
          </ResponsiveContainer>
        );
      case 'pie':
        const pieData = data.slice(0, 8).map(d => ({ name: d[xKey], value: d[yKey] }));
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'radar':
        const radarData = data.slice(0, 8);
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="#f1f5f9" />
              <PolarAngleAxis dataKey={xKey} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <PolarRadiusAxis angle={30} />
              <Radar name={yKey} dataKey={yKey} stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
              {yKey2 !== yKey && <Radar name={yKey2} dataKey={yKey2} stroke="#10b981" fill="#10b981" fillOpacity={0.6} />}
              <Legend verticalAlign="top" height={36}/>
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        );
      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={data.slice(0, 50)} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey={xKey} scale="band" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} label={{ value: xKey, position: 'insideBottom', offset: -10, fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} label={{ value: yKey, angle: -90, position: 'insideLeft', fontSize: 12, fill: '#64748b' }} />
              <Tooltip />
              <Legend verticalAlign="top" height={36}/>
              <Area name={yKey} type="monotone" dataKey={yKey} fill="#4f46e5" stroke="#4f46e5" fillOpacity={0.1} />
              <Bar name={yKey2} dataKey={yKey2} barSize={20} fill="#10b981" />
              <Line name={yKey} type="monotone" dataKey={yKey} stroke="#ef4444" />
            </ComposedChart>
          </ResponsiveContainer>
        );
      case 'funnel':
        const funnelData = data.slice(0, 8).map(d => ({ value: d[yKey], name: d[xKey], fill: COLORS[Math.floor(Math.random() * COLORS.length)] })).sort((a, b) => b.value - a.value);
        return (
          <ResponsiveContainer width="100%" height={400}>
            <FunnelChart>
              <Tooltip />
              <Funnel
                dataKey="value"
                data={funnelData}
                isAnimationActive
              >
                <LabelList position="right" fill="#94a3b8" stroke="none" dataKey="name" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        );
      case 'treemap':
        const treemapData = data.slice(0, 15).map(d => ({ name: d[xKey], size: d[yKey] }));
        return (
          <ResponsiveContainer width="100%" height={400}>
            <Treemap
              width={400}
              height={200}
              data={treemapData}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="#fff"
              fill="#4f46e5"
            >
              <Tooltip />
            </Treemap>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Visualization</h2>
          <p className="text-slate-500 text-sm">Explore and understand your datasets through interactive charts</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <select 
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 pr-10 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
            >
              {datasets.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">Visualization Types</p>
            {VIZ_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setActiveViz(type.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                  activeViz === type.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                <type.icon size={18} />
                {type.label}
              </button>
            ))}
          </div>

          {activeViz !== 'table' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Axis Configuration</p>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 ml-1">X-Axis / Category</label>
                <div className="relative">
                  <select 
                    value={xAxisKey}
                    onChange={(e) => setXAxisKey(e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 pr-8 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    {columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 ml-1">Y-Axis / Value 1</label>
                <div className="relative">
                  <select 
                    value={yAxisKey}
                    onChange={(e) => setYAxisKey(e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 pr-8 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    {columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {(activeViz === 'bar' || activeViz === 'line' || activeViz === 'radar' || activeViz === 'composed') && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 ml-1">Y-Axis / Value 2 (Optional)</label>
                  <div className="relative">
                    <select 
                      value={yAxisKey2}
                      onChange={(e) => setYAxisKey2(e.target.value)}
                      className="w-full appearance-none bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 pr-8 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      {columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-3 space-y-6">
          <motion.div 
            key={activeViz + selectedDatasetId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm min-h-[500px]"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {VIZ_TYPES.find(v => v.id === activeViz)?.label}
                <span className="text-xs font-normal text-slate-400">for {selectedDataset?.name}</span>
              </h3>
              <div className="flex gap-2">
                <div className="px-3 py-1 bg-slate-50 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {columns.length} Columns
                </div>
                <div className="px-3 py-1 bg-slate-50 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {selectedDataset?.rows} Rows
                </div>
              </div>
            </div>

            <div className="w-full">
              {renderViz()}
            </div>
          </motion.div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 flex gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
              <Info size={24} />
            </div>
            <div>
              <h4 className="font-bold text-indigo-900 text-sm">Visualization Insight</h4>
              <p className="text-indigo-700 text-xs mt-1 leading-relaxed">
                This visualization is generated based on the schema of your dataset. For CSV files, we analyze the first few rows to determine data types. You can use these charts to identify outliers, check distribution, and understand correlations between features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
