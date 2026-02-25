import React from 'react';
import { 
  LayoutDashboard, 
  Database, 
  Beaker, 
  Settings, 
  ChevronRight,
  Cpu,
  BarChart3,
  Info
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'datasets', label: 'Datasets', icon: Database },
    { id: 'visualization', label: 'Visualization', icon: BarChart3 },
    { id: 'experiments', label: 'Experiments', icon: Beaker },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3 border-bottom border-slate-100">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
          <Cpu size={24} />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">NexusML</h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">AutoML Orchestrator</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
              activeTab === item.id 
                ? "bg-indigo-50 text-indigo-600" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon size={20} />
            {item.label}
            {activeTab === item.id && (
              <ChevronRight size={16} className="ml-auto opacity-50" />
            )}
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-100">
        <div className="bg-slate-50 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">System Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-slate-700">Cluster Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
