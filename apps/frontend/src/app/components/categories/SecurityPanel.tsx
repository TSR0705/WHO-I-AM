"use client";

import { SecurityConfig } from "../../types";

interface SecurityPanelProps {
  securityConfig: SecurityConfig | null;
}

export default function SecurityPanel({ securityConfig }: SecurityPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-3 font-mono text-xs">
      <div className="space-y-3">
        <div className="flex justify-between border-b border-zinc-900/60 pb-1.5">
          <span className="text-zinc-500">HTTPS Encryption:</span>
          <span className={securityConfig?.isHttps ? "text-neon-emerald font-bold" : "text-neon-rose font-bold"}>
            {securityConfig?.isHttps ? "ACTIVE" : "INSECURE"}
          </span>
        </div>
        <div className="flex justify-between border-b border-zinc-900/60 pb-1.5">
          <span className="text-zinc-500">Secure Context Mode:</span>
          <span className={securityConfig?.isSecureContext ? "text-neon-emerald font-bold" : "text-neon-rose font-bold"}>
            {securityConfig?.isSecureContext ? "YES" : "NO"}
          </span>
        </div>
        <div className="flex justify-between border-b border-zinc-900/60 pb-1.5">
          <span className="text-zinc-500">Referrer Leakage:</span>
          <span
            className={
              securityConfig?.referrer !== "None"
                ? "text-neon-amber font-bold truncate max-w-[120px]"
                : "text-neon-emerald"
            }
            title={securityConfig?.referrer}
          >
            {securityConfig?.referrer === "None" ? "BLOCKED" : securityConfig?.referrer}
          </span>
        </div>
        <div className="flex justify-between border-b border-zinc-900/60 pb-1.5">
          <span className="text-zinc-500">Mixed Content Block:</span>
          <span className={securityConfig?.mixedContentBlocked ? "text-neon-emerald font-bold" : "text-neon-amber"}>
            {securityConfig?.mixedContentBlocked ? "ENFORCED" : "INACTIVE"}
          </span>
        </div>
      </div>
    </div>
  );
}
