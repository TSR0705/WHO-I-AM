"use client";

import { Smartphone, Tablet, Laptop } from "lucide-react";
import { WhoAmIData } from "../../types";

interface DeviceAuditPanelProps {
  data: WhoAmIData;
  isAdvancedMode: boolean;
}

export default function DeviceAuditPanel({
  data,
  isAdvancedMode
}: DeviceAuditPanelProps) {
  return (
    <div className="space-y-4 font-mono text-xs">
      <div>
        <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Browser Profile</span>
        <span className="font-bold text-zinc-300">{data.browser}</span>
      </div>
      <div>
        <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Operating System</span>
        <span className="font-bold text-zinc-300 flex items-center gap-2">
          {data.os}
          {data.securityAudit.userAgentMismatch && (
            <span className="text-[9px] font-bold bg-neon-rose/10 border border-neon-rose/25 text-neon-rose px-1.5 py-0.5 rounded-md animate-pulse">
              MISMATCH
            </span>
          )}
        </span>
      </div>
      <div>
        <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Form Factor</span>
        <span className="font-bold text-zinc-300 uppercase flex items-center gap-1.5">
          {data.device === "mobile" ? (
            <Smartphone className="w-3.5 h-3.5 text-neon-cyan" />
          ) : data.device === "tablet" ? (
            <Tablet className="w-3.5 h-3.5 text-neon-cyan" />
          ) : (
            <Laptop className="w-3.5 h-3.5 text-neon-cyan" />
          )}
          {data.device}
        </span>
      </div>
      <div>
        <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Display Screen Parameters</span>
        <span className="font-bold text-zinc-300">
          {typeof window !== "undefined"
            ? `${window.screen.width} x ${window.screen.height} (${window.screen.colorDepth}-bit)`
            : "Unavailable"}
        </span>
      </div>
      <div>
        <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Client Device Languages</span>
        <span className="font-bold text-zinc-300">
          {typeof navigator !== "undefined"
            ? navigator.languages
              ? navigator.languages.join(", ")
              : navigator.language
            : "Unknown"}
        </span>
      </div>
      {isAdvancedMode && (
        <div>
          <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Client Hardware CPU architecture</span>
          <span className="font-bold text-zinc-300">
            {typeof navigator !== "undefined"
              ? (navigator as any).deviceMemory
                ? `Memory: ${(navigator as any).deviceMemory}GB | CPU cores: ${navigator.hardwareConcurrency || "Unknown"}`
                : `CPU cores: ${navigator.hardwareConcurrency || "Unknown"}`
              : "Unknown"}
          </span>
        </div>
      )}
    </div>
  );
}
