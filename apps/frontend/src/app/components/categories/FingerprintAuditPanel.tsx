"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface WebGLInfo {
  hash: string;
  vendor: string;
  renderer: string;
}

interface FingerprintAuditPanelProps {
  canvasHash: string;
  webglInfo: WebGLInfo;
  audioHash: string;
  canvasUniqueness: number | null;
  audioUniqueness: number | null;
  isAdvancedMode: boolean;
  status?: "pending" | "scanning" | "completed";
}

function CopyableHash({ label, hash, subText }: { label: string; hash: string; subText?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!hash || hash === "detecting..." || hash === "blocked" || hash === "not-supported") return;
    navigator.clipboard.writeText(hash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isCopyable = hash && hash !== "detecting..." && hash !== "blocked" && hash !== "not-supported";

  return (
    <div className="p-4 flex flex-col gap-2">
      <div>
        <h4 className="font-bold text-zinc-300 uppercase tracking-wide text-[10px]">
          {label}
        </h4>
        {subText && (
          <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal">
            {subText}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 text-xs bg-zinc-950/60 border border-zinc-900 px-3.5 py-2.5 rounded-xl font-bold select-all tracking-wide text-zinc-300 truncate font-mono">
          {hash}
        </div>
        {isCopyable && (
          <button
            onClick={handleCopy}
            className="p-2.5 bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-sm"
            title="Copy Hash"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-neon-emerald" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function FingerprintAuditPanel({
  canvasHash,
  webglInfo,
  audioHash,
  canvasUniqueness,
  audioUniqueness,
  isAdvancedMode,
  status = "completed"
}: FingerprintAuditPanelProps) {
  if (status === "pending" || status === "scanning") {
    return (
      <div className="divide-y divide-zinc-900/60 font-mono text-xs animate-pulse">
        <div className="p-4 flex flex-col gap-2">
          <div className="h-3.5 bg-zinc-900/60 border border-zinc-900/30 rounded w-1/2" />
          <div className="h-9 bg-zinc-900/60 border border-zinc-900/30 rounded-xl w-full" />
        </div>
        <div className="p-4 flex flex-col gap-2">
          <div className="h-3.5 bg-zinc-900/60 border border-zinc-900/30 rounded w-1/3" />
          <div className="h-9 bg-zinc-900/60 border border-zinc-900/30 rounded-xl w-full" />
        </div>
        <div className="p-4 flex flex-col gap-2">
          <div className="h-3.5 bg-zinc-900/60 border border-zinc-900/30 rounded w-1/2" />
          <div className="h-9 bg-zinc-900/60 border border-zinc-900/30 rounded-xl w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-900/60 font-mono text-xs">
      <CopyableHash
        label={isAdvancedMode ? "HTML5 Canvas Render Hash" : "Unique Canvas Signature"}
        hash={canvasHash}
        subText="Assesses graphic GPU variance. Uniquely logs device outputs."
      />
      {canvasUniqueness !== null && (
        <div className="px-4 pb-4 -mt-1 text-[10px] text-zinc-500">
          Shared by: <strong className="text-neon-cyan font-bold">{canvasUniqueness.toFixed(2)}%</strong> of visitors
        </div>
      )}

      <CopyableHash
        label="WebGL Hardware Synthesis"
        hash={webglInfo?.hash || "detecting..."}
        subText="Queries graphic card details and shader configurations."
      />
      {isAdvancedMode && webglInfo?.renderer && (
        <div className="px-4 pb-4 -mt-1 text-[10px] text-zinc-500 truncate" title={webglInfo.renderer}>
          GPU: <span className="text-zinc-400 font-semibold">{webglInfo.renderer}</span>
        </div>
      )}

      <CopyableHash
        label="Web Audio Context Synthesis"
        hash={audioHash}
        subText="Checks sound processing variance using synthesized frequencies."
      />
      {audioUniqueness !== null && (
        <div className="px-4 pb-4 -mt-1 text-[10px] text-zinc-500">
          Shared by: <strong className="text-neon-cyan font-bold">{audioUniqueness.toFixed(2)}%</strong> of visitors
        </div>
      )}
    </div>
  );
}
