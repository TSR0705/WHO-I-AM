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
    <div className="bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden print-card">
      <div className="px-6 py-4 border-b border-zinc-900 bg-zinc-900/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-bold text-xs text-white font-mono uppercase tracking-widest">{title}</h3>
        </div>
        <HelpCircle 
          className="w-4 h-4 text-zinc-500 hover:text-zinc-300 cursor-pointer no-print"
          onClick={() => onExplainClick(eduKey)}
        />
      </div>
      <div className={paddingStyle}>
        {children}
      </div>
    </div>
  );
}
