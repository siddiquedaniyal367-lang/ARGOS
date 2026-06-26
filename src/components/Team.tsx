"use client";

import React from "react";
import { 
  Shield, 
  Cpu, 
  Terminal, 
  Wrench, 
  Layers, 
  User,
  Check
} from "lucide-react";

export default function Team() {
  const team = [
    {
      name: "Daniyal Siddique",
      role: "Team Leader • Electronics Lead • System Architect & CAD Design Lead",
      linkedin: "https://www.linkedin.com/in/daniyal-siddique-b40661417/",
      avatarInitials: "DS",
      disciplineIcon: Shield,
      contributions: [
        "Electronics Design & Circuit Optimization",
        "CAD Design Lead",
        "Team Leadership & Coordination",
        "Website Design & Architecture",
        "Technical Documentation & Analysis"
      ]
    },
    {
      name: "Rishab Soni",
      role: "Electronics Lead",
      avatarInitials: "RS",
      disciplineIcon: Cpu,
      contributions: [
        "Electronics Circuit Development",
        "Stepper Motor Drivers Integration",
        "Power Management Schematics",
        "Hardware Signal Validation"
      ]
    },
    {
      name: "Adarsh Jha",
      role: "Software Lead",
      avatarInitials: "AJ",
      disciplineIcon: Terminal,
      contributions: [
        "GRBL CNC Firmware Configuration",
        "Low-Level Command Logic",
        "Machine Interoperability Coding",
        "Real-Time Serial Communication"
      ]
    },
    {
      name: "Paras",
      role: "Mechanical Assembly Engineer",
      avatarInitials: "P",
      disciplineIcon: Wrench,
      contributions: [
        "Mechanical Framework Rigidity",
        "Structural Gantry Assembly",
        "Timing Belt & Pulley Setup",
        "Linear Bearing Configuration"
      ]
    },
    {
      name: "Raj Shukla",
      role: "Integration Engineer",
      avatarInitials: "RS",
      disciplineIcon: Layers,
      contributions: [
        "Full-System Hardware Integration",
        "Daily Reflections & Project Logs",
        "Mechanical Assembly Assistance",
        "Safety Interlock Verification"
      ]
    }
  ];

  return (
    <section id="team" className="relative py-24 bg-transparent border-b border-border-card">

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 reveal flex flex-col items-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-5 h-px bg-blue-500/50" />
            <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-blue-600 uppercase">
              The Team
            </span>
            <div className="w-5 h-px bg-blue-500/50" />
          </div>
          <h2 className="font-mono text-4xl md:text-5xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-6 leading-tight uppercase">
            Meet The Team
          </h2>
          <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 mb-6 rounded-full overflow-hidden">
            <div className="w-1/3 h-full bg-blue-500 rounded-full" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-base leading-relaxed">
            Five engineers who designed, wired, programmed, and assembled ARGOS from scratch in three weeks.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {team.map((member, idx) => {
            const IconComp = member.disciplineIcon;
            
            const CardWrapper = member.linkedin ? 'a' : 'div';
            const wrapperProps = member.linkedin ? {
              href: member.linkedin,
              target: "_blank",
              rel: "noopener noreferrer"
            } : {};

            return (
              <CardWrapper 
                key={idx}
                {...(wrapperProps as any)}
                className={`p-6 rounded-xl border-4 transition-all duration-200 group flex flex-col justify-between relative overflow-hidden cursor-pointer block ${
                  member.name === "Daniyal Siddique"
                    ? "border-blue-500 dark:border-blue-500 bg-white dark:bg-slate-950 shadow-[6px_6px_0px_#3b82f6] hover:bg-slate-50 dark:hover:bg-slate-900 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_#3b82f6] active:shadow-none active:translate-y-[6px] active:translate-x-[6px] z-10"
                    : "border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-[6px_6px_0px_#cbd5e1] dark:shadow-[6px_6px_0px_#1e293b] hover:bg-slate-50 dark:hover:bg-slate-900 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_#cbd5e1] dark:hover:shadow-[8px_8px_0px_#1e293b] active:shadow-none active:translate-y-[6px] active:translate-x-[6px]"
                }`}
              >
                <div>
                  {/* Top row — initials + icon */}
                  <div className="flex justify-between items-start mb-6 relative">
                    <div className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center font-mono text-sm font-black transition-all duration-300 shadow-inner ${
                      member.name === "Daniyal Siddique"
                        ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                    }`}>
                      {member.avatarInitials}
                    </div>
                    
                    <div className="flex-1" />
                    <div className={`w-10 h-10 border-2 rounded-lg flex items-center justify-center transition-all duration-300 shadow-inner ${
                      member.name === "Daniyal Siddique"
                        ? "bg-blue-600 dark:bg-blue-600 border-blue-700 dark:border-blue-700 text-white"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:border-blue-500/50"
                    }`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Name and Role */}
                  <h3 className="font-mono text-[16px] font-black text-slate-800 dark:text-slate-100 mb-2 uppercase tracking-widest">
                    {member.name}
                  </h3>
                  <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 font-bold">
                    {member.role}
                  </div>

                  {/* Divider */}
                  <div className={`h-1 w-12 rounded-full mb-6 ${
                    member.name === "Daniyal Siddique" ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-800"
                  }`} />

                  {/* Contributions */}
                  <div>
                    <div className="font-mono text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase mb-4">
                      Contributions
                    </div>
                    <ul className="space-y-3 font-mono text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      {member.contributions.map((item, cidx) => (
                        <li key={cidx} className="flex gap-3 items-start">
                          <span className="text-slate-300 dark:text-slate-700 mt-0.5 shrink-0">—</span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardWrapper>
            );
          })}
        </div>

      </div>
    </section>
  );
}
