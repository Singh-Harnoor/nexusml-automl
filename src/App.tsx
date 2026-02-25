import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardOverview from './components/DashboardOverview';
import DatasetList from './components/DatasetList';
import ExperimentList from './components/ExperimentList';
import Settings from './components/Settings';
import Visualization from './components/Visualization';
import About from './components/About'; 
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'datasets':
        return <DatasetList />;
      case 'visualization':
        return <Visualization />;
      case 'experiments':
        return <ExperimentList />;
      case 'settings':
        return <Settings />;
      case 'about':
        return <About />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 ml-64 p-10 bg-[#f8f9fc]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
