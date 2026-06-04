"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DataGridHero from "@/components/ui/data-grid-hero";
import GridControlPanel from "./components/GridControlPanel";

export default function Home() {
  const router = useRouter();

  // Grid Configuration States for Landing Hero
  const [gridCfg, setGridCfg] = useState({
    rows: 25,
    cols: 35,
    spacing: 4,
    duration: 5.0,
    color: "hsl(var(--cyan))",
    animationType: "pulse" as "pulse" | "wave" | "random",
    pulseEffect: true,
    mouseGlow: true,
    opacityMin: 0.05,
    opacityMax: 0.5,
    background: "transparent",
  });
  const [gridPanelOpen, setGridPanelOpen] = useState(false);

  const randomizeGrid = useCallback(() => {
    const rand = (min: number, max: number) => Math.random() * (max - min) + min;
    const colors = [
      "hsl(var(--green))",
      "hsl(var(--pink))",
      "hsl(var(--cyan))",
      "hsl(var(--yellow))",
      "hsl(var(--orange))",
    ];
    const anims: ("pulse" | "wave" | "random")[] = ["pulse", "wave", "random"];
    setGridCfg((c) => ({
      ...c,
      rows: Math.floor(rand(15, 35)),
      cols: Math.floor(rand(20, 40)),
      duration: rand(4, 9),
      color: colors[Math.floor(Math.random() * colors.length)],
      animationType: anims[Math.floor(Math.random() * anims.length)],
      pulseEffect: Math.random() > 0.2,
      mouseGlow: Math.random() > 0.3,
      opacityMin: rand(0.02, 0.1),
      opacityMax: rand(0.3, 0.7),
      spacing: Math.floor(rand(2, 6)),
      background: "transparent"
    }));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName && target.tagName.toLowerCase() === "input") return;
      const k = e.key.toLowerCase();
      if (k === "h") setGridPanelOpen((v) => !v);
      if (k === "r") randomizeGrid();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [randomizeGrid]);

  return (
    <div className="flex flex-col w-screen h-screen min-h-screen bg-cyber-black text-zinc-100 font-sans selection:bg-neon-cyan/20 selection:text-neon-cyan relative overflow-hidden">
      {/* Cyber Grid background */}
      <div className="absolute inset-0 cyber-grid pointer-events-none no-print" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl pointer-events-none no-print" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl pointer-events-none no-print" />
      
      <DataGridHero {...gridCfg}>
        <h1>Who-I-Am</h1>
        <p>Discover What The Internet Knows About You</p>
        <div className="buttons">
          <button 
            className="button"
            onClick={() => router.push("/dashboard")}
          >
            Get Started
          </button>
          <button
            className="button-outline"
            onClick={() => setGridPanelOpen(true)}
          >
            Controls (H)
          </button>
        </div>
      </DataGridHero>

      {gridPanelOpen && (
        <GridControlPanel
          cfg={gridCfg}
          setCfg={setGridCfg}
          onClose={() => setGridPanelOpen(false)}
          onRandomize={randomizeGrid}
        />
      )}
    </div>
  );
}
