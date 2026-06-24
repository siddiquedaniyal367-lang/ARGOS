"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Laptop,
  Cpu,
  Cpu as DriverIcon,
  Zap,
  Settings,
  Flame as LaserIcon,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Terminal as ConsoleIcon,
  ShieldAlert
} from "lucide-react";
import { UseArduinoReturn } from "@/hooks/useArduino";
import ArduinoConnector from "@/components/ArduinoConnector";

// ==========================================
// 1. Software Control Layer Visualizer
// ==========================================
function SoftwareVisual() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(30); // scale: 10 to 100
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [gcodeLog, setGcodeLog] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Generate vector path coordinates (a complex gear-like shape)
  useEffect(() => {
    const pts = [];
    const centerX = 100;
    const centerY = 100;
    const baseRadius = 50;

    // Draw 8-point gear path
    for (let theta = 0; theta <= Math.PI * 2; theta += 0.05) {
      const gearOffset = 8 * Math.sin(theta * 8);
      const r = baseRadius + gearOffset;
      const x = centerX + r * Math.cos(theta);
      const y = centerY + r * Math.sin(theta);
      pts.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
    }
    setPoints(pts);
  }, []);

  // Animate path tracing and G-code generation
  useEffect(() => {
    if (!isPlaying || points.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIdx((prev) => {
        const next = (prev + 1) % points.length;

        // Translate coordinate bounds: grid of 200x200 mapping to 0..500 mm
        const mmX = Math.round((points[next].x / 200) * 500);
        const mmY = Math.round((points[next].y / 200) * 500);

        setGcodeLog((prevLog) => {
          const nextLog = [...prevLog, `G1 X${mmX.toFixed(1)} Y${mmY.toFixed(1)} F1800`];
          if (nextLog.length > 8) nextLog.shift();
          return nextLog;
        });

        return next;
      });
    }, (110 - speed)); // speed controls milliseconds delay

    return () => clearInterval(interval);
  }, [isPlaying, points, speed]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [gcodeLog]);

  return (
    <div className="flex flex-col h-full justify-between font-mono text-xs">
      <div className="flex justify-between items-center pb-3 border-b border-border-card/50 mb-3">
        <span className="text-[10px] text-accent font-bold uppercase tracking-wider">[ Path Vector &lt;&gt; G-code ]</span>
        <div className="flex gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-2 py-0.5 border border-border-card bg-bg-card rounded hover:border-accent text-[9px] cursor-pointer"
          >
            {isPlaying ? "PAUSE" : "TRACE"}
          </button>
          <button
            onClick={() => {
              setCurrentIdx(0);
              setGcodeLog([]);
            }}
            className="px-2 py-0.5 border border-border-card bg-bg-card rounded hover:border-accent-yellow text-[9px] cursor-pointer"
          >
            RESET
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch flex-grow">
        {/* SVG Drawing Canvas */}
        <div className="border border-border-card/60 bg-black/45 rounded-xl flex items-center justify-center p-3 relative h-48 md:h-auto min-h-[160px]">
          <svg className="w-full h-full max-w-[170px] max-h-[170px]" viewBox="0 0 200 200">
            {/* Background design coordinates grid */}
            <line x1="0" y1="100" x2="200" y2="100" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="100" y1="0" x2="100" y2="200" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="100" cy="100" r="50" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

            {/* Traced Vector Shape Outline */}
            <path
              d={points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z"}
              fill="none"
              stroke="var(--border-card)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />

            {/* Plotted Line Path Segment */}
            {points.length > 0 && (
              <path
                d={points.slice(0, currentIdx + 1).map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {/* Laser Focal Carriage Tip */}
            {points.length > 0 && currentIdx < points.length && (
              <g>
                <circle cx={points[currentIdx].x} cy={points[currentIdx].y} r="4.5" fill="var(--accent)" className="animate-ping" />
                <circle cx={points[currentIdx].x} cy={points[currentIdx].y} r="2.5" fill="var(--accent-bright)" />
              </g>
            )}
          </svg>
          <div className="absolute bottom-2 left-2 text-[8px] text-foreground/45">VECTOR_BOUNDS: X500_Y500</div>
        </div>

        {/* G-Code Serial Output Stream */}
        <div className="flex flex-col justify-between border border-border-card/60 bg-black/85 rounded-xl p-3 h-48 md:h-auto min-h-[160px]">
          <div className="text-[8px] text-foreground/40 pb-1.5 border-b border-border-card/30 flex justify-between font-mono">
            <span>SERIAL STREAM: /dev/ttyUSB0</span>
            <span className="text-accent animate-pulse">115200 BAUD</span>
          </div>

          <div
            ref={logContainerRef}
            className="flex-grow overflow-y-auto space-y-1 my-2 py-1 font-mono text-[9px] scrollbar-none"
          >
            {gcodeLog.length === 0 ? (
              <div className="text-foreground/35 italic py-4 text-center">Awaiting coordinate stream...</div>
            ) : (
              gcodeLog.map((line, idx) => (
                <div key={idx} className="flex justify-between text-accent-yellow/85">
                  <span className="text-foreground/30">N{1000 + idx * 10}</span>
                  <span className="flex-grow pl-3">{line}</span>
                  <span className="text-foreground/20">&gt; OK</span>
                </div>
              ))
            )}
          </div>

          <div className="bg-bg-dark/60 rounded px-2 py-1 text-[8.5px] text-foreground/50 border border-border-card/45">
            <div>FEEDRATE: 1800 mm/min</div>
            <div>STATUS: CONVERTING_COORDS</div>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-border-card/50 flex items-center gap-3">
        <span className="text-[9px] text-foreground/45 shrink-0">COMPILING SPEED:</span>
        <input
          type="range"
          min="10"
          max="100"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="flex-grow h-1 bg-border-card rounded-lg appearance-none cursor-pointer accent-accent"
        />
        <span className="text-[9px] text-foreground/60 w-8 text-right">{speed}%</span>
      </div>
    </div>
  );
}

// ==========================================
// 2. Arduino Controller Visualizer
// ==========================================
function ArduinoVisual({ isConnected }: { isConnected: boolean }) {
  const [alarm, setAlarm] = useState(false);
  const [queue, setQueue] = useState<string[]>(["G1 X12 Y45", "G1 X14 Y48", "G1 X18 Y50", "G1 X24 Y54"]);
  const [pulseCount, setPulseCount] = useState(0);

  useEffect(() => {
    if (alarm) return;
    const interval = setInterval(() => {
      setQueue((prev) => {
        const next = [...prev];
        next.shift();
        const randX = Math.round(10 + Math.random() * 80);
        const randY = Math.round(10 + Math.random() * 80);
        next.push(`G1 X${randX} Y${randY}`);
        return next;
      });
      setPulseCount((prev) => (prev + 1) % 4);
    }, 1500);

    return () => clearInterval(interval);
  }, [alarm]);

  return (
    <div className="flex flex-col h-full justify-between font-mono text-xs">
      <div className="flex justify-between items-center pb-3 border-b border-border-card/50 mb-3">
        <span className="text-[10px] text-accent font-bold uppercase tracking-wider">[ ATmega328P Logic Engine ]</span>
        <div className="flex items-center gap-2">
          {/* Hardware connection live badge */}
          {isConnected ? (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-green-500/40 bg-green-500/10 text-[8px] text-green-400 font-mono font-bold tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              CONNECTED
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-border-card bg-bg-dark text-[8px] text-foreground/30 font-mono tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
              NO DEVICE
            </span>
          )}
          <button
            onClick={() => {
              setAlarm(false);
              setQueue(["G1 X12 Y45", "G1 X14 Y48", "G1 X18 Y50", "G1 X24 Y54"]);
            }}
            className="px-2 py-0.5 border border-border-card bg-bg-card rounded hover:border-accent text-[9px] cursor-pointer"
          >
            RESET CHIP
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch flex-grow">
        {/* Arduino Controller Schematic */}
        <div className={`md:col-span-7 border rounded-xl p-4 flex flex-col justify-between transition-colors duration-300 relative overflow-hidden ${alarm ? "border-accent bg-accent/5" : "border-border-card bg-black/45"
          }`}>
          {/* Microcontroller core grid drawing */}
          <div className="flex flex-col items-center my-auto">
            {/* Chip outline */}
            <div className={`w-40 border-2 rounded-lg py-2 flex flex-col items-center justify-center relative transition-colors duration-300 ${alarm ? "border-accent bg-accent-dim/10" : "border-border-card bg-bg-card"
              }`}>
              <div className="font-bold text-[9px] text-foreground/40 mb-1">ATMEGA328P-PU</div>
              <div className="w-full flex justify-between px-3 text-[7px] text-foreground/45 border-t border-border-card/45 pt-1">
                <span>D2 (STEP)</span>
                <span>D3 (DIR)</span>
                <span>D11 (PWM)</span>
              </div>
              <div className="flex gap-1.5 mt-2">
                <span className={`w-1.5 h-1.5 rounded-full ${alarm ? "bg-accent animate-ping" : "bg-green-500 animate-pulse"}`} />
                <span className="text-[8px] font-bold">{alarm ? "ALARM" : "GRBL OK"}</span>
              </div>

              {/* Pins visualization */}
              <div className="absolute top-0 inset-x-4 flex justify-between transform -translate-y-1">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-1 h-1.5 bg-foreground/40 border border-border-card/30" />
                ))}
              </div>
              <div className="absolute bottom-0 inset-x-4 flex justify-between transform translate-y-1">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-1 h-1.5 bg-foreground/40 border border-border-card/30" />
                ))}
              </div>
            </div>

            {/* Stepper pulses flow */}
            <div className="flex items-center gap-1.5 mt-5 text-[8.5px] w-full px-4 justify-between">
              <span className="text-foreground/40">STEP PULSE:</span>
              <div className="flex-grow h-1.5 border border-border-card/30 bg-black/35 rounded overflow-hidden relative mx-2">
                {!alarm && (
                  <div
                    className="absolute h-full w-2 bg-accent-yellow transition-all duration-300"
                    style={{ left: `${pulseCount * 30}%` }}
                  />
                )}
              </div>
              <span className="text-accent-yellow font-bold tracking-widest uppercase">{alarm ? "OFF" : "PULSING"}</span>
            </div>
          </div>

          <div className="absolute bottom-2 left-2 text-[8px] text-foreground/40">FW: GRBL_v1.1h</div>
        </div>

        {/* Register Buffer and Limit Switches */}
        <div className="md:col-span-5 flex flex-col justify-between gap-3">
          {/* Buffer Stack */}
          <div className="border border-border-card/60 bg-black/85 rounded-xl p-3 flex-grow flex flex-col justify-between">
            <span className="text-[8px] text-foreground/40 border-b border-border-card/30 pb-1 flex justify-between">
              <span>FIFO INPUT BUFFER</span>
              <span className={alarm ? "text-accent" : "text-green-400"}>{alarm ? "0%" : "96%"}</span>
            </span>
            <div className="space-y-1 my-2 flex-grow justify-end flex flex-col font-mono text-[9px]">
              {alarm ? (
                <div className="text-accent flex items-center justify-center gap-1 my-auto animate-pulse">
                  <ShieldAlert className="w-4 h-4" /> CHIP STATE LOCKED
                </div>
              ) : (
                queue.map((cmd, idx) => (
                  <div key={idx} className="flex justify-between items-center opacity-80 py-0.5 border-b border-border-card/10">
                    <span className="text-foreground/30">N_BUF[0{idx}]</span>
                    <span className="text-accent-yellow-bright">{cmd}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Limits switches */}
          <div className="border border-border-card/60 bg-bg-card rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[8px] text-foreground/40 mb-2 uppercase">[ Safety Limits ]</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setAlarm(true);
                }}
                className={`py-1.5 rounded border text-[9px] font-bold cursor-pointer transition-colors ${alarm ? "bg-accent/25 border-accent text-accent-bright" : "border-border-card hover:border-accent hover:text-accent bg-bg-dark"
                  }`}
              >
                LIMIT_X SWITCH
              </button>
              <button
                onClick={() => {
                  setAlarm(true);
                }}
                className={`py-1.5 rounded border text-[9px] font-bold cursor-pointer transition-colors ${alarm ? "bg-accent/25 border-accent text-accent-bright" : "border-border-card hover:border-accent hover:text-accent bg-bg-dark"
                  }`}
              >
                LIMIT_Y SWITCH
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. Motor Driver Visualizer
// ==========================================
function DriverVisual() {
  const [microstep, setMicrostep] = useState<1 | 2 | 4 | 8 | 16>(1);
  const [phaseOffset, setPhaseOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhaseOffset((prev) => (prev + 0.1) % (Math.PI * 2));
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // Compute oscilloscope coordinate path based on microstep divisions
  const getSinePoints = (offset: number, isCos = false) => {
    const segments = 120;
    const points = [];
    const amplitude = 30;
    const centerY = 50;
    const stepCount = microstep;

    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * 200;
      const angle = (i / segments) * Math.PI * 4 + offset;

      // Quantize based on step count
      let currentVal = isCos ? Math.cos(angle) : Math.sin(angle);

      if (stepCount < 16) {
        // Approximate microstepping waveforms
        currentVal = Math.round(currentVal * stepCount) / stepCount;
      }

      const y = centerY - currentVal * amplitude;
      points.push(`${i === 0 ? "M" : "L"} ${x} ${y}`);
    }
    return points.join(" ");
  };

  return (
    <div className="flex flex-col h-full justify-between font-mono text-xs">
      <div className="flex justify-between items-center pb-3 border-b border-border-card/50 mb-3">
        <span className="text-[10px] text-accent font-bold uppercase tracking-wider">[ A4988 Microstepping H-Bridge ]</span>
        <span className="text-[9px] text-foreground/45 font-bold">PWM AMPLIFICATION</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch flex-grow">
        {/* Oscilloscope Canvas */}
        <div className="md:col-span-8 border border-border-card/60 bg-black/85 rounded-xl p-3 flex flex-col justify-between min-h-[160px] relative overflow-hidden">
          <div className="text-[8px] text-foreground/40 border-b border-border-card/30 pb-1.5 flex justify-between">
            <span>OSCILLOSCOPE: Core Waveforms</span>
            <span className="text-accent">PHASE_A (RED) | PHASE_B (YELLOW)</span>
          </div>

          <div className="flex-grow w-full flex items-center justify-center py-2">
            <svg className="w-full h-full max-h-[110px]" viewBox="0 0 200 100">
              {/* Grid Background */}
              <line x1="0" y1="50" x2="200" y2="50" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              {[25, 50, 75, 100, 125, 150, 175].map((x) => (
                <line key={x} x1={x} y1="0" x2={x} y2="100" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="2 2" />
              ))}
              {[20, 80].map((y) => (
                <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="2 2" />
              ))}

              {/* Sine Wave (Phase A) */}
              <path
                d={getSinePoints(phaseOffset, false)}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Cosine Wave (Phase B) */}
              <path
                d={getSinePoints(phaseOffset, true)}
                fill="none"
                stroke="var(--accent-yellow)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="text-[8px] text-foreground/35 border-t border-border-card/20 pt-1.5 flex justify-between">
            <span>TIMEBASE: 5.0ms / DIV</span>
            <span>AMPLITUDE: 1.2A / DIV</span>
          </div>
        </div>

        {/* Microstepping Control Panel */}
        <div className="md:col-span-4 flex flex-col justify-between border border-border-card/60 bg-bg-card rounded-xl p-3">
          <div>
            <span className="text-[8.5px] text-foreground/45 uppercase tracking-wider block mb-3">
              MICROSTEP MODE
            </span>
            <div className="flex flex-col gap-2">
              {([1, 2, 4, 8, 16] as const).map((step) => (
                <button
                  key={step}
                  onClick={() => setMicrostep(step)}
                  className={`w-full py-1.5 px-3 rounded border text-[9px] font-bold font-mono transition duration-300 cursor-pointer ${microstep === step ?
                    "bg-accent border-accent text-bg-dark font-bold" :
                    "border-border-card bg-bg-dark text-foreground/50 hover:text-accent hover:border-accent/40"
                    }`}
                >
                  {step === 1 ? "FULL STEP" : `1/${step} MICROSTEP`}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[8px] text-foreground/40 mt-4 border-t border-border-card/50 pt-2 font-mono">
            <div>RESOLUTION: {200 * microstep} STEPS / ROTATION</div>
            <div>PWM SINE STIFFNESS: {(microstep * 6.25).toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. Stepper Motor Visualizer
// ==========================================
function StepperVisual() {
  const [angle, setAngle] = useState(0);
  const [speed, setSpeed] = useState(40); // rpm scaling: 1 to 100
  const [activeCoil, setActiveCoil] = useState(0);

  useEffect(() => {
    const stepInterval = (60 / (200 * speed)) * 1000;
    const interval = setInterval(() => {
      setAngle((prev) => (prev + 1.8) % 360);
      setActiveCoil((prev) => (prev + 1) % 4);
    }, Math.max(stepInterval, 16));

    return () => clearInterval(interval);
  }, [speed]);

  return (
    <div className="flex flex-col h-full justify-between font-mono text-xs">
      <div className="flex justify-between items-center pb-3 border-b border-border-card/50 mb-3">
        <span className="text-[10px] text-accent font-bold uppercase tracking-wider">[ NEMA 17 Bipolar Actuator ]</span>
        <span className="text-[9px] text-foreground/45">1.8° STEP ANGLE</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch flex-grow">
        {/* Motor cross-section diagram */}
        <div className="md:col-span-7 border border-border-card/60 bg-black/45 rounded-xl p-3 flex items-center justify-center min-h-[160px]">
          <svg className="w-full h-full max-w-[140px] max-h-[140px]" viewBox="0 0 120 120">
            {/* Stator Shell */}
            <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
            <circle cx="60" cy="60" r="54" fill="none" stroke="var(--border-card)" strokeWidth="1.5" />

            {/* Coil A1 (Top) */}
            <g>
              <rect x="52" y="10" width="16" height="15" fill={activeCoil === 0 ? "var(--accent-dim)" : "none"} stroke="var(--border-card)" strokeWidth="1" rx="1" />
              <path d="M52 14 H68 M52 18 H68 M52 22 H68" stroke={activeCoil === 0 ? "var(--accent)" : "rgba(255,255,255,0.1)"} strokeWidth="1" />
              <text x="60" y="21" textAnchor="middle" fontSize="6" fill={activeCoil === 0 ? "var(--accent)" : "rgba(255,255,255,0.4)"} className="font-bold">A1</text>
            </g>

            {/* Coil B1 (Right) */}
            <g>
              <rect x="95" y="52" width="15" height="16" fill={activeCoil === 1 ? "var(--accent-yellow-dim)" : "none"} stroke="var(--border-card)" strokeWidth="1" rx="1" />
              <path d="M99 52 V68 M103 52 V68 M107 52 V68" stroke={activeCoil === 1 ? "var(--accent-yellow)" : "rgba(255,255,255,0.1)"} strokeWidth="1" />
              <text x="103" y="62" textAnchor="middle" fontSize="6" fill={activeCoil === 1 ? "var(--accent-yellow)" : "rgba(255,255,255,0.4)"} className="font-bold">B1</text>
            </g>

            {/* Coil A2 (Bottom) */}
            <g>
              <rect x="52" y="95" width="16" height="15" fill={activeCoil === 2 ? "var(--accent-dim)" : "none"} stroke="var(--border-card)" strokeWidth="1" rx="1" />
              <path d="M52 99 H68 M52 103 H68 M52 107 H68" stroke={activeCoil === 2 ? "var(--accent)" : "rgba(255,255,255,0.1)"} strokeWidth="1" />
              <text x="60" y="105" textAnchor="middle" fontSize="6" fill={activeCoil === 2 ? "var(--accent)" : "rgba(255,255,255,0.4)"} className="font-bold">A2</text>
            </g>

            {/* Coil B2 (Left) */}
            <g>
              <rect x="10" y="52" width="15" height="16" fill={activeCoil === 3 ? "var(--accent-yellow-dim)" : "none"} stroke="var(--border-card)" strokeWidth="1" rx="1" />
              <path d="M13 52 V68 M17 52 V68 M21 52 V68" stroke={activeCoil === 3 ? "var(--accent-yellow)" : "rgba(255,255,255,0.1)"} strokeWidth="1" />
              <text x="17" y="62" textAnchor="middle" fontSize="6" fill={activeCoil === 3 ? "var(--accent-yellow)" : "rgba(255,255,255,0.4)"} className="font-bold">B2</text>
            </g>

            {/* Rotating Rotor gear */}
            <g transform={`rotate(${angle}, 60, 60)`}>
              <circle cx="60" cy="60" r="26" fill="rgba(255,255,255,0.02)" stroke="var(--border-card)" strokeWidth="1.5" />
              <circle cx="60" cy="60" r="14" fill="none" stroke="var(--border-card)" strokeWidth="0.8" />

              {/* Rotor Shaft slot */}
              <circle cx="60" cy="60" r="5" fill="var(--border-card)" />
              <rect x="58.5" y="52" width="3" height="16" fill="var(--border-card)" />

              {/* Rotor teeth divisions */}
              {[...Array(12)].map((_, i) => (
                <line
                  key={i}
                  x1="60"
                  y1="34"
                  x2="60"
                  y2="31"
                  stroke="var(--border-card)"
                  strokeWidth="1.5"
                  transform={`rotate(${i * 30}, 60, 60)`}
                />
              ))}
            </g>
          </svg>
        </div>

        {/* Coils Stats & RPM Slider */}
        <div className="md:col-span-5 flex flex-col justify-between border border-border-card/60 bg-bg-card rounded-xl p-3">
          <div>
            <span className="text-[8.5px] text-foreground/45 uppercase tracking-wider block mb-2">
              COIL LOGIC FEEDBACK
            </span>

            <div className="space-y-2 text-[9px] pt-1">
              <div className="flex justify-between items-center py-1 border-b border-border-card/25">
                <span className="text-foreground/45">ACTIVE COILS:</span>
                <span className={`font-bold font-mono ${activeCoil % 2 === 0 ? "text-accent" : "text-accent-yellow"}`}>
                  {activeCoil === 0 && "COIL_A1 (+)"}
                  {activeCoil === 1 && "COIL_B1 (+)"}
                  {activeCoil === 2 && "COIL_A2 (-)"}
                  {activeCoil === 3 && "COIL_B2 (-)"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border-card/25">
                <span className="text-foreground/45">ROTOR ANGLE:</span>
                <span className="font-semibold text-foreground font-mono">{angle.toFixed(1)}°</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border-card/25">
                <span className="text-foreground/45">HOLD TORQUE:</span>
                <span className="font-semibold text-foreground font-mono">4.2 kg·cm</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-border-card/50">
            <div className="flex justify-between text-[9px] mb-1.5">
              <span className="text-foreground/45">STEP FEED SPEED:</span>
              <span className="text-accent font-bold">{speed} RPM</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-full h-1 bg-border-card rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. Mechanical Gantry Visualizer
// ==========================================
function GantryVisual() {
  const [posX, setPosX] = useState(180); // scale 0 to 400 mm
  const [posY, setPosY] = useState(240); // scale 0 to 400 mm
  const [beltOffset, setBeltOffset] = useState(0);

  const prevXRef = useRef(180);
  const prevYRef = useRef(240);

  // Animate the timing belts offset as carriage moves
  useEffect(() => {
    const diffX = posX - prevXRef.current;
    const diffY = posY - prevYRef.current;

    if (diffX !== 0 || diffY !== 0) {
      setBeltOffset((prev) => (prev + Math.abs(diffX) + Math.abs(diffY)) % 100);
    }

    prevXRef.current = posX;
    prevYRef.current = posY;
  }, [posX, posY]);

  // Convert mm coordinate bounds to SVG drawing bounds (scale 15 to 135)
  const svgX = 15 + (posX / 400) * 105;
  const svgY = 15 + (posY / 400) * 105;

  return (
    <div className="flex flex-col h-full justify-between font-mono text-xs">
      <div className="flex justify-between items-center pb-3 border-b border-border-card/50 mb-3">
        <span className="text-[10px] text-accent font-bold uppercase tracking-wider">[ XY Cartesian Mechanical Frame ]</span>
        <span className="text-[9px] text-foreground/45">GT2 TIMING BELTS</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch flex-grow">
        {/* XY Layout Diagram */}
        <div className="md:col-span-7 border border-border-card/60 bg-black/45 rounded-xl p-3 flex items-center justify-center min-h-[160px]">
          <svg className="w-full h-full max-w-[145px] max-h-[145px]" viewBox="0 0 150 150">
            {/* Outer Gantry Frame rails */}
            <rect x="10" y="10" width="130" height="130" fill="none" stroke="var(--border-card)" strokeWidth="2" rx="2" />

            {/* Corner Pulleys */}
            <circle cx="15" cy="15" r="4.5" fill="var(--bg-card)" stroke="var(--border-card)" strokeWidth="1" />
            <circle cx="135" cy="15" r="4.5" fill="var(--bg-card)" stroke="var(--border-card)" strokeWidth="1" />
            <circle cx="15" cy="135" r="4.5" fill="var(--bg-card)" stroke="var(--border-card)" strokeWidth="1" />
            <circle cx="135" cy="135" r="4.5" fill="var(--bg-card)" stroke="var(--border-card)" strokeWidth="1" />

            {/* CoreXY/Cartesian Belt loops representation (glowing dash paths) */}
            <g opacity="0.3">
              <path
                d={`M 15 15 L 135 15 L 135 135 L 15 135 Z`}
                fill="none"
                stroke="var(--accent-yellow)"
                strokeWidth="1"
                strokeDasharray="4 4"
                strokeDashoffset={beltOffset * 0.4}
              />
              <path
                d={`M 15 135 L 15 15 L 135 15`}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.2"
                strokeDasharray="4 4"
                strokeDashoffset={-beltOffset * 0.4}
              />
            </g>

            {/* Horizontal X-Axis Rail moving vertically (Y-Axis position) */}
            <line
              x1="10"
              y1={svgY}
              x2="140"
              y2={svgY}
              stroke="var(--border-card)"
              strokeWidth="2.5"
            />
            {/* Dual support rods on horizontal rail */}
            <line x1="10" y1={svgY - 1.5} x2="140" y2={svgY - 1.5} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
            <line x1="10" y1={svgY + 1.5} x2="140" y2={svgY + 1.5} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />

            {/* Y Carriage assembly box moving horizontally (X-Axis position) */}
            <g transform={`translate(${svgX - 5}, ${svgY - 5})`}>
              <rect x="0" y="0" width="10" height="10" fill="var(--bg-card)" stroke="var(--accent)" strokeWidth="1.5" rx="1.5" />
              <circle cx="5" cy="5" r="1.5" fill="var(--accent-bright)" />
              {/* Laser beam spot preview */}
              <circle cx="5" cy="5" r="3.5" fill="none" stroke="var(--accent)" strokeWidth="0.5" className="animate-pulse" />
            </g>
          </svg>
        </div>

        {/* Jog controls / Coord metrics */}
        <div className="md:col-span-5 flex flex-col justify-between border border-border-card/60 bg-bg-card rounded-xl p-3">
          <div>
            <span className="text-[8.5px] text-foreground/45 uppercase tracking-wider block mb-3">
              MANUAL COORDINATE JOG
            </span>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[9px] mb-1 font-mono">
                  <span className="text-foreground/45">AXIS_X POSITION:</span>
                  <span className="text-accent font-bold">{posX} mm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="400"
                  value={posX}
                  onChange={(e) => setPosX(Number(e.target.value))}
                  className="w-full h-1 bg-border-card rounded-lg appearance-none cursor-pointer accent-accent"
                />
              </div>

              <div>
                <div className="flex justify-between text-[9px] mb-1 font-mono">
                  <span className="text-foreground/45">AXIS_Y POSITION:</span>
                  <span className="text-accent-yellow font-bold">{posY} mm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="400"
                  value={posY}
                  onChange={(e) => setPosY(Number(e.target.value))}
                  className="w-full h-1 bg-border-card rounded-lg appearance-none cursor-pointer accent-accent"
                />
              </div>
            </div>
          </div>

          <div className="text-[8px] text-foreground/40 mt-4 border-t border-border-card/50 pt-2 font-mono">
            <div>LINEAR LIMITS: 0.0 TO 400.0 mm</div>
            <div>BELT TENSION STATE: NOMINAL</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. Laser Module Visualizer
// ==========================================
function LaserVisual() {
  const [pwmDuty, setPwmDuty] = useState(70); // duty cycle %: 0 to 100
  const [focalLength, setFocalLength] = useState(45); // distance: 30 to 60 mm

  // Check if focus is correct (optimal target range 44-46mm)
  const isOptimalFocus = focalLength >= 44 && focalLength <= 46;

  // Generate PWM square wave coordinates based on duty cycle
  const getPwmWavePath = () => {
    const cycleWidth = 40;
    const highWidth = (pwmDuty / 100) * cycleWidth;
    const lowWidth = cycleWidth - highWidth;
    const topY = 10;
    const bottomY = 40;

    let path = `M 0 ${bottomY}`;
    let currentX = 0;

    for (let i = 0; i < 4; i++) {
      path += ` L ${currentX} ${topY}`;
      currentX += highWidth;
      path += ` L ${currentX} ${topY}`;
      path += ` L ${currentX} ${bottomY}`;
      currentX += lowWidth;
      path += ` L ${currentX} ${bottomY}`;
    }
    return path;
  };

  // SVG dimensions for optics:
  // Emitter at y=10
  // Lens is adjustable at focalLength value (represented as y-translation)
  const lensY = 15 + (focalLength - 30) * 1.5;
  const surfaceY = 105;

  return (
    <div className="flex flex-col h-full justify-between font-mono text-xs">
      <div className="flex justify-between items-center pb-3 border-b border-border-card/50 mb-3">
        <span className="text-[10px] text-accent font-bold uppercase tracking-wider">[ 450nm Blue Laser Focal Mechanics ]</span>
        <span className="text-[9px] text-foreground/45">3.5W OPTICAL DIODE</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch flex-grow">
        {/* Optic rays and surface spark */}
        <div className="md:col-span-7 border border-border-card/60 bg-black/85 rounded-xl p-3 flex items-center justify-center min-h-[160px] relative overflow-hidden">
          <svg className="w-full h-full max-w-[130px] max-h-[130px]" viewBox="0 0 100 120">
            {/* Diode housing structure */}
            <rect x="35" y="0" width="30" height="25" fill="var(--bg-card)" stroke="var(--border-card)" strokeWidth="1" />
            <line x1="38" y1="5" x2="62" y2="5" stroke="var(--border-card)" strokeWidth="1" />
            <line x1="38" y1="10" x2="62" y2="10" stroke="var(--border-card)" strokeWidth="1" />
            <line x1="38" y1="15" x2="62" y2="15" stroke="var(--border-card)" strokeWidth="1" />

            {/* Lens barrel sleeve (moves vertically with slider) */}
            <g transform={`translate(0, ${lensY - 20})`}>
              <rect x="40" y="0" width="20" height="12" fill="none" stroke="var(--accent-yellow)" strokeWidth="1" rx="0.5" />
              {/* Convex Lens symbol */}
              <path d="M 42 6 Q 50 1 58 6 Q 50 11 42 6 Z" fill="rgba(162,114,0,0.15)" stroke="var(--accent-yellow)" strokeWidth="1" />
            </g>

            {/* Workpiece surface plate */}
            <line x1="10" y1={surfaceY} x2="90" y2={surfaceY} stroke="var(--border-card)" strokeWidth="2.5" />
            <rect x="10" y={surfaceY} width="80" height="15" fill="rgba(255,255,255,0.03)" />

            {/* Laser light rays */}
            {pwmDuty > 0 && (
              <g>
                {/* Diode emitter to lens (Parallel rays) */}
                <polygon
                  points={`45,25 55,25 57,${lensY - 14} 43,${lensY - 14}`}
                  fill="rgba(255, 0, 60, 0.15)"
                />
                <line x1="45" y1="25" x2="45" y2={lensY - 14} stroke="var(--accent)" strokeWidth="1" opacity="0.8" />
                <line x1="55" y1="25" x2="55" y2={lensY - 14} stroke="var(--accent)" strokeWidth="1" opacity="0.8" />

                {/* Lens to Focal Point (Converging rays) */}
                {/* Focal point Y coordinate is lensY + focalLength (scaled) */}
                {/* If focus is correct, convergence point is exactly at surfaceY (105) */}
                <polygon
                  points={`43,${lensY - 14} 57,${lensY - 14} 50,${surfaceY}`}
                  fill="rgba(255, 0, 60, 0.25)"
                />

                {/* Ray vector borders */}
                <line x1="43" y1={lensY - 14} x2="50" y2={surfaceY} stroke="var(--accent-bright)" strokeWidth="1.2" />
                <line x1="57" y1={lensY - 14} x2="50" y2={surfaceY} stroke="var(--accent-bright)" strokeWidth="1.2" />
                <line x1="50" y1={lensY - 14} x2="50" y2={surfaceY} stroke="var(--accent-bright)" strokeWidth="1.5" strokeDasharray="2 2" />

                {/* Laser cutting spark spot at surface contact */}
                <circle
                  cx="50"
                  cy={surfaceY}
                  r={isOptimalFocus ? "4" : "1.8"}
                  fill="var(--accent-bright)"
                  className="animate-ping"
                  style={{ animationDuration: isOptimalFocus ? "0.6s" : "1.5s" }}
                />
                <circle
                  cx="50"
                  cy={surfaceY}
                  r={isOptimalFocus ? "2" : "0.8"}
                  fill="#ffffff"
                />
              </g>
            )}
          </svg>

          <div className="absolute bottom-2 left-2 text-[8px] text-foreground/45 flex items-center gap-1.5 font-mono">
            <span className={`w-1.5 h-1.5 rounded-full ${isOptimalFocus ? "bg-green-500 animate-pulse" : "bg-accent-yellow"}`} />
            {isOptimalFocus ? "OPTIMAL FOCUS" : "OUT OF FOCUS"}
          </div>
        </div>

        {/* PWM Duty cycle slider and Focal distance */}
        <div className="md:col-span-5 flex flex-col justify-between border border-border-card/60 bg-bg-card rounded-xl p-3">
          <div>
            <span className="text-[8px] text-foreground/40 block mb-2 uppercase">[ PWM Duty Waveform ]</span>
            <div className="border border-border-card/45 bg-black/60 rounded p-1.5 mb-4 overflow-hidden">
              <svg className="w-full h-12" viewBox="0 0 160 50">
                <path
                  d={getPwmWavePath()}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[9px] mb-1 font-mono">
                  <span className="text-foreground/45">PWM POWER LEVEL:</span>
                  <span className="text-accent font-bold">{pwmDuty}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={pwmDuty}
                  onChange={(e) => setPwmDuty(Number(e.target.value))}
                  className="w-full h-1 bg-border-card rounded-lg appearance-none cursor-pointer accent-accent"
                />
              </div>

              <div>
                <div className="flex justify-between text-[9px] mb-1 font-mono">
                  <span className="text-foreground/45">FOCAL HEIGHT:</span>
                  <span className="text-accent-yellow font-bold">{focalLength} mm</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="60"
                  value={focalLength}
                  onChange={(e) => setFocalLength(Number(e.target.value))}
                  className="w-full h-1 bg-border-card rounded-lg appearance-none cursor-pointer accent-accent"
                />
              </div>
            </div>
          </div>

          <div className="text-[8px] text-foreground/40 mt-4 border-t border-border-card/50 pt-2 font-mono">
            <div>IDEAL FOCUS RANGE: 44.0 - 46.0 mm</div>
            <div>STATUS: {pwmDuty === 0 ? "STANDBY" : isOptimalFocus ? "FABRICATING" : "DEFOCUSED"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Main Architecture Component
// ==========================================
export default function Architecture({ arduino }: { arduino: UseArduinoReturn }) {
  const [activeNode, setActiveNode] = useState<number>(0);

  const nodes = [
    {
      icon: Laptop,
      label: "Software Layer",
      sub: "ARGOS Control UI",
      desc: "Translates vector designs (SVG/DXF) into standard Cartesian G-code coordinates. Streams serialized data packages via Node.js serial port bindings to the hardware controller.",
      specs: ["G-code Parser", "115200 Baud Streaming", "Real-Time Dro Display"]
    },
    {
      icon: Cpu,
      label: "Arduino Controller",
      sub: "ATmega328P Core",
      desc: "Runs customized GRBL firmware. Translates serialized G-code instructions into hardware step and direction waveforms, managing acceleration profiling in real-time.",
      specs: ["GRBL CNC Firmware", "Step/Dir Waveform Generation", "Limit Switch Safety Checks"]
    },
    {
      icon: DriverIcon,
      label: "Motor Drivers",
      sub: "A4988 Microstepping",
      desc: "Receives logic pulses from Arduino and translates them into high-current dual H-bridge outputs, regulating current limit thresholds to prevent motor overheating.",
      specs: ["1/16 Microstepping", "Adjustable Current Limits", "Thermal Protection Shutdown"]
    },
    {
      icon: Zap,
      label: "Stepper Motors",
      sub: "NEMA 17 Bipolar",
      desc: "Converts electrical pulses into discrete angular rotations. High holding torque prevents position slipping during high-feedrate travel changes.",
      specs: ["1.8° Step Angle", "4.2 kg·cm Holding Torque", "Dual-phase Bipolar Coils"]
    },
    {
      icon: Settings,
      label: "Mechanical Gantry",
      sub: "XY Cartesian Frame",
      desc: "Rigid linear guide shafts and GT2 timing belts convert motor shaft rotation into linear X-axis and Y-axis gantry movement across the work area.",
      specs: ["GT2 Timing Belts", "Hardened Steel Linear Shafts", "Tension Adjustment Dampeners"]
    },
    {
      icon: LaserIcon,
      label: "Laser Module",
      sub: "450nm Blue Diode",
      desc: "Accepts digital PWM power signals from the controller to modulate laser beam strength. Focuses high-intensity photons to plot, burn, or cut patterns.",
      specs: ["3.5W Optical Output", "Adjustable Collimator Lens", "PWM Duty Cycle Power Control"]
    }
  ];

  return (
    <section id="architecture" className="relative py-24 bg-bg-dark border-b border-border-card">
      <div className="absolute inset-0 tech-grid-fine opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">

        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="font-mono text-[10px] text-accent-yellow tracking-widest uppercase mb-3">
            [ HARDWARE & SOFTWARE TOPOLOGY ]
          </div>
          <h2 className="text-3xl md:text-5xl font-sans font-bold tracking-tight mb-4">
            System Architecture
          </h2>
          <p className="text-foreground/60 font-light text-sm md:text-base">
            Click nodes in the pathway flow to interact with high-fidelity visual micro-simulations showing exactly how each component processes hardware signals.
          </p>
        </div>

        {/* Arduino Hardware Connection Widget */}
        <ArduinoConnector arduino={arduino} />

        {/* Node Flow Track - Horizontal on desktop, Scrollable row on small screens */}
        <div className="flex items-center justify-between gap-3 mb-12 p-5 rounded-xl border-4 border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-[8px_8px_0px_rgba(15,23,42,0.1)] dark:shadow-[8px_8px_0px_rgba(0,0,0,0.5)] overflow-x-auto scrollbar-none relative">
          
          {/* Texture Overlay */}
          <div className="absolute inset-0 opacity-15 dark:opacity-5 bg-[radial-gradient(#94a3b8_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none rounded-lg" />

          {nodes.map((node, idx) => {
            const IconComp = node.icon;
            const isActive = activeNode === idx;

            return (
              <React.Fragment key={idx}>
                {/* Node Box */}
                <button
                  onClick={() => setActiveNode(idx)}
                  className={`flex-1 min-w-[155px] p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer text-center group relative overflow-hidden focus:outline-none ${isActive ?
                    "border-slate-900 dark:border-slate-600 bg-slate-800 dark:bg-slate-700 text-white shadow-none translate-y-1 translate-x-1" :
                    "border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 shadow-[4px_4px_0px_#cbd5e1] dark:shadow-[4px_4px_0px_#1e293b] hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 active:shadow-none active:translate-y-1 active:translate-x-1"
                    }`}
                >
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center mx-auto mb-2.5 border-2 transition-colors duration-300 ${isActive ?
                    "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-white dark:border-slate-950 shadow-[2px_2px_0px_rgba(255,255,255,0.3)] dark:shadow-none" :
                    "bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 group-hover:border-slate-400 dark:group-hover:border-slate-600 group-hover:bg-white dark:group-hover:bg-slate-800"
                    }`}>
                    <IconComp className="w-4 h-4" />
                  </div>

                  <div className={`font-mono text-[11px] font-black mb-0.5 transition-colors duration-300 ${isActive ? "text-white" : "text-slate-700 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200"}`}>
                    {node.label}
                  </div>
                  <div className={`font-mono text-[9px] uppercase font-bold tracking-widest ${isActive ? "text-slate-400" : "text-slate-400"}`}>
                    {node.sub}
                  </div>
                </button>

                {/* Connection Arrow */}
                {idx < nodes.length - 1 && (
                  <div className="flex items-center justify-center px-1 shrink-0 relative z-10">
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Detailed Visualizer & Parameter Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

          {/* Interactive Visual Dashboard Subpanel */}
          <div className="lg:col-span-7 p-6 rounded-2xl border border-border-card bg-bg-card/35 backdrop-blur-md flex flex-col justify-between relative min-h-[300px]">
            {/* Visual Simulator Swapper */}
            {activeNode === 0 && <SoftwareVisual />}
            {activeNode === 1 && <ArduinoVisual isConnected={arduino.isConnected} />}
            {activeNode === 2 && <DriverVisual />}
            {activeNode === 3 && <StepperVisual />}
            {activeNode === 4 && <GantryVisual />}
            {activeNode === 5 && <LaserVisual />}
          </div>

          {/* Description & Parameter Specs Card */}
          <div className="lg:col-span-5 p-6 rounded-2xl border border-accent-yellow/20 bg-accent-yellow-dim/5 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-1 h-full bg-accent" />

            <div className="mb-6">
              <div className="font-mono text-[9px] text-accent-yellow tracking-widest uppercase mb-2">
                [ DETAILED SUBSYSTEM PARAMETERS ]
              </div>
              <h3 className="text-xl font-mono font-bold mb-3 text-foreground">
                {nodes[activeNode].label} — <span className="text-accent">{nodes[activeNode].sub}</span>
              </h3>
              <p className="text-foreground/75 font-light text-xs md:text-sm leading-relaxed">
                {nodes[activeNode].desc}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {nodes[activeNode].specs.map((spec, sidx) => (
                  <span
                    key={sidx}
                    className="px-2.5 py-1 rounded bg-bg-dark border border-border-card font-mono text-[9px] text-accent-yellow-bright"
                  >
                    {spec}
                  </span>
                ))}
              </div>

              {/* Subsystem Logic Reference Block */}
              <div className="border-t border-border-card/40 pt-4 font-mono text-[9px] text-foreground/35 space-y-1">
                <div className="flex justify-between">
                  <span>SIGNAL FREQUENCY:</span>
                  <span className="text-foreground/50">
                    {activeNode === 0 && "115200 BAUD STREAM"}
                    {activeNode === 1 && "20 kHz STEP BUFFER"}
                    {activeNode === 2 && "16x SINE INTERPOLATION"}
                    {activeNode === 3 && "1.8° DEGREE STEP FREQ"}
                    {activeNode === 4 && "2.0mm GT2 PITCH TRAVEL"}
                    {activeNode === 5 && "1.0 - 5.0 kHz PWM PULSE"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>INTERFACE PROTOCOL:</span>
                  <span className="text-foreground/50">
                    {activeNode === 0 && "USB VIRTUAL COM SERIAL"}
                    {activeNode === 1 && "TTL DIGITAL LEVEL I/O"}
                    {activeNode === 2 && "H-BRIDGE BIPOLAR CURRENT"}
                    {activeNode === 3 && "QUADRATURE PHASE PULSE"}
                    {activeNode === 4 && "XY ROTARY TRANSLATION"}
                    {activeNode === 5 && "PWM DUTY POWER STRENGTH"}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
