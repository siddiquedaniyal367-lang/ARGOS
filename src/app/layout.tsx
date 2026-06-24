import type { Metadata } from "next";
import { Inter, Oxanium } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const oxanium = Oxanium({
  variable: "--font-oxanium",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ARGOS | Intelligent CNC Laser Plotter System",
  description: "ARGOS is an intelligent CNC Laser Plotter platform designed for high-precision 2D fabrication, rapid prototyping, and automated vector path execution. Discover our system specs, architecture, and simulation sandbox.",
  keywords: ["ARGOS", "CNC Laser Plotter", "XY Plotter", "Laser Engraving", "Hardware Integration", "Atmega328P", "GRBL", "Arduino CNC", "Rapid Prototyping"],
  authors: [{ name: "Daniyal Siddique" }, { name: "Rishab Soni" }, { name: "Adarsh Jha" }, { name: "Paras" }, { name: "Raj Shukla" }],
  creator: "ARGOS Engineering Team",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${oxanium.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative">
        {/* Global Premium Matte Noise Overlay */}
        <div className="fixed inset-0 z-[9999] bg-noise pointer-events-none" />
        {children}
      </body>
    </html>
  );
}
