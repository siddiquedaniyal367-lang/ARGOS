"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const SESSION_KEY = "argos_plotter_image";

interface PlotterContextType {
  plotterImage: string | null;
  setPlotterImage: (url: string | null) => void;
}

const PlotterContext = createContext<PlotterContextType>({
  plotterImage: null,
  setPlotterImage: () => {},
});

export function PlotterProvider({ children }: { children: React.ReactNode }) {
  const [plotterImage, _setPlotterImage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        _setPlotterImage(stored);
      }
    }
  }, []);

  const setPlotterImage = (url: string | null) => {
    _setPlotterImage(url);
    if (typeof window !== "undefined") {
      if (url) sessionStorage.setItem(SESSION_KEY, url);
      else sessionStorage.removeItem(SESSION_KEY);
    }
  };

  return (
    <PlotterContext.Provider value={{ plotterImage, setPlotterImage }}>
      {children}
    </PlotterContext.Provider>
  );
}

export function usePlotter() {
  return useContext(PlotterContext);
}
