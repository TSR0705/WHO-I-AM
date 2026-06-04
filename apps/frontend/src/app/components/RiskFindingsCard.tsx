"use client";

import { AlertTriangle, Info } from "lucide-react";

interface Finding {
  type: "high" | "medium" | "low";
  title: string;
  desc: string;
}

interface RiskFindingsCardProps {
  findings: Finding[];
}

export default function RiskFindingsCard({ findings }: RiskFindingsCardProps) {
  const highRisks = findings.filter(r => r.type === "high");
  const mediumRisks = findings.filter(r => r.type === "medium");
  const lowRisks = findings.filter(r => r.type === "low");

  return (
    <div className="glass-panel rounded-3xl p-6 print-card">
      <h3 className="font-bold text-[10px] text-zinc-400 font-mono uppercase tracking-widest border-b border-zinc-900/60 pb-3 mb-5">
        Diagnostic Threat Ledger ({findings.length} alerts)
      </h3>
      
      <div className="space-y-4">
        {highRisks.map((risk, i) => (
          <div key={i} className="flex gap-4 items-start bg-neon-rose/5 border border-neon-rose/20 p-4 rounded-2xl print-card hover:border-neon-rose/40 transition-colors">
            <AlertTriangle className="w-5 h-5 text-neon-rose shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wide">{risk.title}</h4>
              <p className="text-[11px] text-zinc-400 mt-1 font-mono leading-relaxed">{risk.desc}</p>
            </div>
          </div>
        ))}

        {mediumRisks.map((risk, i) => (
          <div key={i} className="flex gap-4 items-start bg-neon-amber/5 border border-neon-amber/20 p-4 rounded-2xl print-card hover:border-neon-amber/40 transition-colors">
            <AlertTriangle className="w-5 h-5 text-neon-amber shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wide">{risk.title}</h4>
              <p className="text-[11px] text-zinc-400 mt-1 font-mono leading-relaxed">{risk.desc}</p>
            </div>
          </div>
        ))}

        {lowRisks.map((risk, i) => (
          <div key={i} className="flex gap-4 items-start bg-zinc-900/30 border border-zinc-900/80 p-4 rounded-2xl print-card hover:border-zinc-800 transition-colors">
            <Info className="w-5 h-5 text-neon-cyan shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wide">{risk.title}</h4>
              <p className="text-[11px] text-zinc-400 mt-1 font-mono leading-relaxed">{risk.desc}</p>
            </div>
          </div>
        ))}

        {findings.length === 0 && (
          <div className="text-center py-8 text-xs font-mono text-zinc-600 uppercase tracking-widest">
            Diagnostic clearance: Zero vulnerabilities recorded.
          </div>
        )}
      </div>
    </div>
  );
}
