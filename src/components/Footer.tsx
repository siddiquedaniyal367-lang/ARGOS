"use client";

import React from "react";
import { Terminal, Mail, ShieldAlert, Cpu } from "lucide-react";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function Footer() {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navLinks = [
    { label: "Overview", id: "about" },
    { label: "Prototype", id: "simulation" },
    { label: "Architecture", id: "architecture" },
    { label: "Timeline", id: "timeline" },
    { label: "Team", id: "team" },
    { label: "Specifications", id: "specs" },
    { label: "Gallery", id: "gallery" }
  ];

  const teamList = [
    "Daniyal Siddique",
    "Rishab Soni",
    "Adarsh Jha",
    "Paras",
    "Raj Shukla"
  ];

  return (
    <footer className="relative bg-bg-dark border-t border-border-card pt-16 pb-8">
      <div className="absolute inset-0 tech-grid-fine opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Logo & Tagline */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded bg-accent flex items-center justify-center text-bg-dark font-mono font-bold text-xs">
                A
              </div>
              <span className="font-mono text-base font-bold text-foreground tracking-wider">
                ARGOS
              </span>
            </div>
            <p className="text-xs text-foreground/50 leading-relaxed font-light mb-6">
              An intelligent CNC Laser Plotter System designed for precise 2D fabrication and rapid prototyping. "Engineering Precision Through Innovation."
            </p>
            <div className="flex gap-4">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-8 h-8 rounded border border-border-card bg-bg-card flex items-center justify-center text-foreground/60 hover:text-accent-yellow hover:border-accent-yellow/40 transition duration-200"
              >
                <GithubIcon className="w-4 h-4" />
              </a>
              <a 
                href="mailto:contact@argos.cnc" 
                className="w-8 h-8 rounded border border-border-card bg-bg-card flex items-center justify-center text-foreground/60 hover:text-accent-yellow hover:border-accent-yellow/40 transition duration-200"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="lg:col-span-2">
            <h4 className="font-mono text-[10px] text-accent-yellow tracking-widest uppercase mb-4">
              NAVIGATION
            </h4>
            <ul className="space-y-2 text-xs font-light text-foreground/60">
              {navLinks.map((link) => (
                <li key={link.id}>
                  <button 
                    onClick={() => scrollToSection(link.id)}
                    className="hover:text-accent transition duration-200 cursor-pointer"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Team Members List */}
          <div className="lg:col-span-2">
            <h4 className="font-mono text-[10px] text-accent-yellow tracking-widest uppercase mb-4">
              ENGINEERING TEAM
            </h4>
            <ul className="space-y-2 text-xs font-light text-foreground/60">
              {teamList.map((name, idx) => (
                <li key={idx} className="font-mono text-[11px]">
                  {name}
                </li>
              ))}
            </ul>
          </div>

          {/* Docs / Downloads */}
          <div className="lg:col-span-2">
            <h4 className="font-mono text-[10px] text-accent-yellow tracking-widest uppercase mb-4">
              DOCUMENTATION
            </h4>
            <ul className="space-y-2 text-xs font-light text-foreground/60 font-mono text-[11px]">
              <li>
                <a href="#timeline" className="hover:text-accent transition duration-200">
                  G-code Specs.txt
                </a>
              </li>
              <li>
                <a href="#specs" className="hover:text-accent transition duration-200">
                  GRBL Config.json
                </a>
              </li>
              <li>
                <a href="#architecture" className="hover:text-accent transition duration-200">
                  Circuit Schematics.pdf
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-accent transition duration-200">
                  CNC Assembly Guide.md
                </a>
              </li>
            </ul>
          </div>

          {/* Telemetry Block */}
          <div className="lg:col-span-2">
            <h4 className="font-mono text-[10px] text-accent-yellow tracking-widest uppercase mb-4">
              SYSTEM CONSOLE
            </h4>
            <div className="p-3.5 rounded-lg border border-border-card bg-bg-card font-mono text-[9px] text-foreground/45 space-y-1.5">
              <div className="flex justify-between">
                <span>STATUS:</span>
                <span className="text-emerald-500 font-bold">ONLINE</span>
              </div>
              <div className="flex justify-between">
                <span>PORT:</span>
                <span className="text-foreground/75">COM3_USB</span>
              </div>
              <div className="flex justify-between">
                <span>IDE_LINK:</span>
                <span className="text-foreground/75">ACTIVE</span>
              </div>
            </div>
          </div>

        </div>

        {/* Divider */}
        <div className="h-[1px] bg-border-card/50 mb-8" />

        {/* Bottom copyright block */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] text-foreground/30">
          <div>
            © 2026 Project ARGOS. CNC XY Plotter Launch.
          </div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-accent" /> FOR EDUCATIONAL PROTOTYPING
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
