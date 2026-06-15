"use client";

import Hero from "@/components/ui/demo";
import { Component as Counter } from "@/components/ui/hero";

export default function Home() {
  return (
    <main className="w-full min-h-screen bg-cyber-black text-zinc-100 overflow-y-auto selection:bg-primary/20 selection:text-primary scroll-smooth">
      {/* Main Hero Section */}
      <Hero />

      {/* Counter Component Integration Section */}
      <section className="py-20 px-4 md:px-8 max-w-4xl mx-auto border-t border-white/10 flex flex-col items-center gap-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Integrated Counter Component
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            This interactive counter is imported directly from <code>src/components/ui/hero.tsx</code>.
          </p>
        </div>
        
        <Counter />
      </section>
    </main>
  );
}
