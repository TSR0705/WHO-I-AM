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
    <div className="mb-8 glass-panel rounded-2xl shadow-xl overflow-hidden no-print">
      <div className="px-5 py-3 border-b border-zinc-900 bg-zinc-950/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">Diagnostic Logs Terminal</span>
          {isScanning && (
            <span className="text-[9px] px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 animate-pulse font-mono">
              SCANNING... {progress}%
            </span>
          )}
        </div>
        <button 
          onClick={onToggleCollapse}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {collapsed ? <ChevronDown className="w-4.5 h-4.5" /> : <ChevronUp className="w-4.5 h-4.5" />}
        </button>
      </div>
      
      {!collapsed && (
        <div className="p-4 bg-black/60 font-mono text-[11px] text-zinc-400 h-[150px] overflow-y-auto space-y-1 scrollbar-cyber">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-primary/55 select-none font-bold">&gt;</span>
              <span className={
                log.includes('[ALERT]') ? 'text-neon-amber font-semibold' :
                log.includes('[CRITICAL]') ? 'text-neon-rose font-semibold' :
                log.includes('[INIT]') || log.includes('[COMPLETE]') || log.includes('[STARTING]') ? 'text-primary font-bold' :
                'text-zinc-300'
              }>{log}</span>
            </div>
          ))}
          {isScanning && (
            <div className="flex gap-2 items-center text-primary/60 animate-pulse">
              <span className="text-primary/30 select-none">&gt;</span>
              <span>Fetching diagnostic buffers...</span>
            </div>
          )}
          <div ref={terminalEndRef} />
        </div>
      )}
    </div>
  );
}
