"use client";

interface WebRTCDNSPanelProps {
  localIPs: string[];
  dnsTested: boolean;
  dnsLeakResolvers: any[];
  isAdvancedMode: boolean;
  status?: "pending" | "scanning" | "completed";
}

export default function WebRTCDNSPanel({
  localIPs,
  dnsTested,
  dnsLeakResolvers,
  isAdvancedMode,
  status = "completed"
}: WebRTCDNSPanelProps) {
  if (status === "pending" || status === "scanning") {
    return (
      <div className="divide-y divide-zinc-900/60 font-mono text-xs animate-pulse">
        <div className="p-5 flex justify-between items-center gap-4">
          <div className="space-y-1">
            <div className="h-3.5 bg-zinc-900/60 border border-zinc-900/30 rounded w-2/3" />
            <div className="h-3 bg-zinc-900/60 border border-zinc-900/30 rounded w-1/2" />
          </div>
          <div className="h-6 bg-zinc-900/60 border border-zinc-900/30 rounded-md w-14" />
        </div>
        <div className="p-5 flex justify-between items-center gap-4">
          <div className="space-y-1">
            <div className="h-3.5 bg-zinc-900/60 border border-zinc-900/30 rounded w-1/2" />
            <div className="h-3 bg-zinc-900/60 border border-zinc-900/30 rounded w-3/4" />
          </div>
          <div className="h-6 bg-zinc-900/60 border border-zinc-900/30 rounded-md w-16" />
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-900/60 font-mono text-xs">
      <div className="p-5 flex justify-between items-center gap-4">
        <div>
          <h4 className="font-bold text-zinc-300 uppercase tracking-wide text-[10px]">
            {isAdvancedMode ? "WebRTC ICE Leak candidates" : "Local Network Exposure"}
          </h4>
          <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal max-w-[220px]">
            WebRTC exposes your local router client subnet, bypassing IP shields.
          </p>
        </div>
        <div className="text-right">
          {localIPs.length > 0 ? (
            <div>
              <span className="text-[9px] text-neon-rose font-bold bg-neon-rose/5 border border-neon-rose/25 px-2 py-0.5 rounded-md animate-pulse">
                LEAK EXPOSED
              </span>
              <div className="text-[9px] text-zinc-400 mt-1 max-w-[120px] truncate font-semibold" title={localIPs.join(", ")}>
                IPs: {localIPs.join(", ")}
              </div>
            </div>
          ) : (
            <span className="text-[9px] text-neon-emerald font-bold bg-neon-emerald/5 border border-neon-emerald/20 px-2.5 py-0.5 rounded-md">
              SECURE
            </span>
          )}
        </div>
      </div>

      <div className="p-5 flex justify-between items-center gap-4">
        <div>
          <h4 className="font-bold text-zinc-300 uppercase tracking-wide text-[10px]">
            {isAdvancedMode ? "DNS Resolver Leak audit" : "Domain Query Log Check"}
          </h4>
          <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal max-w-[220px]">
            Checks if resolver subnets bypass your secure VPN tunnel.
          </p>
        </div>
        <div className="text-right">
          {dnsTested ? (
            dnsLeakResolvers.length > 0 ? (
              <div>
                <span className="text-[9px] text-neon-rose font-bold bg-neon-rose/5 border border-neon-rose/25 px-2 py-0.5 rounded-md animate-pulse">
                  LEAK DETECTED
                </span>
                <div className="text-[9px] text-zinc-400 mt-1 truncate max-w-[120px] font-semibold" title={dnsLeakResolvers.map(r => r.ip).join(", ")}>
                  DNS: {dnsLeakResolvers.map(r => r.ip).join(", ")}
                </div>
              </div>
            ) : (
              <span className="text-[9px] text-neon-emerald font-bold bg-neon-emerald/5 border border-neon-emerald/20 px-2.5 py-0.5 rounded-md">
                SECURE
              </span>
            )
          ) : (
            <span className="text-[9px] text-zinc-500 font-bold bg-zinc-950/60 border border-zinc-900 px-2 py-0.5 rounded-md uppercase">
              QUEUED
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
