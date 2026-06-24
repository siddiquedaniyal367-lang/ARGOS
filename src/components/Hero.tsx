"use client";

import React, { useState } from "react";
import { ArrowDown, Heart, Plus, Info } from "lucide-react";

export default function Hero() {
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const acronymMap: Record<string, string> = {
    "A": "AUTONOMOUS",
    "R": "RESOURCE",
    "G": "GENERATION",
    "O": "OPERATION",
    "S": "SYSTEM"
  };

  return (
    <section className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white overflow-hidden font-sans flex flex-col justify-between selection:bg-indigo-600 selection:text-white">

      {/* --- DOTTED BACKGROUND --- */}
      {/* Increased opacity so the dots are more visible */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-60 dark:opacity-40 bg-[radial-gradient(#94a3b8_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#64748b_1.5px,transparent_1.5px)] [background-size:24px_24px]" />

      {/* Soft vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(248,250,252,0.95)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,6,23,0.95)_100%)] pointer-events-none z-0" />

      {/* --- RETRO BOUNDARIES WITH BUTTON EFFECT --- */}
      <div className="absolute inset-4 md:inset-8 z-20 pointer-events-none">
        {/* Main subtle border */}
        <div className="absolute inset-0 border-2 border-slate-300 dark:border-slate-800" />

        {/* Corner Brackets */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500" />

        {/* Tech text overlays with button effect */}
        <div className="absolute top-4 left-6 hidden md:block">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-sm text-[9px] font-mono tracking-[0.3em] text-indigo-600 dark:text-indigo-400 font-bold uppercase shadow-[4px_4px_0px_#cbd5e1] dark:shadow-[4px_4px_0px_#1e293b]">
            SYS.RDY // v1.0.4
          </div>
        </div>
        <div className="absolute bottom-4 right-6 hidden md:block">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-sm text-[9px] font-mono tracking-[0.3em] text-indigo-600 dark:text-indigo-400 font-bold uppercase shadow-[4px_4px_0px_#cbd5e1] dark:shadow-[4px_4px_0px_#1e293b]">
            REC // 00:00:00
          </div>
        </div>
        <div className="absolute bottom-4 left-6 hidden md:block">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-sm text-[9px] font-mono tracking-[0.3em] text-slate-500 dark:text-slate-400 font-bold uppercase shadow-[4px_4px_0px_#cbd5e1] dark:shadow-[4px_4px_0px_#1e293b]">
            [ARGOS_CORE_ONLINE]
          </div>
        </div>
      </div>

      {/* --- TOP NAVIGATION --- */}
      <header className="relative z-30 flex justify-between items-start px-8 md:px-16 py-12 w-full pointer-events-auto">
        {/* Left icons */}
        <div className="flex gap-3 items-center">
          <button className="w-12 h-8 bg-slate-200/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-full flex flex-col justify-center items-center gap-1 hover:bg-slate-300/50 dark:hover:bg-white/10 transition-all cursor-pointer">
            <span className="w-4 h-[1px] bg-slate-600 dark:bg-white" />
            <span className="w-4 h-[1px] bg-slate-600 dark:bg-white translate-x-1" />
          </button>
          <button className="w-8 h-8 rounded-full border border-slate-300 dark:border-white/10 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer">
            <Heart className="w-3.5 h-3.5 text-slate-600 dark:text-white" />
          </button>
        </div>

        {/* Center Title */}
        <div className="text-center tracking-tight leading-[1.1] mt-2">
          <h1 className="text-sm md:text-base font-bold text-indigo-600 dark:text-indigo-400 tracking-[0.3em] uppercase drop-shadow-[0_0_10px_rgba(79,70,229,0.3)] dark:drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]">
            Argos System
          </h1>
          <p className="text-[9px] md:text-[10px] text-slate-500 dark:text-white/50 tracking-[0.2em] uppercase mt-2">
            Intelligent CNC Laser Plotter
          </p>
        </div>

        {/* Right CTA */}
        <button
          onClick={() => scrollTo("simulation")}
          className="bg-indigo-600 text-white text-[9px] md:text-[10px] font-black tracking-[0.2em] px-6 py-3 border-2 border-indigo-900 dark:border-indigo-950 flex items-center gap-3 hover:bg-indigo-500 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_#312e81] dark:hover:shadow-[6px_6px_0px_#1e1b4b] active:shadow-none active:translate-y-[4px] active:translate-x-[4px] transition-all cursor-pointer uppercase shadow-[4px_4px_0px_#312e81] dark:shadow-[4px_4px_0px_#1e1b4b]"
        >
          View Prototype
          <Plus className="w-3 h-3 opacity-90" />
        </button>
      </header>

      {/* --- MASSIVE BRAND TYPOGRAPHY --- */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto z-10 overflow-hidden">
        <div className="flex gap-2 md:gap-4 lg:gap-6 mt-16">
          {Object.entries(acronymMap).map(([letter, fullWord]) => {
            const isActive = activeLetter === letter;
            return (
              <div
                key={letter}
                onClick={() => setActiveLetter(isActive ? null : letter)}
                className={`
                  relative cursor-pointer transition-all duration-300 ease-out select-none
                  text-[8rem] md:text-[14rem] lg:text-[20rem] font-sans font-black leading-none tracking-tighter
                  ${isActive
                    ? "text-indigo-600 dark:text-indigo-500 translate-y-4 [text-shadow:0px_0px_0px_transparent]"
                    : "text-slate-800 dark:text-slate-200 hover:-translate-y-2 [text-shadow:8px_8px_0px_#cbd5e1] dark:[text-shadow:8px_8px_0px_#334155]"}
                `}
              >
                {letter}

                {/* Full word reveal tag */}
                <div
                  className={`
                    absolute left-1/2 -translate-x-1/2 -bottom-8 md:-bottom-12 
                    bg-slate-900 dark:bg-indigo-950 border-2 border-slate-700 dark:border-indigo-800
                    text-white dark:text-indigo-200 px-4 py-2 rounded-md
                    text-xs md:text-sm font-mono tracking-widest uppercase font-bold
                    shadow-[4px_4px_0px_#334155] dark:shadow-[4px_4px_0px_#1e1b4b]
                    transition-all duration-300 ease-out
                    ${isActive ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95 pointer-events-none"}
                  `}
                >
                  {fullWord}
                </div>
              </div>
            );
          })}
        </div>

        {/* Instruction text */}
        <div className="mt-20 md:mt-24 flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[10px] md:text-xs font-mono font-bold tracking-widest uppercase animate-pulse">
          <Info className="w-4 h-4" />
          Click letters to decode
        </div>
      </div>

      {/* --- BOTTOM NAVIGATION --- */}
      <footer className="relative z-30 flex justify-between items-end px-8 md:px-16 py-12 w-full pb-16 pointer-events-auto">
        <div className="w-12" /> {/* Spacer */}

        {/* Scroll Arrow */}
        <button
          onClick={() => scrollTo("about")}
          className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center transition-all cursor-pointer group shadow-[4px_4px_0px_#cbd5e1] dark:shadow-[4px_4px_0px_#1e293b] hover:bg-slate-50 dark:hover:bg-slate-800 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[5px_5px_0px_#cbd5e1] dark:hover:shadow-[5px_5px_0px_#1e293b] active:shadow-none active:translate-y-[4px] active:translate-x-[4px]"
        >
          <ArrowDown className="w-5 h-5 text-slate-600 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
        </button>
      </footer>

    </section>
  );
}
