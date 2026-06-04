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
    <div className="bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden shadow-xl no-print">
      <div className="px-6 py-4 border-b border-zinc-900 bg-zinc-900/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-xs text-white font-mono uppercase tracking-widest">
            FOOTPRINT SIMULATOR
          </h3>
        </div>
        <button 
          onClick={() => setSimulateSpoof(!simulateSpoof)}
          className="text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 animate-pulse"
        >
          {simulateSpoof ? "HIDE" : "SIMULATE SPOOF"}
        </button>
      </div>

      {simulateSpoof && (
        <div className="p-5 bg-zinc-950/80 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-400 font-mono font-bold uppercase tracking-wider block">Simulate IP Address</label>
            <input
              type="text"
              placeholder="e.g. 8.8.8.8"
              value={spoofIp}
              onChange={(e) => setSpoofIp(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-xs font-mono text-white px-3 py-2 rounded-xl transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-400 font-mono font-bold uppercase tracking-wider block">Simulate User-Agent Profile</label>
            <select
              value={selectedUaPreset}
              onChange={(e) => setSelectedUaPreset(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-500 outline-none text-xs font-mono text-white px-3 py-2 rounded-xl transition-all"
            >
              <option value="current">Current Browser (No spoofing)</option>
              <option value="iphone">Safari on Apple iPhone (iOS)</option>
              <option value="linux">Chrome on Ubuntu Linux</option>
              <option value="windows">Firefox on Windows 10/11</option>
              <option value="tor">Tor Browser (Header Simulator)</option>
              <option value="custom">Custom string...</option>
            </select>
          </div>

          {selectedUaPreset === "custom" && (
            <div>
              <input
                type="text"
                placeholder="Paste custom User-Agent string..."
                value={customUa}
                onChange={(e) => setCustomUa(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-500 outline-none text-xs font-mono text-white px-3 py-2 rounded-xl transition-all"
              />
            </div>
          )}
          
          <div className="flex gap-3 pt-2">
            <button
              onClick={onApply}
              className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 text-xs font-mono font-bold transition-all shadow-md"
            >
              APPLY SIMULATOR
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-xs font-mono font-bold transition-all"
            >
              RESET
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
