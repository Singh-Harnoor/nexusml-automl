import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Cpu, 
  Bell, 
  Globe, 
  Key, 
  Save,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Settings() {
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState({
    platformName: 'AutoML Studio Pro',
    defaultCompute: 'GPU-T4',
    maxEpochs: 100,
    enableNotifications: true,
    autoSuggest: true,
    privacyLevel: 'private'
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-slate-500 text-sm">Configure your AutoML platform preferences and security</p>
        </div>
        <button 
          onClick={handleSave}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-all shadow-lg shadow-indigo-200 active:scale-95"
        >
          {saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
          {saved ? 'Saved' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Navigation for Settings */}
        <div className="space-y-1">
          {[
            { id: 'general', label: 'General', icon: Globe },
            { id: 'compute', label: 'Compute Resources', icon: Cpu },
            { id: 'security', label: 'Security & API', icon: Shield },
            { id: 'notifications', label: 'Notifications', icon: Bell },
          ].map((item) => (
            <button
              key={item.id}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                item.id === 'general' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="md:col-span-2 space-y-6">
          {/* General Section */}
          <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Globe size={20} className="text-indigo-600" />
              General Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Platform Name</label>
                <input 
                  type="text" 
                  value={config.platformName}
                  onChange={(e) => setConfig({...config, platformName: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">AI Auto-Suggestions</p>
                  <p className="text-xs text-slate-500">Enable Gemini-powered hyperparameter recommendations</p>
                </div>
                <button 
                  onClick={() => setConfig({...config, autoSuggest: !config.autoSuggest})}
                  className={`w-12 h-6 rounded-full transition-colors relative ${config.autoSuggest ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.autoSuggest ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </section>

          {/* Compute Section */}
          <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Cpu size={20} className="text-indigo-600" />
              Compute Resources
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Default Accelerator</label>
                <select 
                  value={config.defaultCompute}
                  onChange={(e) => setConfig({...config, defaultCompute: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                >
                  <option value="CPU">CPU (Standard)</option>
                  <option value="GPU-T4">NVIDIA T4 GPU</option>
                  <option value="GPU-A100">NVIDIA A100 GPU (Premium)</option>
                  <option value="TPU">Google TPU v3</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Max Training Epochs</label>
                <input 
                  type="number" 
                  value={config.maxEpochs}
                  onChange={(e) => setConfig({...config, maxEpochs: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
          </section>

          {/* API Section */}
          <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Key size={20} className="text-indigo-600" />
              API & Integrations
            </h3>
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <div className="flex gap-3">
                <Shield className="text-indigo-600 shrink-0" size={20} />
                <div>
                  <p className="text-sm font-bold text-indigo-900">Gemini API Connection</p>
                  <p className="text-xs text-indigo-700 mt-1">
                    Your platform is currently connected to Gemini 3 Flash. API keys are managed via environment variables for security.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Active & Healthy</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
