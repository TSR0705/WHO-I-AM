"use client";

import { BrowserCapabilities } from "../../types";

interface CapabilitiesPanelProps {
  capabilities: BrowserCapabilities | null;
  status?: "pending" | "scanning" | "completed";
}

export default function CapabilitiesPanel({
  capabilities,
  status = "completed"
}: CapabilitiesPanelProps) {
  if (!capabilities || status === "pending" || status === "scanning") {
    return (
      <div className="space-y-4 font-mono text-xs animate-pulse p-4">
        {[1, 2, 3, 4, 5].map((i) => (
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
          <span className="text-zinc-400">Cookies Enabled:</span>
          <span className={capabilities.cookiesEnabled ? "text-neon-cyan font-bold" : "text-neon-rose font-bold"}>
            {capabilities.cookiesEnabled ? "YES" : "NO"}
          </span>
        </div>
        <div className="flex justify-between border-b border-zinc-900/60 pb-2">
          <span className="text-zinc-400">LocalStorage:</span>
          <span className={capabilities.localStorageSupported ? "text-neon-cyan font-bold" : "text-neon-rose font-bold"}>
            {capabilities.localStorageSupported ? "YES" : "NO"}
          </span>
        </div>
        <div className="flex justify-between border-b border-zinc-900/60 pb-2">
          <span className="text-zinc-400">SessionStorage:</span>
          <span className={capabilities.sessionStorageSupported ? "text-neon-cyan font-bold" : "text-neon-rose font-bold"}>
            {capabilities.sessionStorageSupported ? "YES" : "NO"}
          </span>
        </div>
        <div className="flex justify-between border-b border-zinc-900/60 pb-2">
          <span className="text-zinc-400">IndexedDB Access:</span>
          <span className={capabilities.indexedDbSupported ? "text-neon-cyan font-bold" : "text-neon-rose font-bold"}>
            {capabilities.indexedDbSupported ? "YES" : "NO"}
          </span>
        </div>
        <div className="flex justify-between border-b border-zinc-900/60 pb-2">
          <span className="text-zinc-400">Service Workers:</span>
          <span className={capabilities.serviceWorkerSupported ? "text-neon-cyan font-bold" : "text-zinc-500"}>
            {capabilities.serviceWorkerSupported ? "SUPPORTED" : "UNSUPPORTED"}
          </span>
        </div>
        <div className="flex justify-between border-b border-zinc-900/60 pb-2">
          <span className="text-zinc-400">JavaScript Logic:</span>
          <span className="text-neon-emerald font-bold">ACTIVE</span>
        </div>
      </div>
    </div>
  );
}
