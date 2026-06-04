"use client";

import { HelpCircle } from "lucide-react";

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

  const getStatusText = () => {
    if (score >= 80) return "Solid Protection";
    if (score >= 55) return "Moderate Exposure";
    return "Highly Vulnerable";
  };

  const getDialColor = () => {
    if (score >= 75) return "url(#grad-cyan-emerald)";
    if (score >= 50) return "url(#grad-amber-orange)";
    return "url(#grad-rose-red)";
  };

  const getDialColorClass = () => {
    if (score >= 75) return "text-neon-cyan drop-shadow-[0_0_10px_rgba(0,242,255,0.4)]";
    if (score >= 50) return "text-neon-amber drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]";
    return "text-neon-rose drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]";
  };

  const getGradeColorClass = () => {
    if (score >= 75) return "text-neon-emerald";
    if (score >= 50) return "text-neon-amber";
    return "text-neon-rose";
  };

  const circumference = 2 * Math.PI * 34; // r = 34
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden print-card">
      {/* High-tech glow background */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-neon-cyan/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 w-full">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest font-bold">Privacy Fingerprint Score</span>
          <HelpCircle 
            className="w-4.5 h-4.5 text-zinc-600 hover:text-zinc-400 cursor-pointer no-print transition-colors"
            onClick={() => onExplainClick("ip")}
          />
        </div>
        
        <div className="flex items-center gap-6 mt-6">
          {/* Radial Circular SVG Dial */}
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="w-24 h-24 transform -rotate-90">
              <defs>
                <linearGradient id="grad-cyan-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00f2ff" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <linearGradient id="grad-amber-orange" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
                <linearGradient id="grad-rose-red" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
              </defs>
              
              {/* Back Circle */}
              <circle
                cx="48"
                cy="48"
                r="34"
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.03)"
                strokeWidth="6"
              />
              
              {/* Active Circle with strokeDasharray */}
              <circle
                cx="48"
                cy="48"
                r="34"
                fill="transparent"
                stroke={getDialColor()}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            
            {/* Core Grade Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-black font-mono tracking-tighter ${getGradeColorClass()}`}>
                {getGrade()}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-3xl font-black font-mono text-white tracking-tight">
              {score} <span className="text-zinc-600 text-xs font-normal">/ 100</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
              Rating: <span className={`font-bold ${getDialColorClass()}`}>{getStatusText()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-zinc-900/60 relative z-10 space-y-3 font-mono text-xs">
        <div className="flex justify-between items-center">
          <span className="text-zinc-500">WebRTC Exposure:</span>
          <span className={localIPsExposed ? "text-neon-amber font-bold" : "text-neon-emerald"}>
            {localIPsExposed ? "EXPOSED" : "SECURED"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-500">DNS Tunnel Status:</span>
          <span className={dnsLeaking ? "text-neon-rose font-bold" : dnsTested ? "text-neon-emerald" : "text-zinc-600"}>
            {dnsTested ? (dnsLeaking ? "LEAKING" : "SECURED") : "NOT TESTED"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-500">Adblock Protection:</span>
          <span className={adblockerActive ? "text-neon-emerald" : "text-zinc-600"}>
            {adblockerActive ? "ENFORCED" : "INACTIVE"}
          </span>
        </div>
      </div>
    </div>
  );
}
