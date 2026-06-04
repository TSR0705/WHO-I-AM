"use client";

interface WebRTCDNSPanelProps {
  localIPs: string[];
  dnsTested: boolean;
  dnsLeakResolvers: any[];
  isAdvancedMode: boolean;
}

export default function WebRTCDNSPanel({
  localIPs,
  dnsTested,
  dnsLeakResolvers,
  isAdvancedMode
}: WebRTCDNSPanelProps) {
  return (
    <div className="divide-y divide-zinc-900/60 font-mono text-xs">
      <div className="p-5 flex justify-between items-center gap-4">
        <div>
          <h4 className="font-bold text-zinc-200 uppercase tracking-wide text-[10px]">
            {isAdvancedMode ? "WebRTC ICE Leak candidates" : "Local Network Exposure"}
          </h4>
          <p className="text-[9px] text-zinc-500 mt-0.5 leading-normal max-w-[180px]">
            WebRTC exposes your local router client subnet, bypassing IP shields.
          </p>
        </div>
        <div className="text-right">
          {localIPs.length > 0 ? (
            <div>
              <span className="text-[10px] text-neon-amber font-bold bg-neon-amber/10 border border-neon-amber/20 px-2 py-0.5 rounded-md animate-pulse">
                EXPOSED
              </span>
              <div className="text-[9px] text-zinc-500 mt-1 max-w-[100px] truncate" title={localIPs.join(", ")}>
                Leaks: {localIPs.join(", ")}
              </div>
            </div>
          ) : (
            <span className="text-[10px] text-neon-emerald font-bold bg-neon-emerald/10 border border-neon-emerald/20 px-2 py-0.5 rounded-md">
              SECURE
            </span>
          )}
        </div>
      </div>

      <div className="p-5 flex justify-between items-center gap-4">
        <div>
          <h4 className="font-bold text-zinc-200 uppercase tracking-wide text-[10px]">
            {isAdvancedMode ? "DNS Resolver Leak audit" : "Domain Query Log Check"}
          </h4>
          <p className="text-[9px] text-zinc-500 mt-0.5 leading-normal max-w-[180px]">
            Checks if resolver subnets bypass your secure VPN tunnel.
          </p>
        </div>
        <div className="text-right">
          {dnsTested ? (
            dnsLeakResolvers.length > 0 ? (
              <div>
                <span className="text-[10px] text-neon-rose font-bold bg-neon-rose/10 border border-neon-rose/25 px-2 py-0.5 rounded-md animate-pulse">
                  LEAK DETECTED
                </span>
                <div className="text-[9px] text-zinc-500 mt-1 truncate max-w-[100px]" title={dnsLeakResolvers.map(r => r.ip).join(", ")}>
                  DNS: {dnsLeakResolvers.map(r => r.ip).join(", ")}
                </div>
              </div>
            ) : (
              <span className="text-[10px] text-neon-emerald font-bold bg-neon-emerald/10 border border-neon-emerald/20 px-2 py-0.5 rounded-md">
                SECURE
              </span>
            )
          ) : (
            <span className="text-[9px] text-zinc-500 font-bold uppercase">UNTESTED</span>
          )}
        </div>
      </div>
    </div>
  );
}
