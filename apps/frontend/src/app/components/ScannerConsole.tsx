"use client";

import { useEffect, useRef } from "react";
import { Terminal, ChevronDown, ChevronUp } from "lucide-react";

interface ScannerConsoleProps {
  logs: string[];
  progress: number;
  isScanning: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function ScannerConsole({
  logs,
  progress,
  isScanning,
  collapsed,
  onToggleCollapse
}: ScannerConsoleProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  return (
    <div className="mb-8 bg-zinc-950 border border-zinc-900 rounded-2xl shadow-xl overflow-hidden no-print">
      <div className="px-5 py-3 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Diagnostic Console Log</span>
          {isScanning && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-900/30 animate-pulse font-mono">
              SCANNING... {progress}%
            </span>
          )}
        </div>
        <button 
          onClick={onToggleCollapse}
          className="text-zinc-500 hover:text-zinc-300"
        >
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>
      
      {!collapsed && (
        <div className="p-4 bg-zinc-950/90 font-mono text-xs text-zinc-400 h-[140px] overflow-y-auto space-y-1 scrollbar-thin">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-zinc-600 select-none">&gt;</span>
              <span className={
                log.includes('[ALERT]') ? 'text-amber-400 font-bold' :
                log.includes('[CRITICAL]') ? 'text-red-400 font-bold' :
                log.includes('[INIT]') || log.includes('[COMPLETE]') ? 'text-cyan-400' :
                'text-zinc-300'
              }>{log}</span>
            </div>
          ))}
          {isScanning && (
            <div className="flex gap-2 items-center text-cyan-400/70 animate-pulse">
              <span className="text-zinc-600 select-none">&gt;</span>
              <span>Fetching diagnostic buffers...</span>
            </div>
          )}
          <div ref={terminalEndRef} />
        </div>
      )}
    </div>
  );
}
