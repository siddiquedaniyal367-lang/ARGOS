"use client";

import React from "react";
import { Usb, Wifi, WifiOff, AlertTriangle, Loader2, X } from "lucide-react";
import { UseArduinoReturn } from "@/hooks/useArduino";

interface ArduinoConnectorProps {
  arduino: UseArduinoReturn;
}

export default function ArduinoConnector({ arduino }: ArduinoConnectorProps) {
  const {
    isSupported,
    isConnected,
    isConnecting,
    portInfo,
    baudRate,
    setBaudRate,
    connect,
    disconnect,
    lastMessage,
    error,
  } = arduino;

  // --- Unsupported browser ---
  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 mb-8 rounded-xl border border-amber-500/30 bg-amber-500/5 font-mono">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="text-[10px] text-amber-400/90 tracking-wide">
          WEB SERIAL NOT SUPPORTED — Use Chrome or Edge to connect hardware devices.
        </span>
      </div>
    );
  }

  // --- Connected state ---
  if (isConnected) {
    return (
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 mb-8 rounded-xl border border-green-500/30 bg-green-500/5 font-mono relative overflow-hidden">
        {/* Animated scanning line */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(34,197,94,0.06) 50%, transparent 100%)",
            animation: "scanline 2.5s linear infinite",
          }}
        />

        {/* Live heartbeat dot */}
        <div className="relative shrink-0">
          <span className="absolute inline-flex w-3 h-3 rounded-full bg-green-400 opacity-60 animate-ping" />
          <span className="relative inline-flex w-3 h-3 rounded-full bg-green-500" />
        </div>

        {/* Status label */}
        <div className="flex items-center gap-2">
          <Usb className="w-3.5 h-3.5 text-green-400" />
          <span className="text-[10px] text-green-400 font-bold tracking-widest uppercase">
            Arduino Connected
          </span>
        </div>

        {/* Port info */}
        <span className="text-[9px] text-green-400/60 border-l border-green-500/20 pl-3">
          {portInfo?.label ?? "Serial Port"}
        </span>

        {/* Baud rate badge */}
        <span className="text-[9px] text-green-400/60 border-l border-green-500/20 pl-3">
          {baudRate.toLocaleString()} BAUD
        </span>

        {/* Last received message */}
        {lastMessage && (
          <span className="text-[9px] text-green-300/50 border-l border-green-500/20 pl-3 truncate max-w-[160px]">
            ← {lastMessage}
          </span>
        )}

        {/* Spacer */}
        <div className="flex-grow" />

        {/* Disconnect button */}
        <button
          onClick={disconnect}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-red-500/30 bg-red-500/10 text-[9px] text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-200 cursor-pointer shrink-0"
        >
          <X className="w-3 h-3" />
          Disconnect
        </button>
      </div>
    );
  }

  // --- Connecting state ---
  if (isConnecting) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 mb-8 rounded-xl border border-accent/30 bg-accent/5 font-mono">
        <Loader2 className="w-4 h-4 text-accent animate-spin shrink-0" />
        <span className="text-[10px] text-accent/80 tracking-wide">
          Waiting for port selection…
        </span>
      </div>
    );
  }

  // --- Disconnected / idle state ---
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 mb-8 rounded-xl border border-border-card bg-bg-card/30 font-mono">
      <div className="flex items-center gap-2 flex-grow">
        <WifiOff className="w-3.5 h-3.5 text-foreground/30 shrink-0" />
        <span className="text-[10px] text-foreground/45 tracking-wide">
          No hardware connected
        </span>
        {error && (
          <span className="text-[9px] text-red-400/80 border-l border-border-card pl-3">
            {error}
          </span>
        )}
      </div>

      {/* Baud rate selector */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-foreground/35 uppercase tracking-wider">Baud:</span>
        <select
          value={baudRate}
          onChange={(e) => setBaudRate(Number(e.target.value))}
          className="bg-bg-dark border border-border-card rounded px-2 py-0.5 text-[9px] text-foreground/60 font-mono cursor-pointer focus:outline-none focus:border-accent/40"
        >
          {[9600, 19200, 38400, 57600, 115200].map((r) => (
            <option key={r} value={r}>
              {r.toLocaleString()}
            </option>
          ))}
        </select>
      </div>

      {/* Connect button */}
      <button
        onClick={connect}
        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-accent/40 bg-accent/10 text-[10px] text-accent hover:bg-accent/20 hover:border-accent/70 transition-all duration-200 cursor-pointer font-bold tracking-wider shrink-0 group"
      >
        <Usb className="w-3.5 h-3.5 group-hover:animate-pulse" />
        Connect Arduino
      </button>
    </div>
  );
}
