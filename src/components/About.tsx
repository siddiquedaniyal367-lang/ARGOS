"use client";

import React from "react";
import { 
  Crosshair, 
  Layers, 
  Terminal, 
  Activity, 
  Boxes, 
  BookOpen 
} from "lucide-react";

export default function About() {
  const features = [
    {
      icon: Crosshair,
      title: "Precision CNC Motion Control",
      desc: "Dual X-axis guide rails and fine belt tensioning systems ensure high sub-millimeter positional accuracy."
    },
    {
      icon: Layers,
      title: "Modular Design",
      desc: "Designed with component interchangeability in mind. Easily switch modules or replace hardware elements."
    },
    {
      icon: Terminal,
      title: "Custom Software Interface",
      desc: "Intuitive command execution interface that interprets G-code and guides the plotter smoothly."
    },
    {
      icon: Activity,
      title: "Real-Time Plotting",
      desc: "Immediate data streaming and coordinate mapping, synchronizing physical motion with software feedback."
    },
    {
      icon: Boxes,
      title: "Expandable Architecture",
      desc: "Extend plotter travel dimensions or upgrade laser modules without redesigning structural frameworks."
    },
    {
      icon: BookOpen,
      title: "Educational & Prototyping",
      desc: "Perfect platform for teaching core robotics principles and prototyping complex designs quickly."
    }
  ];

  return (
    <section id="about" className="relative py-24 bg-bg-dark border-b border-border-card">
      <div className="absolute inset-0 tech-grid-fine opacity-20 pointer-events-none" />


      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Text Column */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 reveal reveal-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-5 h-px bg-blue-500/50" />
              <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-blue-600 uppercase">
                Overview
              </span>
            </div>
            <h2 className="font-mono text-4xl md:text-5xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-6 leading-tight uppercase">
              Precision engineered for digital fabrication.
            </h2>
            <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 mb-6 rounded-full overflow-hidden">
              <div className="w-1/3 h-full bg-blue-500 rounded-full" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-base md:text-lg leading-relaxed mb-5">
              ARGOS is a smart CNC Laser Plotter platform developed to convert digital designs into precise physical outputs.
            </p>
            <p className="text-slate-400 dark:text-slate-500 font-medium text-sm md:text-base leading-relaxed">
              By integrating custom hardware control frameworks with rigid mechanics, the system bridges the gap between software instructions and physical reality — delivering clean cuts, smooth engraving, and repeatable precision.
            </p>
          </div>

          {/* Right Features Grid Column */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 stagger-children">
            {features.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div 
                  key={idx} 
                  className="p-6 rounded-xl border-4 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-[6px_6px_0px_#cbd5e1] dark:shadow-[6px_6px_0px_#1e293b] hover:bg-slate-50 dark:hover:bg-slate-900 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_#cbd5e1] dark:hover:shadow-[8px_8px_0px_#1e293b] active:shadow-none active:translate-y-[6px] active:translate-x-[6px] transition-all duration-200 group relative overflow-hidden cursor-pointer"
                >
                  <div className="w-10 h-10 border-2 border-slate-300 dark:border-slate-700 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 mb-5 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:border-blue-500/50 dark:group-hover:border-blue-500/50 transition-all duration-300 shadow-inner">
                    <IconComp className="w-5 h-5" />
                  </div>
                  
                  <h3 className="font-mono text-[12px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-100 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h3>
                  
                  <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
