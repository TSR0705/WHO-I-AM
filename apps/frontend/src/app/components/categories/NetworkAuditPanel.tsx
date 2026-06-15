"use client";

import { ExposurData } from "../../types";

interface NetworkAuditPanelProps {
  data: ExposurData | null;
  isAdvancedMode: boolean;
  apiUrlUsed?: string;
  status?: "pending" | "scanning" | "completed";
}

export default function NetworkAuditPanel({
  data,
  isAdvancedMode,
  apiUrlUsed,
  status = "completed"
}: NetworkAuditPanelProps) {
  if (!data || status === "pending" || status === "scanning") {
    return (
      <div className="space-y-4.5 font-mono text-xs animate-pulse p-4">
        <div>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Public IP Address</span>
          <div className="h-4 bg-zinc-900/60 border border-zinc-900/30 rounded-md w-3/4 mt-1" />
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">ISP Network Provider</span>
          <div className="h-4 bg-zinc-900/60 border border-zinc-900/30 rounded-md w-1/2 mt-1" />
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Routing Location</span>
          <div className="h-4 bg-zinc-900/60 border border-zinc-900/30 rounded-md w-5/6 mt-1" />
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Vpn / Datacenter Route</span>
          <div className="h-4 bg-zinc-900/60 border border-zinc-900/30 rounded-md w-1/3 mt-1" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4.5 font-mono text-xs p-4">
      <div>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-0.5">Public IP Address</span>
        <span className="font-bold text-sm text-primary select-all tracking-wide">{data.ip}</span>
      </div>
      <div>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-0.5">ISP Network Provider</span>
        <span className="font-semibold text-zinc-200">{data.network?.isp || "Unknown"}</span>
      </div>
      {isAdvancedMode && (
        <>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-0.5">Autonomous System Number (ASN)</span>
            <span className="font-semibold text-zinc-350">{data.network?.asn || "Unknown"}</span>
          </div>
          {apiUrlUsed && (
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-0.5">API Endpoint Used</span>
              <span className="font-mono text-zinc-400 truncate block max-w-full" title={apiUrlUsed}>
                {apiUrlUsed}
              </span>
            </div>
          )}
        </>
      )}
      <div>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-0.5">Routing Location</span>
        <span className="font-semibold text-zinc-200">
          {data.location.city || "Unknown"}, {data.location.region || "Unknown"}, {data.location.country || "Unknown"}
        </span>
      </div>
      <div>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-0.5">Vpn / Datacenter Route</span>
        <span className="font-semibold text-zinc-200 flex items-center gap-1.5 mt-0.5">
          {data.anonymization.isVpnOrHosting ? (
            <span className="text-[10px] text-neon-emerald font-bold bg-neon-emerald/5 border border-neon-emerald/20 px-2.5 py-0.5 rounded-md">
              {data.anonymization.provider}
            </span>
          ) : (
            <span className="text-zinc-500 font-normal">No (Residential Range)</span>
          )}
        </span>
      </div>
      <div>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-0.5">Tor Relay Exit</span>
        <span className="font-semibold text-zinc-200 flex items-center gap-1.5 mt-0.5">
          {data.anonymization.isTorNode ? (
            <span className="text-[10px] text-neon-rose font-bold bg-neon-rose/5 border border-neon-rose/25 px-2.5 py-0.5 rounded-md animate-pulse">
              ACTIVE TOR EXIT
            </span>
          ) : (
            <span className="text-zinc-500 font-normal">No (Direct IP Route)</span>
          )}
        </span>
      </div>
      <div>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-0.5">Timezone</span>
        <span className="font-semibold text-zinc-350">{data.network?.timezone || "UTC"}</span>
      </div>
    </div>
  );
}
