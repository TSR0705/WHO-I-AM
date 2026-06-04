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
}

export default function AuditCategoryCard({
  title,
  icon,
  eduKey,
  onExplainClick,
  children,
  paddingStyle = "p-6"
}: AuditCategoryCardProps) {
  return (
    <div className="glass-panel rounded-3xl overflow-hidden hover:scale-[1.01] hover:border-neon-cyan/20 duration-300 print-card relative">
      {/* Decorative accent top neon light indicator */}
      <div className="h-[2px] w-full bg-gradient-to-r from-neon-cyan/30 via-neon-purple/20 to-transparent" />
      
      <div className="px-6 py-4 border-b border-zinc-900/60 bg-zinc-900/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {icon}
          <h3 className="font-bold text-[10px] text-white font-mono uppercase tracking-widest">{title}</h3>
        </div>
        <HelpCircle 
          className="w-4 h-4 text-zinc-600 hover:text-neon-cyan cursor-pointer no-print transition-colors"
          onClick={() => onExplainClick(eduKey)}
        />
      </div>
      <div className={paddingStyle}>
        {children}
      </div>
    </div>
  );
}
