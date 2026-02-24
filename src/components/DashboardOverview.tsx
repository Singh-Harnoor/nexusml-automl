import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  TrendingUp, 
  Users, 
  Database, 
  Beaker,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  AreaChart, Area, 
  XAxis, YAxis, 
  CartesianGrid, Tooltip, 
  ResponsiveContainer,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar
} from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const data = [
  { name: 'Mon', usage: 400 },
  { name: 'Tue', usage: 300 },
  { name: 'Wed', usage: 600 },
  { name: 'Thu', usage: 800 },
  { name: 'Fri', usage: 500 },
  { name: 'Sat', usage: 900 },
  { name: 'Sun', usage: 1100 },
];

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    datasets: 0,
    experiments: 0,
    accuracy: 0,
    compute: '0.0 hrs',
    trends: {
      datasets: '+0 this week',
      experiments: '+0 this week',
      accuracy: '+0.0%',
      compute: '+0%'
    },
    up: {
      datasets: true,
      experiments: true,
      accuracy: true,
      compute: true
    }
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [modelDistribution, setModelDistribution] = useState<any[]>([]);
  const [datasetTypes, setDatasetTypes] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const [dsRes, expRes] = await Promise.all([
        fetch('/api/datasets'),
        fetch('/api/experiments')
      ]);
      const ds = await dsRes.json();
      const exps = await expRes.json();
      
      const completed = exps.filter((e: any) => e.status === 'completed');
      const avgAcc = completed.length > 0 
        ? completed.reduce((acc: number, curr: any) => {
            try {
              const metrics = typeof curr.metrics === 'string' ? JSON.parse(curr.metrics) : curr.metrics;
              return acc + (metrics?.final_accuracy || 0);
            } catch (e) { return acc; }
          }, 0) / completed.length
        : 0;

      // Calculate Trends
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const newDatasets = ds.filter((d: any) => new Date(d.created_at) > oneWeekAgo).length;
      const newExperiments = exps.filter((e: any) => new Date(e.created_at) > oneWeekAgo).length;
      
      // Accuracy trend (compare last 3 vs previous 3)
      let accTrend = 0;
      if (completed.length >= 2) {
        const last3 = completed.slice(-3);
        const prev3 = completed.slice(-6, -3);
        const lastAvg = last3.reduce((acc: number, curr: any) => acc + (typeof curr.metrics === 'string' ? JSON.parse(curr.metrics).final_accuracy : curr.metrics.final_accuracy), 0) / last3.length;
        const prevAvg = prev3.length > 0 
          ? prev3.reduce((acc: number, curr: any) => acc + (typeof curr.metrics === 'string' ? JSON.parse(curr.metrics).final_accuracy : curr.metrics.final_accuracy), 0) / prev3.length
          : lastAvg * 0.95; // Fallback
        accTrend = ((lastAvg - prevAvg) / (prevAvg || 1)) * 100;
      }

      setStats({
        datasets: ds.length,
        experiments: exps.length,
        accuracy: avgAcc,
        compute: `${(exps.length * 0.4).toFixed(1)} hrs`,
        trends: {
          datasets: `+${newDatasets} this week`,
          experiments: `+${newExperiments} this week`,
          accuracy: `${accTrend >= 0 ? '+' : ''}${accTrend.toFixed(1)}%`,
          compute: `+${(newExperiments * 5)}%`
        },
        up: {
          datasets: newDatasets >= 0,
          experiments: newExperiments >= 0,
          accuracy: accTrend >= 0,
          compute: true
        }
      });

      // Model Distribution for Radar
      const modelCounts: Record<string, number> = {};
      exps.forEach((e: any) => {
        modelCounts[e.model_type] = (modelCounts[e.model_type] || 0) + 1;
      });
      setModelDistribution(Object.entries(modelCounts).map(([name, value]) => ({ name, value, fullMark: 15 })));

      // Dataset Types for Pie
      const typeCounts: Record<string, number> = {};
      ds.forEach((d: any) => {
        typeCounts[d.type] = (typeCounts[d.type] || 0) + 1;
      });
      setDatasetTypes(Object.entries(typeCounts).map(([name, value]) => ({ name, value })));

      // Performance over time
      const perf = completed.slice(-7).map((e: any, i: number) => {
        try {
          const metrics = typeof e.metrics === 'string' ? JSON.parse(e.metrics) : e.metrics;
          return { name: `Exp ${i+1}`, accuracy: metrics?.final_accuracy || 0 };
        } catch (e) { return { name: `Exp ${i+1}`, accuracy: 0 }; }
      });
      setPerformanceData(perf);

      // Combine and sort for recent activity
      const activity = [
        ...ds.map((d: any) => ({ type: 'dataset', name: d.name, time: d.created_at })),
        ...exps.map((e: any) => ({ type: 'experiment', name: e.name, time: e.created_at, status: e.status }))
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);
      
      setRecentActivity(activity);
    };
    fetchStats();
  }, []);

  const cards = [
    { label: 'Total Datasets', value: stats.datasets, icon: Database, color: 'text-blue-600', bg: 'bg-blue-50', trend: stats.trends.datasets, up: stats.up.datasets },
    { label: 'Active Experiments', value: stats.experiments, icon: Beaker, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: stats.trends.experiments, up: stats.up.experiments },
    { label: 'Avg. Accuracy', value: `${(stats.accuracy * 100).toFixed(1)}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: stats.trends.accuracy, up: stats.up.accuracy },
    { label: 'Compute Time', value: stats.compute, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50', trend: stats.trends.compute, up: stats.up.compute },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">System Overview</h2>
        <p className="text-slate-500 text-sm">Real-time performance metrics and resource utilization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={card.label} 
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${card.bg} ${card.color}`}>
                <card.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${card.up ? 'text-emerald-600' : 'text-red-600'}`}>
                {card.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {card.trend}
              </div>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{card.label}</p>
            <h3 className="text-2xl font-bold text-slate-900">{card.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="font-bold text-lg">Model Performance Trend</h3>
                <p className="text-xs text-slate-400 italic font-serif">Historical accuracy of recent experiments</p>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 rounded-full">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                  <span className="text-[10px] font-bold text-indigo-600 uppercase">Accuracy</span>
                </div>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData.length > 0 ? performanceData : data}>
                  <defs>
                    <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="accuracy" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorUsage)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-sm mb-6 flex items-center gap-2">
                <Activity size={16} className="text-indigo-600" />
                Model Distribution
              </h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={modelDistribution}>
                    <PolarGrid stroke="#f1f5f9" />
                    <PolarAngleAxis dataKey="name" tick={{fontSize: 8, fill: '#94a3b8'}} />
                    <Radar name="Count" dataKey="value" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-sm mb-6 flex items-center gap-2">
                <Database size={16} className="text-emerald-600" />
                Dataset Sources
              </h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={datasetTypes}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {datasetTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {datasetTypes.map((type, i) => (
                  <div key={type.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{type.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6">Recent Activity</h3>
            <div className="space-y-6">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    item.type === 'dataset' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {item.type === 'dataset' ? <Database size={20} /> : <Activity size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 line-clamp-1">{item.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">
                      {item.type} • {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-slate-400 text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-indigo-600 p-6 rounded-3xl text-white relative overflow-hidden shadow-lg">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <Zap size={18} /> AutoML Suggestion
              </h3>
              <p className="text-indigo-100 text-xs leading-relaxed mb-4">
                Try <span className="font-bold text-white">XGBoost</span> on your latest dataset for better performance.
              </p>
              <button className="w-full bg-white text-indigo-600 py-2 rounded-xl font-bold text-xs hover:bg-indigo-50 transition-colors">
                Apply Now
              </button>
            </div>
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
