"use client";

import { ReactNode } from "react";
import { HelpCircle } from "lucide-react";

interface AuditCategoryCardProps {
  title: string;
  icon: ReactNode;
  eduKey: string;
  onExplainClick: (key: string) => void;
  children: ReactNode;
  paddingStyle?: string;
  status?: "pending" | "scanning" | "completed";
  isSecure?: boolean;
}

export default function AuditCategoryCard({
  title,
  icon,
  eduKey,
  onExplainClick,
  children,
  paddingStyle = "p-6",
  status = "completed",
  isSecure = true
}: AuditCategoryCardProps) {
  return (
    <div className="glass-panel rounded-3xl overflow-hidden hover:scale-[1.01] hover:border-neon-cyan/10 duration-300 print-card relative flex flex-col justify-between h-full">
      {/* Decorative accent top neon light indicator */}
      <div className="h-[2px] w-full bg-gradient-to-r from-neon-cyan/20 via-neon-purple/10 to-transparent" />
      
      <div className="px-6 py-4 border-b border-zinc-900/60 bg-zinc-900/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {icon}
          <h3 className="font-bold text-xs text-white font-mono uppercase tracking-widest">{title}</h3>
        </div>
        <div className="flex items-center gap-2.5 no-print">
          {status === "pending" && (
            <span className="text-[9px] font-mono text-zinc-500 bg-zinc-950/60 border border-zinc-900 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Queued
            </span>
          )}
          {status === "scanning" && (
            <span className="text-[9px] font-mono text-neon-cyan bg-neon-cyan/5 border border-neon-cyan/20 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-ping inline-block" />
              Scanning
            </span>
          )}
          {status === "completed" && (
            isSecure ? (
              <span className="text-[9px] font-mono text-neon-emerald bg-neon-emerald/5 border border-neon-emerald/20 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                ✓ Secured
              </span>
            ) : (
              <span className="text-[9px] font-mono text-neon-rose bg-neon-rose/5 border border-neon-rose/25 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                ⚠ Exposed
              </span>
            )
          )}
          <HelpCircle 
            className="w-4 h-4 text-zinc-650 hover:text-neon-cyan cursor-pointer transition-colors ml-1"
            onClick={() => onExplainClick(eduKey)}
          />
        </div>
      </div>
      <div className={`flex-1 ${paddingStyle}`}>
        {children}
      </div>
    </div>
  );
}
