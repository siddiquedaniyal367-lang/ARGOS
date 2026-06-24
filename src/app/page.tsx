"use client";

import React, { useState, useEffect } from "react";
import { Sun, Moon, Download } from "lucide-react";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Simulation from "@/components/Simulation";
import Architecture from "@/components/Architecture";
import CNCBed from "@/components/CNCBed";
import ImageGenerator from "@/components/ImageGenerator";
import Timeline from "@/components/Timeline";
import Team from "@/components/Team";
import Specs from "@/components/Specs";
import FutureScope from "@/components/FutureScope";
import Footer from "@/components/Footer";
import { PlotterProvider } from "@/context/PlotterContext";
import { useArduino } from "@/hooks/useArduino";

export default function Home() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const arduino = useArduino();

  // Theme persistence
  useEffect(() => {
    const savedTheme = localStorage.getItem("argos-theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("argos-theme", "dark");
    }
  }, []);

  // Scroll-reveal: Intersection Observer for `.reveal` and `.stagger-children`
  useEffect(() => {
    const targets = document.querySelectorAll(".reveal, .stagger-children");
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            // Once visible, stop observing so animation only fires once
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("argos-theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <PlotterProvider>
    <div className="flex flex-col min-h-screen bg-bg-dark tech-grid animate-grid-flow text-foreground selection:bg-accent/30 selection:text-accent-bright">
      {/* Header / Navbar — ultra minimal */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-bg-dark/70 backdrop-blur-xl">
        <div className="max-w-screen-xl mx-auto px-8 md:px-16 lg:px-24 h-14 flex items-center justify-between">
          {/* Logo — wordmark only */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="w-1.5 h-1.5 rounded-full bg-foreground/60" />
            <span className="font-mono text-xs font-medium text-foreground/80 tracking-[0.18em] uppercase">
              Argos
            </span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8 font-mono text-[9px] tracking-[0.16em] text-foreground/35 uppercase">
            {[
              { label: "Overview",     id: "about" },
              { label: "Prototype",    id: "simulation" },
              { label: "Architecture", id: "architecture" },
              { label: "CNC Bed",      id: "cnc-bed" },
              { label: "AI Preview",   id: "ai-preview" },
              { label: "Process",      id: "timeline" },
              { label: "Team",         id: "team" },
            ].map(({ label, id }) => (
              <button
                key={id}
                onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
                className="hover:text-foreground/80 transition-colors duration-300 cursor-pointer"
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-5">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert("Downloading ARGOS IDE...");
              }}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 border-2 border-slate-800 dark:border-slate-200 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 text-[9px] font-black tracking-widest uppercase hover:bg-white dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200 transition-all shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#e2e8f0] active:shadow-none active:translate-y-[2px] active:translate-x-[2px] cursor-pointer"
            >
              <Download className="w-3 h-3" />
              Download IDE
            </a>

            <button
              onClick={toggleTheme}
              className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-300 cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Sections */}
      <main className="flex-grow pt-14">
        <Hero />
        <About />
        <Simulation theme={theme} />
        <Architecture arduino={arduino} />
        <CNCBed arduino={arduino} />
        <ImageGenerator />
        <Timeline />
        <Specs />
        <Team />
        <FutureScope />
      </main>

      <Footer />
    </div>
    </PlotterProvider>
  );
}
