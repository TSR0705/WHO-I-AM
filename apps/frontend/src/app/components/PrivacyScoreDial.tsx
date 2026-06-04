"use client";

import { Lock, HelpCircle } from "lucide-react";

interface PrivacyScoreDialProps {
  score: number;
  localIPsExposed: boolean;
  dnsLeaking: boolean;
  dnsTested: boolean;
  adblockerActive: boolean | null;
  onExplainClick: (key: string) => void;
}

export default function PrivacyScoreDial({
  score,
  localIPsExposed,
  dnsLeaking,
  dnsTested,
  adblockerActive,
  onExplainClick
}: PrivacyScoreDialProps) {
  const getGrade = () => {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    if (score >= 45) return 'D';
    return 'F';
  };

  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden print-card">
      <div className="absolute top-0 right-0 p-4 text-zinc-900/40 pointer-events-none">
        <Lock className="w-28 h-28" />
      </div>
      
      <div className="relative z-10 w-full">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest font-bold">Privacy Grade</span>
          <HelpCircle 
            className="w-4 h-4 text-zinc-600 hover:text-zinc-400 cursor-pointer no-print"
            onClick={() => onExplainClick("ip")}
          />
        </div>
        
        <div className="flex items-center gap-6 mt-4">
          <div className="w-20 h-20 rounded-full border-4 border-zinc-900 border-t-cyan-500 flex items-center justify-center font-mono text-3xl font-extrabold text-white">
            {getGrade()}
          </div>
          <div>
            <div className="text-3xl font-extrabold font-mono text-white">{score} <span className="text-zinc-600 text-xs">/ 100</span></div>
            <div className="text-xs text-zinc-400 font-mono mt-1">
              {score >= 80 ? "Solid Protection" : score >= 55 ? "Moderate Exposure" : "Highly Vulnerable Profile"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-zinc-900/60 relative z-10 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-500 font-mono">WebRTC Local IP:</span>
          <span className={localIPsExposed ? "text-amber-500 font-bold font-mono" : "text-emerald-500 font-mono"}>
            {localIPsExposed ? "EXPOSED" : "SECURED"}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-500 font-mono">DNS Resolution:</span>
          <span className={dnsLeaking ? "text-red-500 font-bold font-mono" : dnsTested ? "text-emerald-500 font-mono" : "text-zinc-500 font-mono"}>
            {dnsTested ? (dnsLeaking ? "LEAKING" : "SECURED") : "NOT TESTED"}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-500 font-mono">Adblock Protection:</span>
          <span className={adblockerActive ? "text-emerald-500 font-mono" : "text-zinc-500 font-mono"}>
            {adblockerActive ? "ACTIVE" : "INACTIVE"}
          </span>
        </div>
      </div>
    </div>
  );
}
