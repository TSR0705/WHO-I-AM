"use client";

import { WhoAmIData } from "../../types";

interface NetworkAuditPanelProps {
  data: WhoAmIData;
  isAdvancedMode: boolean;
  apiUrlUsed?: string;
}

export default function NetworkAuditPanel({
  data,
  isAdvancedMode,
  apiUrlUsed
}: NetworkAuditPanelProps) {
  return (
    <div className="space-y-4 font-mono text-xs">
      <div>
        <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Public IP Address</span>
        <span className="font-bold text-neon-cyan select-all tracking-wide">{data.ip}</span>
      </div>
      <div>
        <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">ISP Network Provider</span>
        <span className="font-bold text-zinc-300">{data.network?.isp || "Unknown"}</span>
      </div>
      {isAdvancedMode && (
        <>
          <div>
            <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Autonomous System Number (ASN)</span>
            <span className="font-bold text-zinc-300">{data.network?.asn || "Unknown"}</span>
          </div>
          {apiUrlUsed && (
            <div>
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">API Endpoint Used</span>
              <span className="font-bold text-zinc-300 truncate block max-w-full" title={apiUrlUsed}>
                {apiUrlUsed}
              </span>
            </div>
          )}
        </>
      )}
      <div>
        <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Routing Location</span>
        <span className="font-bold text-zinc-300">
          {data.location.city || "Unknown"}, {data.location.region || "Unknown"}, {data.location.country || "Unknown"}
        </span>
      </div>
      <div>
        <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Vpn / Datacenter Route</span>
        <span className="font-bold text-zinc-300 flex items-center gap-1.5">
          {data.anonymization.isVpnOrHosting ? (
            <span className="text-neon-emerald font-bold bg-neon-emerald/10 border border-neon-emerald/20 px-2 py-0.5 rounded-md">
              {data.anonymization.provider}
            </span>
          ) : (
            <span className="text-zinc-500 font-normal">No (Datacenter Secure)</span>
          )}
        </span>
      </div>
      <div>
        <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Tor Relay Exit</span>
        <span className="font-bold text-zinc-300">
          {data.anonymization.isTorNode ? (
            <span className="text-neon-emerald font-bold bg-neon-emerald/10 border border-neon-emerald/20 px-2 py-0.5 rounded-md">
              ACTIVE TOR exit RELAY
            </span>
          ) : (
            <span className="text-zinc-500 font-normal">No (Direct IP Route)</span>
          )}
        </span>
      </div>
      <div>
        <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Timezone</span>
        <span className="font-bold text-zinc-300">{data.network?.timezone || "UTC"}</span>
      </div>
    </div>
  );
}
