"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Download, RefreshCw, Cpu, ImageIcon, AlertCircle, X, Send, FileCode2, Maximize } from "lucide-react";
import { usePlotter } from "@/context/PlotterContext";

const EXAMPLE_PROMPTS = [
  "A geometric mandala pattern",
  "Mountain landscape silhouette",
  "Mechanical gear assembly",
  "Circuit board topology",
  "Arabic calligraphy of the word 'ARGOS'",
  "Architectural floor plan grid",
];

export default function ImageGenerator() {
  const { setPlotterImage, cutW, setCutW, cutH, setCutH } = usePlotter();
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPrompt = sessionStorage.getItem("argos_prompt");
      const storedUrl = sessionStorage.getItem("argos_image_url");
      if (storedPrompt) setPrompt(storedPrompt);
      if (storedUrl) setImageUrl(storedUrl);
    }
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentExample, setCurrentExample] = useState(0);
  const [placeholder, setPlaceholder] = useState(EXAMPLE_PROMPTS[0]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Cycle placeholder examples
  useEffect(() => {
    const id = setInterval(() => {
      setCurrentExample((prev) => {
        const next = (prev + 1) % EXAMPLE_PROMPTS.length;
        setPlaceholder(EXAMPLE_PROMPTS[next]);
        return next;
      });
    }, 2800);
    return () => clearInterval(id);
  }, []);

  const generate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Generation failed. Please try again.");
      } else {
        setImageUrl(data.image);
        // Persist for HMR survival
        if (typeof window !== "undefined") {
          sessionStorage.setItem("argos_image_url", data.image);
          sessionStorage.setItem("argos_prompt", trimmed);
        }
      }
    } catch {
      setError("Network error. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      generate();
    }
  };

  const downloadImage = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `argos-plotter-preview-${Date.now()}.png`;
    a.click();
  };

  const exportGCode = () => {
    if (!imageUrl) return;
    
    // Generate a raster scan G-code toolpath representing the image footprint
    let gcode = "; ARGOS CNC Laser Plotter\n";
    gcode += `; Generated Toolpath: AI Image Raster Scan\n`;
    gcode += `; Prompt: ${prompt}\n\n`;
    gcode += "G21 ; Set units to millimeters\n";
    gcode += "G90 ; Absolute positioning mode\n";
    gcode += "M5 ; Ensure laser is off\n";
    gcode += "G0 X0 Y0 F3000 ; Home carriage\n\n";

    gcode += "; -- Raster Scan Passes --\n";
    const size = 500; // 500mm x 500mm plot area
    const rows = 80;
    const cols = 60;
    
    for (let r = 0; r <= rows; r++) {
      const y = (r / rows) * size;
      const leftToRight = r % 2 === 0;
      
      // Fast move to start of line
      const startX = leftToRight ? 0 : size;
      gcode += `G0 X${startX.toFixed(1)} Y${y.toFixed(1)} F3000\n`;
      gcode += `M3 S85 ; Laser ON (85% power)\n`;
      
      for (let c = 0; c <= cols; c++) {
        const t = leftToRight ? c / cols : 1 - c / cols;
        const x = t * size;
        gcode += `G1 X${x.toFixed(1)} Y${y.toFixed(1)} F1200 S85\n`;
      }
      gcode += `M5 ; Laser OFF\n\n`;
    }
    
    gcode += "G0 X0 Y0 F3000 ; Return home\n";
    gcode += "M2 ; End of program\n";

    const blob = new Blob([gcode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `argos-plotter-ai-cut-${Date.now()}.gcode`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendToPlotter = () => {
    if (!imageUrl) return;
    setPlotterImage(imageUrl);
    document.getElementById("simulation")?.scrollIntoView({ behavior: "smooth" });
  };

  const clearImage = () => {
    setImageUrl(null);
    setPrompt("");
    setError(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("argos_image_url");
      sessionStorage.removeItem("argos_prompt");
    }
  };

  const useExample = (ex: string) => {
    setPrompt(ex);
    textareaRef.current?.focus();
  };

  return (
    <section
      id="ai-preview"
      ref={sectionRef}
      className="relative py-24 md:py-32 px-8 md:px-16 lg:px-24 overflow-hidden"
    >
      {/* Background grid */}

      {/* Subtle radial vignette */}

      <div className="relative max-w-screen-xl mx-auto">

        {/* Section header */}
        <div className="reveal mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-5 h-px bg-orange-500/50" />
              <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-orange-600 uppercase">
                AI Vision
              </span>
            </div>
            <h2 className="font-mono text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              AI Plotter Preview
            </h2>
            <div className="w-12 h-1 bg-white/60 dark:bg-slate-800 mt-4 rounded-full overflow-hidden">
              <div className="w-1/3 h-full bg-orange-500 rounded-full" />
            </div>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed font-medium">
              Describe anything — AI converts your idea into a pure outline render optimised
              for CNC laser plotting. What you see is what ARGOS draws.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Left — prompt panel */}
          <div className="reveal reveal-left flex flex-col gap-5">

            {/* Input card */}
            <div className="bg-slate-100 dark:bg-slate-900 border-4 border-slate-300 dark:border-slate-800 rounded-xl p-6 shadow-[8px_8px_0px_rgba(15,23,42,0.1)] dark:shadow-[8px_8px_0px_rgba(0,0,0,0.5)] relative overflow-hidden">
              <div className="absolute inset-0 opacity-15 dark:opacity-5 bg-[radial-gradient(#94a3b8_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />
              <div className="flex items-center gap-2 mb-6 relative z-10">
                <Cpu className="w-4 h-4 text-slate-800 dark:text-slate-200" />
                <h2 className="text-[11px] font-black tracking-widest uppercase text-slate-800 dark:text-slate-200">Prompt Input</h2>
              </div>

              <div className="relative z-10">
                <textarea
                  ref={textareaRef}
                  id="ai-prompt-input"
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`e.g. "${placeholder}"`}
                  className="w-full bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-800 rounded-md px-4 py-3 text-[12px] font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-0 transition-all shadow-inner mb-4"
                />

                <button
                  id="ai-generate-btn"
                  onClick={generate}
                  disabled={loading || !prompt.trim()}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-md border-2 border-blue-700 bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-[4px_4px_0px_#1e3a8a] active:shadow-none active:translate-y-1 active:translate-x-1"
                >
                  {loading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" />GENERATING…</>
                  ) : (
                    <><Sparkles className="w-4 h-4 fill-current" />GENERATE PREVIEW</>
                  )}
                </button>

                <p className="mt-4 text-center font-mono text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Press Enter ↵ to generate · Shift+Enter for new line
                </p>
              </div>
            </div>

            {/* Dimension settings */}
            <div className="bg-slate-100 dark:bg-slate-900 border-4 border-slate-300 dark:border-slate-800 rounded-xl p-6 shadow-[8px_8px_0px_rgba(15,23,42,0.1)] dark:shadow-[8px_8px_0px_rgba(0,0,0,0.5)] relative overflow-hidden">
              <div className="absolute inset-0 opacity-15 dark:opacity-5 bg-[radial-gradient(#94a3b8_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />
              <div className="flex items-center gap-2 mb-4 relative z-10">
                <Maximize className="w-4 h-4 text-slate-800 dark:text-slate-200" />
                <h2 className="text-[11px] font-black tracking-widest uppercase text-slate-800 dark:text-slate-200">Cut Dimensions</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Cut Width (mm)</label>
                  <input type="number" value={cutW} onChange={e => {
                    const w = Number(e.target.value);
                    if (w > 0) setCutW(w);
                  }} className="w-full bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-800 rounded-md py-2 px-3 text-[12px] font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 shadow-inner transition-colors" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Cut Height (mm)</label>
                  <input type="number" value={cutH} onChange={e => {
                    const h = Number(e.target.value);
                    if (h > 0) setCutH(h);
                  }} className="w-full bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-800 rounded-md py-2 px-3 text-[12px] font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 shadow-inner transition-colors" />
                </div>
              </div>
            </div>

            {/* Example prompts */}
            <div className="bg-slate-100 dark:bg-slate-900 border-4 border-slate-300 dark:border-slate-800 rounded-xl p-6 shadow-[8px_8px_0px_rgba(15,23,42,0.1)] dark:shadow-[8px_8px_0px_rgba(0,0,0,0.5)] relative overflow-hidden">
              <div className="absolute inset-0 opacity-15 dark:opacity-5 bg-[radial-gradient(#94a3b8_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />
              <p className="font-mono text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-4 relative z-10">
                Example prompts
              </p>
              <div className="flex flex-wrap gap-2 relative z-10">
                {EXAMPLE_PROMPTS.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => useExample(ex)}
                    className={`py-2 px-3 rounded-md border-2 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                      i === currentExample
                        ? "bg-slate-800 dark:bg-slate-700 border-slate-900 dark:border-slate-600 text-white shadow-none translate-y-1 translate-x-1"
                        : "bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400 shadow-[4px_4px_0px_#cbd5e1] dark:shadow-[4px_4px_0px_#1e293b] hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200 active:shadow-none active:translate-y-1 active:translate-x-1"
                    }`}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right — preview canvas */}
          <div className="reveal reveal-right">
            <div className="bg-slate-100 dark:bg-slate-900 border-4 border-slate-300 dark:border-slate-800 rounded-xl aspect-square relative shadow-[8px_8px_0px_rgba(15,23,42,0.1)] dark:shadow-[8px_8px_0px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300">

              {/* Top bar */}
              <div className="flex items-center justify-between px-5 py-4 border-b-4 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm bg-orange-500" />
                  <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                    Plotter Preview Canvas
                  </span>
                </div>
                {imageUrl && (
                  <div className="flex items-center gap-2">
                    <button
                      id="ai-send-plotter-btn"
                      onClick={sendToPlotter}
                      title="Send to plotter simulation"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border-2 border-emerald-600 bg-emerald-500 text-white font-black text-[10px] tracking-widest uppercase hover:bg-emerald-400 transition-all cursor-pointer shadow-[2px_2px_0px_#047857] active:shadow-none active:translate-y-1 active:translate-x-1"
                    >
                      <Send className="w-3 h-3" />
                      Send to Plotter
                    </button>
                    
                    <button
                      id="ai-export-gcode-btn"
                      onClick={exportGCode}
                      title="Export G-Code"
                      className="flex items-center gap-1.5 p-2 rounded-md bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-cyan-600 dark:text-cyan-500 font-black hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-cyan-500 transition-all cursor-pointer shadow-[2px_2px_0px_#cbd5e1] dark:shadow-[2px_2px_0px_#1e293b] active:shadow-none active:translate-y-1 active:translate-x-1"
                    >
                      <FileCode2 className="w-4 h-4" />
                    </button>

                    <button
                      id="ai-download-btn"
                      onClick={downloadImage}
                      title="Download Image (PNG)"
                      className="flex items-center gap-1.5 p-2 rounded-md bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-all cursor-pointer shadow-[2px_2px_0px_#cbd5e1] dark:shadow-[2px_2px_0px_#1e293b] active:shadow-none active:translate-y-1 active:translate-x-1"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      id="ai-clear-btn"
                      onClick={clearImage}
                      title="Clear Preview"
                      className="flex items-center gap-1.5 p-2 rounded-md bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-500 transition-all cursor-pointer shadow-[2px_2px_0px_#cbd5e1] dark:shadow-[2px_2px_0px_#1e293b] active:shadow-none active:translate-y-1 active:translate-x-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Canvas area */}
              <div className="absolute inset-0 top-[41px] flex items-center justify-center">

                {/* Loading state */}
                {loading && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-12 h-12">
                      <div className="absolute inset-0 border-4 border-orange-500/30 rounded-full animate-ping" />
                      <div className="absolute inset-1 border-4 border-orange-500 rounded-full animate-spin border-t-transparent" style={{ animationDuration: "1s" }} />
                      <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-orange-600" />
                    </div>
                    <p className="font-mono text-[11px] font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase animate-pulse">
                      AI IS RENDERING… (~15S)
                    </p>
                  </div>
                )}

                {/* Error state */}
                {!loading && error && (
                  <div className="flex flex-col items-center gap-4 px-8 text-center bg-red-100 dark:bg-red-900/50 p-6 rounded-xl border-4 border-red-300 dark:border-red-800 shadow-[8px_8px_0px_rgba(220,38,38,0.2)]">
                    <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    <p className="font-mono text-[11px] font-black text-red-700 dark:text-red-300 uppercase tracking-widest leading-relaxed">{error}</p>
                    <button
                      onClick={generate}
                      className="mt-2 py-2 px-4 rounded-md border-2 border-red-300 dark:border-red-800 bg-white dark:bg-slate-950 text-red-700 dark:text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/50 transition-all cursor-pointer shadow-[4px_4px_0px_#fca5a5] dark:shadow-[4px_4px_0px_rgba(220,38,38,0.5)] active:shadow-none active:translate-y-1 active:translate-x-1"
                    >
                      TRY AGAIN
                    </button>
                  </div>
                )}

                {/* Generated image — outline filter: high contrast + grayscale to strip fills */}
                {!loading && !error && imageUrl && (
                  <img
                    src={imageUrl}
                    alt="AI-generated plotter preview"
                    className="w-full h-full object-contain p-4"
                    style={{
                      filter: "grayscale(1) contrast(6) brightness(1.2)",
                    }}
                  />
                )}

                {/* Empty state */}
                {!loading && !error && !imageUrl && (
                  <div className="flex flex-col items-center gap-4 text-center px-8 bg-white dark:bg-slate-950 p-8 rounded-xl border-4 border-slate-300 dark:border-slate-800 shadow-inner">
                    <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center mb-2 shadow-inner">
                      <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                    </div>
                    <p className="font-mono text-[11px] font-black text-slate-500 dark:text-slate-400 leading-relaxed tracking-widest uppercase">
                      YOUR AI-GENERATED PLOTTER
                      <br />PREVIEW WILL APPEAR HERE
                    </p>
                  </div>
                )}
              </div>

              {/* Scan line overlay (decorative) */}
              {loading && (
                <div
                  className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent pointer-events-none animate-scan"
                  style={{ top: "41px" }}
                />
              )}
            </div>

            {/* Powered-by badge */}
            <div className="mt-3 flex items-center justify-end gap-2 opacity-30">
              <span className="font-mono text-[8px] tracking-widest uppercase text-foreground/50">
                Powered by
              </span>
              <span className="font-mono text-[8px] tracking-widest uppercase text-foreground/70 font-semibold">
                Pollinations AI
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
