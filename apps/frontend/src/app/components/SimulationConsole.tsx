"use client";

import { Settings } from "lucide-react";

interface SimulationConsoleProps {
  spoofIp: string;
  setSpoofIp: (val: string) => void;
  selectedUaPreset: string;
  setSelectedUaPreset: (val: string) => void;
  customUa: string;
  setCustomUa: (val: string) => void;
  simulateSpoof: boolean;
  setSimulateSpoof: (val: boolean) => void;
  onApply: () => void;
  onReset: () => void;
}

export default function SimulationConsole({
  spoofIp,
  setSpoofIp,
  selectedUaPreset,
  setSelectedUaPreset,
  customUa,
  setCustomUa,
  simulateSpoof,
  setSimulateSpoof,
  onApply,
  onReset
}: SimulationConsoleProps) {
  return (
    <div className="glass-panel rounded-3xl overflow-hidden shadow-xl no-print">
      <div className="px-6 py-4 border-b border-zinc-900 bg-zinc-900/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-xs text-white font-mono uppercase tracking-widest">
            SANDBOX SIMULATOR
          </h3>
        </div>
        <button 
          onClick={() => setSimulateSpoof(!simulateSpoof)}
          className="text-[10px] font-mono font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider cursor-pointer"
        >
          {simulateSpoof ? "Collapse" : "Expand Sandbox"}
        </button>
      </div>

      {simulateSpoof && (
        <div className="p-5 bg-zinc-950/20 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-wider block">Spoof Client IPv4</label>
            <input
              type="text"
              placeholder="e.g., 8.8.8.8"
              value={spoofIp}
              onChange={(e) => setSpoofIp(e.target.value)}
              className="w-full bg-zinc-950/50 border border-zinc-900 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-xs font-mono text-zinc-300 px-3.5 py-2.5 rounded-2xl transition-all placeholder:text-zinc-700"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-wider block">Spoof User-Agent Header</label>
            <select
              value={selectedUaPreset}
              onChange={(e) => setSelectedUaPreset(e.target.value)}
              className="w-full bg-zinc-950/50 border border-zinc-900 focus:border-primary outline-none text-xs font-mono text-zinc-300 px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer"
            >
              <option value="current" className="bg-zinc-950">Default Browser Profile</option>
              <option value="iphone" className="bg-zinc-950">Safari - Apple iPhone (iOS)</option>
              <option value="linux" className="bg-zinc-950">Chrome - Ubuntu Desktop (Linux)</option>
              <option value="windows" className="bg-zinc-950">Firefox - Windows 11 (Windows)</option>
              <option value="tor" className="bg-zinc-950">Tor Browser Proxy Header</option>
              <option value="custom" className="bg-zinc-950">Custom string input...</option>
            </select>
          </div>

          {selectedUaPreset === "custom" && (
            <div className="animate-fade-in">
              <input
                type="text"
                placeholder="Enter custom User-Agent details..."
                value={customUa}
                onChange={(e) => setCustomUa(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-900 focus:border-primary outline-none text-xs font-mono text-zinc-300 px-3.5 py-2.5 rounded-2xl transition-all placeholder:text-zinc-700"
              />
            </div>
          )}
          
          <div className="flex gap-3 pt-2">
            <button
              onClick={onApply}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/50 text-primary text-xs font-mono font-bold transition-all cursor-pointer tracking-wider"
            >
              ENGAGE SPOOF
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono font-bold transition-all cursor-pointer"
            >
              RESET
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
