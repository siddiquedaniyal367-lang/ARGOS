"use client";

import React from "react";
import { 
  Sparkles, 
  Route, 
  Locate, 
  Cloud, 
  Flame 
} from "lucide-react";

export default function FutureScope() {
  const cards = [
    {
      icon: Sparkles,
      title: "AI-Assisted Design",
      desc: "Integrate generative design engines that automatically optimize vector lines to maximize structural strength while minimizing plotting time."
    },
    {
      icon: Route,
      title: "Automatic Toolpaths",
      desc: "Develop automated algorithms to calculate the shortest path routes (solving the Travelling Salesperson Problem) for instant G-code output."
    },
    {
      icon: Locate,
      title: "Improved Precision",
      desc: "Upgrade XY linear axes with high-resolution optical encoders to create a closed-loop feedback system, reducing tolerances to under 0.05mm."
    },
    {
      icon: Cloud,
      title: "Cloud Connectivity",
      desc: "Build an IoT WiFi bridge allowing users to stream designs, schedule plotting queues, and monitor laser status remotely via a web browser."
    },
    {
      icon: Flame,
      title: "Material Processing",
      desc: "Upgrade the 3.5W laser module to a high-power CO2 laser source, enabling cutting of thick acrylics, hardwoods, and light sheet metals."
    }
  ];

  return (
    <section id="future-scope" className="relative py-24 bg-transparent border-b border-border-card">

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col items-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-5 h-px bg-yellow-500/50" />
            <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-yellow-500 uppercase">
              NEXT GENERATION CAPABILITIES
            </span>
            <div className="w-5 h-px bg-yellow-500/50" />
          </div>
          <h2 className="font-mono text-4xl md:text-5xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-6 leading-tight uppercase">
            Future Scope
          </h2>
          <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 mb-6 rounded-full overflow-hidden">
            <div className="w-1/3 h-full bg-yellow-500 rounded-full" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-base leading-relaxed">
            Where the ARGOS platform is heading next. Planned upgrades in hardware feedback loops, cloud control systems, and algorithmic optimizations.
          </p>
        </div>

        {/* Future Scope Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((item, idx) => {
            const IconComp = item.icon;
            
            return (
              <div 
                key={idx}
                className="p-6 rounded-xl border-4 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-[6px_6px_0px_#cbd5e1] dark:shadow-[6px_6px_0px_#1e293b] hover:bg-slate-50 dark:hover:bg-slate-900 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_#cbd5e1] dark:hover:shadow-[8px_8px_0px_#1e293b] active:shadow-none active:translate-y-[6px] active:translate-x-[6px] transition-all duration-200 group relative overflow-hidden flex flex-col justify-between cursor-pointer"
              >
                {/* Tech tag on top corner */}
                <div className="absolute top-0 right-0 font-mono text-[9px] font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-bl-lg border-b-2 border-l-2 border-slate-300 dark:border-slate-800 shadow-sm">
                  SYS_UPGRADE_0{idx + 1}
                </div>

                <div>
                  {/* Icon */}
                  <div className="w-10 h-10 border-2 border-slate-300 dark:border-slate-700 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 group-hover:border-yellow-500/50 dark:group-hover:border-yellow-500/50 flex items-center justify-center mb-6 transition-all duration-300 shadow-inner">
                    <IconComp className="w-5 h-5" />
                  </div>

                  {/* Title */}
                  <h3 className="font-mono text-[16px] font-black text-slate-800 dark:text-slate-100 mb-3 tracking-widest uppercase group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors duration-300">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed mb-6">
                    {item.desc}
                  </p>
                </div>

                <div className="font-mono text-[10px] font-black text-slate-400 dark:text-slate-600 tracking-widest uppercase mt-4">
                  STATUS: PLANNED
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
