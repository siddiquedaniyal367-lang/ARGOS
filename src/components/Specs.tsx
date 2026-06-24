"use client";

import React from "react";
import { 
  Cpu, 
  Settings, 
  Zap, 
  Flame as Laser, 
  Terminal, 
  Ruler 
} from "lucide-react";

export default function Specs() {
  const specs = [
    {
      icon: Cpu,
      title: "System Controller",
      value: "Arduino Platform",
      desc: "ATmega328P microcontroller running customized GRBL firmware. Operates with hardware step-generation algorithms to ensure smooth coordinate calculations.",
      params: ["8-bit AVR Core", "GRBL CNC firmware", "115200 serial baud"]
    },
    {
      icon: Settings,
      title: "Motion System",
      value: "CNC XY Platform",
      desc: "Cartesian linear movement structure utilizing rigid structural V-slot aluminum extrusions, precision steel guide rails, and timing belt pulleys.",
      params: ["500mm x 500mm travel", "Dual X-axis linear rails", "GT2 timing belt drive"]
    },
    {
      icon: Zap,
      title: "Motor Drivers",
      value: "A4988 / DRV8825",
      desc: "High-performance motor driver chips configured with thermal shutdown and adjustable current limits to run step coils with microstepping precision.",
      params: ["Adjustable potentiometer", "Bipolar stepper support", "Passive heatsink cooling"]
    },
    {
      icon: Laser,
      title: "Fabrication Method",
      value: "Laser Plotting",
      desc: "Projects focused high-energy blue laser light (450nm) to burn, engrave, or plot. Features immediate digital PWM modulation to adjust cutting strength.",
      params: ["450nm wavelength", "3.5W optical power", "Adjustable collimator focus"]
    },
    {
      icon: Terminal,
      title: "Control Software",
      value: "Custom ARGOS UI",
      desc: "Dedicated user interface and G-code parser to stream coordinate coordinates, monitor machine telemetry, run calibration routines, and control laser status.",
      params: ["G-code parser streamer", "Live coordinates DRO", "Serial port integration"]
    },
    {
      icon: Ruler,
      title: "CAD & Modeling Tools",
      value: "SolidWorks Design",
      desc: "Structural frame design, bracket files, carriage tolerances, and mechanical parts modeled and validated in a parametric 3D CAD environment.",
      params: ["Parametric 3D CAD", "Tolerance validation", "STL exporting for 3D printing"]
    }
  ];

  return (
    <section id="specs" className="relative py-24 bg-bg-dark border-b border-border-card">
      <div className="absolute inset-0 tech-grid-fine opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 reveal flex flex-col items-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-5 h-px bg-blue-500/50" />
            <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-blue-600 uppercase">
              Specifications
            </span>
            <div className="w-5 h-px bg-blue-500/50" />
          </div>
          <h2 className="font-mono text-4xl md:text-5xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-6 leading-tight uppercase">
            Technical Specifications
          </h2>
          <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 mb-6 rounded-full overflow-hidden">
            <div className="w-1/3 h-full bg-blue-500 rounded-full" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-base leading-relaxed">
            Hardware tolerances, structural components, electrical controllers, and software stack of the ARGOS platform.
          </p>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {specs.map((item, idx) => {
            const IconComp = item.icon;
            
            return (
              <div 
                key={idx}
                className="p-6 rounded-xl border-4 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-[6px_6px_0px_#cbd5e1] dark:shadow-[6px_6px_0px_#1e293b] hover:bg-slate-50 dark:hover:bg-slate-900 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_#cbd5e1] dark:hover:shadow-[8px_8px_0px_#1e293b] active:shadow-none active:translate-y-[6px] active:translate-x-[6px] transition-all duration-200 group relative overflow-hidden flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* Title & Icon */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-10 h-10 border-2 border-slate-300 dark:border-slate-700 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:border-blue-500/50 dark:group-hover:border-blue-500/50 flex items-center justify-center transition-all duration-300 shadow-inner">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-[10px] font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </span>
                  </div>

                  {/* Tech Value */}
                  <h3 className="font-mono text-xl font-black text-slate-800 dark:text-slate-100 mb-3 tracking-widest uppercase">
                    {item.value}
                  </h3>

                  {/* Description */}
                  <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed mb-6">
                    {item.desc}
                  </p>
                </div>

                {/* Parameters Sublist */}
                <div className="border-t-2 border-slate-200 dark:border-slate-800 pt-4 mt-auto font-mono text-[10px] font-black text-slate-400 dark:text-slate-500 space-y-2 uppercase tracking-wider">
                  {item.params.map((param, pidx) => (
                    <div key={pidx} className="flex justify-between gap-4">
                      <span className="text-slate-300 dark:text-slate-700">–</span>
                      <span className="text-right text-slate-600 dark:text-slate-400">{param}</span>
                    </div>
                  ))}
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
