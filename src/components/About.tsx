import React from 'react';
import { motion } from 'motion/react';
import { 
  Info, 
  Target, 
  Lightbulb, 
  Users, 
  Cpu, 
  ShieldCheck, 
  Rocket,
  Github,
  Globe
} from 'lucide-react';

export default function About() {
  const sections = [
    {
      title: "Purpose",
      icon: Target,
      content: "AutoML Studio is designed to democratize machine learning by providing an intuitive, no-code interface for data scientists and developers. Our goal is to streamline the end-to-end ML workflow—from data ingestion and preprocessing to model training and evaluation—allowing users to focus on insights rather than infrastructure.",
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Motivation",
      icon: Lightbulb,
      content: "The complexity of modern machine learning often creates a barrier to entry. We were motivated by the need for a tool that bridges the gap between raw data and production-ready models. By leveraging advanced AI for hyperparameter suggestion and automated pipelines, we empower users to build high-performance models in minutes, not days.",
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    {
      title: "Target Audience",
      icon: Users,
      content: "Our platform serves a diverse range of users: Data Analysts looking to transition into ML, Software Engineers needing quick model prototyping, and Researchers who want to automate repetitive training tasks. It's also an excellent educational tool for students learning the fundamentals of model performance and tuning.",
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    }
  ];

  const tools = [
    { name: "React 18", desc: "Modern UI library for a responsive and interactive experience.", icon: Cpu },
    { name: "TypeScript", desc: "Ensuring type safety and robust code across the full stack.", icon: ShieldCheck },
    { name: "Tailwind CSS", desc: "Utility-first styling for a clean, professional dashboard aesthetic.", icon: Globe },
    { name: "Gemini AI", desc: "Powering intelligent hyperparameter suggestions and data insights.", icon: Rocket },
    { name: "SQLite", desc: "Reliable, lightweight local database for experiment tracking.", icon: Github },
    { name: "Recharts", desc: "Dynamic data visualization for training logs and performance metrics.", icon: Target }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">About AutoML Studio</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          A comprehensive platform for automated machine learning, designed to make high-performance modeling accessible to everyone.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {sections.map((section, i) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`w-12 h-12 ${section.bg} ${section.color} rounded-2xl flex items-center justify-center mb-6`}>
              <section.icon size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">{section.title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {section.content}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-12 shadow-sm">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center">
            <Cpu size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Technology Stack</h2>
            <p className="text-slate-500 text-sm">Built with industry-leading tools and frameworks</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool, i) => (
            <motion.div 
              key={tool.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-4"
            >
              <div className="shrink-0 w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                <tool.icon size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{tool.name}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{tool.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
}
