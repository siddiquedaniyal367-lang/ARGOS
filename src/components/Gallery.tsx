"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X, Maximize2 } from "lucide-react";

export default function Gallery() {
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  const images = [
    {
      src: "/cad_render.png",
      title: "CAD Render",
      desc: "Full assembly modeled in SolidWorks — validating XY carriage tolerances and rail deflection limits.",
      span: "md:col-span-2"
    },
    {
      src: "/assembly.png",
      title: "Assembly Process",
      desc: "Securing V-slot profiles, aligning hardened steel shafts, and tensioning the belt drive.",
      span: "md:col-span-1"
    },
    {
      src: "/prototype.png",
      title: "Laser Engraving Test",
      desc: "Verifying focal length and duty-cycle settings of the 3.5W optical laser module on wood.",
      span: "md:col-span-1"
    },
    {
      src: "/working_plotter.png",
      title: "Completed Plotter",
      desc: "Fully integrated XY Cartesian platform with consolidated wiring, controller shielding, and calibrated bounds.",
      span: "md:col-span-2"
    }
  ];

  return (
    <section id="gallery" className="relative py-24 bg-transparent border-b border-border-card">

      <div className="max-w-7xl mx-auto px-6 relative z-10">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 reveal">
          <div className="font-mono text-[9px] text-foreground/30 tracking-[0.22em] uppercase mb-4">
            Gallery
          </div>
          <h2 className="text-3xl md:text-5xl font-sans font-medium tracking-tight mb-4">
            Project Gallery
          </h2>
          <p className="text-foreground/45 font-light text-sm md:text-base">
            CAD renders, mechanical assemblies, and calibration tests from the ARGOS build.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
          {images.map((item, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedImg(item.src)}
              className={`${item.span} group relative rounded-xl border border-border-card bg-bg-card overflow-hidden cursor-pointer hover:border-foreground/15 transition-all duration-300`}
            >
              {/* Image */}
              <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                {/* Zoom icon on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="p-2 rounded-full bg-bg-dark/70 backdrop-blur-sm border border-foreground/10">
                    <Maximize2 className="w-4 h-4 text-foreground/60" />
                  </div>
                </div>
              </div>

              {/* Caption */}
              <div className="p-4 border-t border-border-card">
                <h3 className="font-sans text-sm font-medium text-foreground mb-1">
                  {item.title}
                </h3>
                <p className="text-[11px] text-foreground/40 leading-relaxed font-light">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Fullscreen modal */}
      {selectedImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={() => setSelectedImg(null)}
        >
          <button
            onClick={() => setSelectedImg(null)}
            className="absolute top-6 right-6 p-2 rounded-full border border-foreground/10 bg-bg-dark/80 text-foreground/50 hover:text-foreground transition-colors duration-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div
            className="relative max-w-5xl max-h-[80vh] aspect-video w-full rounded-xl overflow-hidden border border-foreground/10"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedImg}
              alt="Preview"
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      )}

    </section>
  );
}
