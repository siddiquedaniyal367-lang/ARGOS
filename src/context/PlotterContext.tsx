"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const SESSION_KEY = "argos_plotter_image";

interface PlotterContextType {
  plotterImage: string | null;
  setPlotterImage: (url: string | null) => void;
  cutW: number;
  setCutW: (w: number) => void;
  cutH: number;
  setCutH: (h: number) => void;
}

const PlotterContext = createContext<PlotterContextType>({
  plotterImage: null,
  setPlotterImage: () => {},
  cutW: 200,
  setCutW: () => {},
  cutH: 200,
  setCutH: () => {},
});

export function PlotterProvider({ children }: { children: React.ReactNode }) {
  const [plotterImage, _setPlotterImage] = useState<string | null>(null);
  const [cutW, _setCutW] = useState<number>(200);
  const [cutH, _setCutH] = useState<number>(200);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedImg = sessionStorage.getItem(SESSION_KEY);
      if (storedImg) _setPlotterImage(storedImg);
      const storedW = sessionStorage.getItem("argos_cut_w");
      if (storedW) _setCutW(Number(storedW));
      const storedH = sessionStorage.getItem("argos_cut_h");
      if (storedH) _setCutH(Number(storedH));
    }
  }, []);

  const setPlotterImage = (url: string | null) => {
    _setPlotterImage(url);
    if (typeof window !== "undefined") {
      if (url) sessionStorage.setItem(SESSION_KEY, url);
      else sessionStorage.removeItem(SESSION_KEY);
    }
  };

  const setCutW = (w: number) => {
    _setCutW(w);
    if (typeof window !== "undefined") sessionStorage.setItem("argos_cut_w", w.toString());
  };

  const setCutH = (h: number) => {
    _setCutH(h);
    if (typeof window !== "undefined") sessionStorage.setItem("argos_cut_h", h.toString());
  };

  return (
    <PlotterContext.Provider value={{ plotterImage, setPlotterImage, cutW, setCutW, cutH, setCutH }}>
      {children}
    </PlotterContext.Provider>
  );
}

export function usePlotter() {
  return useContext(PlotterContext);
}
