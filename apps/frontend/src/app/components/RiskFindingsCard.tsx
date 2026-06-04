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
    <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 print-card">
      <h3 className="font-bold text-xs text-white font-mono uppercase tracking-widest border-b border-zinc-900 pb-3 mb-4">
        Diagnostic Report Findings
      </h3>
      
      <div className="space-y-4">
        {highRisks.map((risk, i) => (
          <div key={i} className="flex gap-4 items-start bg-red-950/10 border border-red-900/20 p-4 rounded-2xl print-card">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wide">{risk.title}</h4>
              <p className="text-xs text-zinc-400 mt-1 font-mono">{risk.desc}</p>
            </div>
          </div>
        ))}

        {mediumRisks.map((risk, i) => (
          <div key={i} className="flex gap-4 items-start bg-amber-950/10 border border-amber-900/20 p-4 rounded-2xl print-card">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wide">{risk.title}</h4>
              <p className="text-xs text-zinc-400 mt-1 font-mono">{risk.desc}</p>
            </div>
          </div>
        ))}

        {lowRisks.map((risk, i) => (
          <div key={i} className="flex gap-4 items-start bg-zinc-900/30 border border-zinc-900 p-4 rounded-2xl print-card">
            <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wide">{risk.title}</h4>
              <p className="text-xs text-zinc-400 mt-1 font-mono">{risk.desc}</p>
            </div>
          </div>
        ))}

        {findings.length === 0 && (
          <div className="text-center py-6 text-xs font-mono text-zinc-500">
            No critical security findings reported.
          </div>
        )}
      </div>
    </div>
  );
}
