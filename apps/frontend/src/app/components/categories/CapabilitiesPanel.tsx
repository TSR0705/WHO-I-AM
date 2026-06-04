"use client";

import { BrowserCapabilities } from "../../types";

interface CapabilitiesPanelProps {
  capabilities: BrowserCapabilities | null;
}

export default function CapabilitiesPanel({ capabilities }: CapabilitiesPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-3 font-mono text-xs">
      <div className="space-y-3">
        <div className="flex justify-between border-b border-zinc-900/60 pb-1.5">
          <span className="text-zinc-500">Cookies Enabled:</span>
          <span className={capabilities?.cookiesEnabled ? "text-neon-cyan font-bold" : "text-neon-rose"}>
            {capabilities?.cookiesEnabled ? "YES" : "NO"}
          </span>
        </div>
        <div className="flex justify-between border-b border-zinc-900/60 pb-1.5">
          <span className="text-zinc-500">LocalStorage:</span>
          <span className={capabilities?.localStorageSupported ? "text-neon-cyan font-bold" : "text-neon-rose"}>
            {capabilities?.localStorageSupported ? "YES" : "NO"}
          </span>
        </div>
        <div className="flex justify-between border-b border-zinc-900/60 pb-1.5">
          <span className="text-zinc-500">SessionStorage:</span>
          <span className={capabilities?.sessionStorageSupported ? "text-neon-cyan font-bold" : "text-neon-rose"}>
            {capabilities?.sessionStorageSupported ? "YES" : "NO"}
          </span>
        </div>
        <div className="flex justify-between border-b border-zinc-900/60 pb-1.5">
          <span className="text-zinc-500">IndexedDB Access:</span>
          <span className={capabilities?.indexedDbSupported ? "text-neon-cyan font-bold" : "text-neon-rose"}>
            {capabilities?.indexedDbSupported ? "YES" : "NO"}
          </span>
        </div>
        <div className="flex justify-between border-b border-zinc-900/60 pb-1.5">
          <span className="text-zinc-500">Service Workers:</span>
          <span className={capabilities?.serviceWorkerSupported ? "text-neon-cyan" : "text-zinc-600"}>
            {capabilities?.serviceWorkerSupported ? "SUPPORTED" : "UNSUPPORTED"}
          </span>
        </div>
        <div className="flex justify-between border-b border-zinc-900/60 pb-1.5">
          <span className="text-zinc-500">JavaScript Logic:</span>
          <span className="text-neon-emerald font-bold">ACTIVE</span>
        </div>
      </div>
    </div>
  );
}
