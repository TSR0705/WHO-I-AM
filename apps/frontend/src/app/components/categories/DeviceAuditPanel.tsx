"use client";

import { Smartphone, Tablet, Laptop } from "lucide-react";
import { ExposurData } from "../../types";

interface DeviceAuditPanelProps {
  data: ExposurData | null;
  isAdvancedMode: boolean;
  status?: "pending" | "scanning" | "completed";
}

export default function DeviceAuditPanel({
  data,
  isAdvancedMode,
  status = "completed"
}: DeviceAuditPanelProps) {
  if (!data || status === "pending" || status === "scanning") {
    return (
      <div className="space-y-4.5 font-mono text-xs animate-pulse p-4">
        <div>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Browser Profile</span>
          <div className="h-4 bg-zinc-900/60 border border-zinc-900/30 rounded-md w-3/4 mt-1" />
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Operating System</span>
          <div className="h-4 bg-zinc-900/60 border border-zinc-900/30 rounded-md w-1/2 mt-1" />
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Form Factor</span>
          <div className="h-4 bg-zinc-900/60 border border-zinc-900/30 rounded-md w-1/3 mt-1" />
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Display Screen Parameters</span>
          <div className="h-4 bg-zinc-900/60 border border-zinc-900/30 rounded-md w-2/3 mt-1" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4.5 font-mono text-xs p-4">
      <div>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-0.5">Browser Profile</span>
        <span className="font-semibold text-zinc-200">{data.browser}</span>
      </div>
      <div>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-0.5">Operating System</span>
        <span className="font-semibold text-zinc-200 flex items-center gap-2">
          {data.os}
          {data.securityAudit.userAgentMismatch && (
            <span className="text-[9px] font-bold bg-neon-rose/10 border border-neon-rose/25 text-neon-rose px-2 py-0.5 rounded-md animate-pulse">
              OS MISMATCH EXPOSED
            </span>
          )}
        </span>
      </div>
      <div>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-0.5">Form Factor</span>
        <span className="font-bold text-zinc-200 uppercase flex items-center gap-2 mt-0.5">
          {data.device === "mobile" ? (
            <Smartphone className="w-4 h-4 text-primary" />
          ) : data.device === "tablet" ? (
            <Tablet className="w-4 h-4 text-primary" />
          ) : (
            <Laptop className="w-4 h-4 text-primary" />
          )}
          {data.device}
        </span>
      </div>
      <div>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-0.5">Display Screen Parameters</span>
        <span className="font-semibold text-zinc-200">
          {typeof window !== "undefined"
            ? `${window.screen.width} x ${window.screen.height} (${window.screen.colorDepth}-bit)`
            : "Unavailable"}
        </span>
      </div>
      <div>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-0.5">Client Device Languages</span>
        <span className="font-semibold text-zinc-200">
          {typeof navigator !== "undefined"
            ? navigator.languages
              ? navigator.languages.join(", ")
              : navigator.language
            : "Unknown"}
        </span>
      </div>
      {isAdvancedMode && (
        <div>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-0.5">Client Hardware CPU architecture</span>
          <span className="font-semibold text-zinc-350">
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
