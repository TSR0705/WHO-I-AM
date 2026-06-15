"use client";

import { AlertTriangle, Info, ShieldCheck } from "lucide-react";

interface Finding {
  type: "high" | "medium" | "low";
  title: string;
  desc: string;
}

interface RiskFindingsCardProps {
  findings: Finding[];
  status?: "pending" | "scanning" | "completed";
}

export default function RiskFindingsCard({ findings, status = "completed" }: RiskFindingsCardProps) {
  const highRisks = findings.filter(r => r.type === "high");
  const mediumRisks = findings.filter(r => r.type === "medium");
  const lowRisks = findings.filter(r => r.type === "low");

  if (status === "pending" || status === "scanning") {
    return (
      <div className="glass-panel rounded-3xl p-6 print-card h-full flex flex-col">
        <h3 className="font-bold text-xs text-zinc-400 font-mono uppercase tracking-widest border-b border-zinc-900/60 pb-3 mb-5">
          Diagnostic Threat Ledger
        </h3>
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin mb-3" />
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Compiling Threat Findings...</span>
          <span className="text-[10px] font-mono text-zinc-500 mt-1">Evaluating system profiles against vulnerability database.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-3xl p-6 print-card h-full flex flex-col justify-between">
      <div>
        <h3 className="font-bold text-xs text-zinc-400 font-mono uppercase tracking-widest border-b border-zinc-900/60 pb-3 mb-5">
          Diagnostic Threat Ledger ({findings.length} alerts)
        </h3>
        
        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 scrollbar-cyber">
          {highRisks.map((risk, i) => (
            <div key={i} className="flex gap-4 items-start bg-neon-rose/5 border border-neon-rose/15 p-4 rounded-2xl print-card hover:border-neon-rose/30 transition-colors">
              <AlertTriangle className="w-5 h-5 text-neon-rose shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wide">{risk.title}</h4>
                <p className="text-[11px] text-zinc-450 mt-1 font-mono leading-relaxed">{risk.desc}</p>
              </div>
            </div>
          ))}

          {mediumRisks.map((risk, i) => (
            <div key={i} className="flex gap-4 items-start bg-neon-amber/5 border border-neon-amber/15 p-4 rounded-2xl print-card hover:border-neon-amber/30 transition-colors">
              <AlertTriangle className="w-5 h-5 text-neon-amber shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wide">{risk.title}</h4>
                <p className="text-[11px] text-zinc-455 mt-1 font-mono leading-relaxed">{risk.desc}</p>
              </div>
            </div>
          ))}

          {lowRisks.map((risk, i) => (
            <div key={i} className="flex gap-4 items-start bg-zinc-900/20 border border-zinc-900/50 p-4 rounded-2xl print-card hover:border-zinc-800 transition-colors">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wide">{risk.title}</h4>
                <p className="text-[11px] text-zinc-450 mt-1 font-mono leading-relaxed">{risk.desc}</p>
              </div>
            </div>
          ))}

          {findings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ShieldCheck className="w-10 h-10 text-neon-emerald mb-2 drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]" />
              <span className="text-xs font-mono font-bold text-neon-emerald uppercase tracking-widest">
                System Cleared
              </span>
              <span className="text-[10px] font-mono text-zinc-500 mt-1">
                Zero security exposures or routing leaks detected.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
