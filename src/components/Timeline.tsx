"use client";

import React, { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";

export default function Timeline() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const milestones = [
    {
      week: "Week 01",
      phase: "Build",
      title: "Working Prototype",
      sub: "Mechanical · Electronics · Firmware",
      desc: "In a single intensive week, the team assembled the full CNC gantry frame, wired all stepper motor drivers and laser circuitry, flashed GRBL firmware, and ran the first successful end-to-end laser plot on the physical machine.",
      details: [
        "V-Slot frame assembly",
        "NEMA 17 & belt tensioning",
        "A4988 driver wiring",
        "GRBL firmware flash",
        "First live laser plot",
      ],
      accent: "completed",
    },
    {
      week: "Week 02",
      phase: "Refine",
      title: "Prototype Amelioration",
      sub: "Calibration · Software · Testing",
      desc: "Focused on systematic improvement — calibrating steps/mm constants, refining the G-code pipeline, improving laser focus alignment, and hardening the motion control software with endstop limits and safety interlocks.",
      details: [
        "Steps/mm calibration",
        "Endstop limit switches",
        "Laser focus alignment",
        "G-code interpreter tuning",
        "Repeat-precision testing",
      ],
      accent: "completed",
    },
    {
      week: "Week 03",
      phase: "Present",
      title: "Documentation & Pitching",
      sub: "Reports · Website · Presentation",
      desc: "Compiled all technical documentation, built this project website, and prepared the engineering pitch deck. Presented the working ARGOS system to the assessment panel, demonstrating live vector plot execution.",
      details: [
        "Technical report writing",
        "This website — designed & built",
        "Pitch deck preparation",
        "Live demo to assessors",
        "Q&A & project defence",
      ],
      accent: "final",
    },
  ];

  return (
    <section id="timeline" className="relative py-24 bg-transparent border-b border-border-card">

      <div className="max-w-5xl mx-auto px-6 relative z-10">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-20 reveal flex flex-col items-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-5 h-px bg-blue-500/50" />
            <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-blue-600 uppercase">
              Project Timeline
            </span>
            <div className="w-5 h-px bg-blue-500/50" />
          </div>
          <h2 className="font-mono text-4xl md:text-5xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-6 leading-tight uppercase">
            Built in 3 weeks.
          </h2>
          <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 mb-6 rounded-full overflow-hidden">
            <div className="w-1/3 h-full bg-blue-500 rounded-full" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-base leading-relaxed">
            From an empty workbench to a fully calibrated, pitch-ready CNC Laser Plotter — delivered in three focused sprints.
          </p>
        </div>

        {/* Timeline Track */}
        <div className="relative border-l border-foreground/[0.08] ml-4 md:ml-32 pl-8 md:pl-12 space-y-10 stagger-children">

          {milestones.map((item, idx) => {
            const isHovered = hoveredIndex === idx;
            const isFinal = item.accent === "final";

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="relative group transition-all duration-300"
              >
                {/* Timeline node */}
                <div className="absolute left-[-41px] md:left-[-57px] top-2 z-20">
                  <div className={`w-[18px] h-[18px] md:w-[20px] md:h-[20px] rounded-full border bg-bg-dark flex items-center justify-center transition-all duration-400 ${
                    isHovered
                      ? "border-foreground/60"
                      : "border-foreground/15 group-hover:border-foreground/35"
                  }`}>
                    {isFinal ? (
                      <CheckCircle2 className={`w-3 h-3 md:w-3.5 md:h-3.5 transition-colors duration-300 ${isHovered ? "text-foreground/80" : "text-foreground/35"}`} />
                    ) : (
                      <Circle className={`w-1.5 h-1.5 md:w-2 md:h-2 transition-colors duration-300 ${isHovered ? "text-foreground/70 fill-foreground/60" : "text-foreground/25 fill-foreground/08"}`} />
                    )}
                  </div>
                </div>

                {/* Week + phase label (desktop — left of line) */}
                <div className="absolute left-[-190px] top-1.5 hidden md:flex flex-col items-end gap-0.5 w-28 text-right">
                  <span className="font-mono text-[10px] font-semibold text-foreground/70 tracking-[0.1em]">
                    {item.week}
                  </span>
                  <span className="font-mono text-[8px] text-foreground/30 tracking-[0.15em] uppercase">
                    {item.phase}
                  </span>
                </div>

                {/* Mobile week label */}
                <div className="md:hidden flex items-center gap-2 mb-2">
                  <span className="font-mono text-[10px] font-semibold text-foreground/60 tracking-widest">
                    {item.week}
                  </span>
                  <span className="font-mono text-[8px] text-foreground/30 uppercase tracking-wider">
                    · {item.phase}
                  </span>
                </div>

                {/* Content Card */}
                <div className={`p-6 rounded-xl border-4 transition-all duration-200 cursor-pointer ${
                  isHovered
                    ? "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shadow-[8px_8px_0px_#cbd5e1] dark:shadow-[8px_8px_0px_#1e293b] -translate-y-1 -translate-x-1"
                    : "border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-[6px_6px_0px_#cbd5e1] dark:shadow-[6px_6px_0px_#1e293b]"
                } active:shadow-none active:translate-y-[6px] active:translate-x-[6px]`}>
                  <h3 className="font-mono text-xl font-black text-slate-800 dark:text-slate-100 mb-2 uppercase tracking-widest">
                    {item.title}
                  </h3>
                  <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 font-bold">
                    {item.sub}
                  </div>

                  <p className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed mb-6 max-w-2xl">
                    {item.desc}
                  </p>

                  {/* Deliverable tags */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {item.details.map((detail, didx) => (
                      <span
                        key={didx}
                        className="px-3 py-1.5 rounded-md border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wide"
                      >
                        {detail}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            );
          })}

        </div>

        {/* Footer note */}
        <div className="mt-16 ml-4 md:ml-32 pl-8 md:pl-12 reveal">
          <p className="font-mono text-[9px] text-foreground/25 tracking-[0.18em] uppercase">
            Total project duration — 3 weeks · Team of 5 engineers
          </p>
        </div>

      </div>
    </section>
  );
}
