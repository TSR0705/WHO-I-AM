"use client";

import Hero from "@/components/ui/demo";
import { Component as Counter } from "@/components/ui/hero";

export default function Home() {
  return (
    <main className="w-full min-h-screen bg-cyber-black text-zinc-100 overflow-y-auto selection:bg-primary/20 selection:text-primary scroll-smooth">
      {/* Main Hero Section */}
      <Hero />

      {/* Counter Component Integration Section */}
      {/* <section className="py-20 px-4 md:px-8 max-w-4xl mx-auto border-t border-white/10 flex flex-col items-center gap-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Integrated Counter Component
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            This interactive counter is imported directly from <code>src/components/ui/hero.tsx</code>.
          </p>
        </div>
        
        <Counter />
      </section> */}

      {/* Footer Section */}
      <footer className="border-t border-white/10 bg-black/60 py-12 px-4 md:px-8 relative z-10 no-print">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="space-y-4 max-w-sm">
            <div className="text-2xl font-black tracking-widest text-white font-mono flex items-center gap-1">
              EXP◉SUR
            </div>
            <p className="text-zinc-400 text-sm">
              Help people understand and reduce their public digital exposure.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-white font-mono text-sm uppercase tracking-wider font-bold">Positioning</h4>
            <p className="text-primary text-sm italic font-mono">
              Discover What the Internet Already Knows About You.
            </p>
          </div>
        </div>
        <div className="max-w-4xl mx-auto border-t border-white/5 mt-8 pt-6 text-center text-xs text-zinc-500 font-mono">
          &copy; 2026 Exposur &middot; PRIVACY DIAGNOSTICS &middot; All Rights Reserved
        </div>
      </footer>
    </main>
  );
}
