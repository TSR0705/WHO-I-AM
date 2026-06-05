"use client";

import { SecurityConfig } from "../../types";

interface SecurityPanelProps {
  securityConfig: SecurityConfig | null;
  status?: "pending" | "scanning" | "completed";
}

export default function SecurityPanel({
  securityConfig,
  status = "completed"
}: SecurityPanelProps) {
  if (!securityConfig || status === "pending" || status === "scanning") {
    return (
      <div className="space-y-4 font-mono text-xs animate-pulse p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between border-b border-zinc-900/30 pb-2">
            <div className="h-3.5 bg-zinc-900/60 border border-zinc-900/30 rounded w-1/3" />
            <div className="h-3.5 bg-zinc-900/60 border border-zinc-900/30 rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 font-mono text-xs p-4">
      <div className="space-y-3.5">
        <div className="flex justify-between border-b border-zinc-900/60 pb-2">
          <span className="text-zinc-400">HTTPS Encryption:</span>
          <span className={securityConfig.isHttps ? "text-neon-emerald font-bold" : "text-neon-rose font-bold"}>
            {securityConfig.isHttps ? "ACTIVE" : "INSECURE"}
          </span>
        </div>
        <div className="flex justify-between border-b border-zinc-900/60 pb-2">
          <span className="text-zinc-400">Secure Context Mode:</span>
          <span className={securityConfig.isSecureContext ? "text-neon-emerald font-bold" : "text-neon-rose font-bold"}>
            {securityConfig.isSecureContext ? "YES" : "NO"}
          </span>
        </div>
        <div className="flex justify-between border-b border-zinc-900/60 pb-2">
          <span className="text-zinc-400">Referrer Leakage:</span>
          <span
            className={
              securityConfig.referrer !== "None"
                ? "text-neon-amber font-bold truncate max-w-[140px]"
                : "text-neon-emerald font-bold"
            }
            title={securityConfig.referrer}
          >
            {securityConfig.referrer === "None" ? "BLOCKED" : securityConfig.referrer}
          </span>
        </div>
        <div className="flex justify-between border-b border-zinc-900/60 pb-2">
          <span className="text-zinc-400">Mixed Content Block:</span>
          <span className={securityConfig.mixedContentBlocked ? "text-neon-emerald font-bold" : "text-neon-amber font-bold"}>
            {securityConfig.mixedContentBlocked ? "ENFORCED" : "INACTIVE"}
          </span>
        </div>
      </div>
    </div>
  );
}
