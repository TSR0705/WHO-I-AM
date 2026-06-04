"use client";

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
}

export default function FingerprintAuditPanel({
  canvasHash,
  webglInfo,
  audioHash,
  canvasUniqueness,
  audioUniqueness,
  isAdvancedMode
}: FingerprintAuditPanelProps) {
  return (
    <div className="divide-y divide-zinc-900/60 font-mono text-xs">
      <div className="p-4 flex flex-col gap-2">
        <div>
          <h4 className="font-bold text-zinc-200 uppercase tracking-wide text-[10px]">
            {isAdvancedMode ? "HTML5 Canvas Render Hash" : "Unique Rendering Signature"}
          </h4>
          <p className="text-[9px] text-zinc-500 mt-0.5 leading-normal">
            Assesses graphic GPU variance. Uniquely logs device outputs.
          </p>
        </div>
        <div className="text-xs bg-zinc-950/60 border border-zinc-900/80 px-3.5 py-2 rounded-xl font-bold select-all tracking-wide text-zinc-300">
          {canvasHash ? (canvasHash.length > 16 ? `${canvasHash.substring(0, 16)}...` : canvasHash) : "detecting..."}
        </div>
        {canvasUniqueness !== null && (
          <div className="text-[9px] text-zinc-500">
            Shared by: <strong className="text-neon-cyan">{canvasUniqueness.toFixed(2)}%</strong> of visitors
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2">
        <div>
          <h4 className="font-bold text-zinc-200 uppercase tracking-wide text-[10px]">WebGL Hardware Synthesis</h4>
          <p className="text-[9px] text-zinc-500 mt-0.5 leading-normal">
            Queries graphic card details and shader configs.
          </p>
        </div>
        <div className="text-xs bg-zinc-950/60 border border-zinc-900/80 px-3.5 py-2 rounded-xl font-bold select-all tracking-wide text-zinc-300">
          {webglInfo?.hash ? (webglInfo.hash.length > 16 ? `${webglInfo.hash.substring(0, 16)}...` : webglInfo.hash) : "detecting..."}
        </div>
        {isAdvancedMode && webglInfo?.renderer && (
          <div className="text-[9px] text-zinc-500 truncate" title={webglInfo.renderer}>
            GPU: {webglInfo.renderer}
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2">
        <div>
          <h4 className="font-bold text-zinc-200 uppercase tracking-wide text-[10px]">Web Audio context synthesis</h4>
          <p className="text-[9px] text-zinc-500 mt-0.5 leading-normal">
            Checks sound processing variance using synthesized frequencies.
          </p>
        </div>
        <div className="text-xs bg-zinc-950/60 border border-zinc-900/80 px-3.5 py-2 rounded-xl font-bold select-all tracking-wide text-zinc-300">
          {audioHash ? (audioHash.length > 16 ? `${audioHash.substring(0, 16)}...` : audioHash) : "detecting..."}
        </div>
        {audioUniqueness !== null && (
          <div className="text-[9px] text-zinc-500">
            Shared by: <strong className="text-neon-cyan">{audioUniqueness.toFixed(2)}%</strong> of visitors
          </div>
        )}
      </div>
    </div>
  );
}
