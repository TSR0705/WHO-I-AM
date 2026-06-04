"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { 
  Globe, 
  Cpu, 
  Shield, 
  MapPin, 
  RefreshCw, 
  Activity,
  Layers,
  Lock,
  Compass,
  AlertTriangle,
  CheckCircle,
  EyeOff
} from "lucide-react";
import { getCanvasFingerprint, getAudioFingerprint, getWebRTCLocalIPs } from "./utils/fingerprint";

// Dynamically import Leaflet Map to avoid SSR errors
const DynamicMap = dynamic(() => import("./components/Map"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-[320px] rounded-2xl bg-zinc-900/60 border border-zinc-800 animate-pulse flex items-center justify-center text-zinc-500 font-mono text-sm">
      INITIALIZING MAP ENGINE...
    </div>
  )
});

interface LocationData {
  city: string;
  region: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
}

interface VisitData {
  total: number;
  unique: number;
  yourVisits: number;
}

interface WhoAmIData {
  ip: string;
  browser: string;
  os: string;
  device: string;
  location: LocationData;
  visits: VisitData;
}

export default function Home() {
  const [data, setData] = useState<WhoAmIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localIPs, setLocalIPs] = useState<string[]>([]);
  const [canvasHash, setCanvasHash] = useState<string>("detecting...");
  const [audioHash, setAudioHash] = useState<string>("detecting...");
  const [activeTab, setActiveTab] = useState<"audit" | "education">("audit");
  const [customCoords, setCustomCoords] = useState<{ lat: number; lon: number; label: string } | null>(null);
  const [locating, setLocating] = useState(false);

  // Uniqueness analytics states
  const [canvasUniqueness, setCanvasUniqueness] = useState<number | null>(null);
  const [audioUniqueness, setAudioUniqueness] = useState<number | null>(null);
  const [totalChecked, setTotalChecked] = useState<number | null>(null);
  const [apiUrlUsed, setApiUrlUsed] = useState<string>("/api");

  // DNS Leak test states
  const [dnsLeakResolvers, setDnsLeakResolvers] = useState<any[]>([]);
  const [dnsChecking, setDnsChecking] = useState(false);
  const [dnsTested, setDnsTested] = useState(false);

  const apiEndpoints = [
    "/api/whoami",
    "http://localhost:3000/api/whoami",
    "http://localhost:3001/api/whoami",
    "http://127.0.0.1:3000/api/whoami",
    "http://127.0.0.1:3001/api/whoami"
  ];

  async function fetchWhoAmI() {
    setLoading(true);
    setError(null);
    let lastError: any = null;

    for (const url of apiEndpoints) {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        setData(result);
        setApiUrlUsed(url);
        setLoading(false);
        return;
      } catch (err) {
        lastError = err;
      }
    }

    setError(`Connection failed. Make sure the API backend is running. (Error: ${lastError?.message || 'Unknown'})`);
    setLoading(false);
  }

  useEffect(() => {
    fetchWhoAmI();

    // Trigger local STUN candidate check
    getWebRTCLocalIPs((ip) => {
      setLocalIPs(prev => prev.includes(ip) ? prev : [...prev, ip]);
    });

    // Resolve Canvas Fingerprint
    const canvas = getCanvasFingerprint();
    setCanvasHash(canvas);

    // Resolve Audio Fingerprint
    getAudioFingerprint().then(hash => setAudioHash(hash));
  }, []);

  // Submit fingerprint parameters to get comparative analytics
  useEffect(() => {
    if (!data || canvasHash === "detecting..." || audioHash === "detecting...") return;

    async function submitFingerprint() {
      const baseApiUrl = apiUrlUsed.replace(/\/whoami$/, "");
      const postUrl = `${baseApiUrl}/fingerprint`;

      try {
        const res = await fetch(postUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            canvasHash,
            audioHash,
            browser: data?.browser,
            os: data?.os,
            device: data?.device
          })
        });
        if (res.ok) {
          const stats = await res.json();
          setCanvasUniqueness(stats.canvas.sharedPercentage);
          setAudioUniqueness(stats.audio.sharedPercentage);
          setTotalChecked(stats.totalChecked);
        }
      } catch (e) {
        console.warn("Failed to submit fingerprint:", e);
      }
    }

    submitFingerprint();
  }, [data, canvasHash, audioHash, apiUrlUsed]);

  const runDnsLeakTest = async () => {
    if (dnsChecking) return;
    setDnsChecking(true);
    setDnsTested(false);
    setDnsLeakResolvers([]);

    try {
      const baseApiUrl = apiUrlUsed.replace(/\/whoami$/, "");
      const initRes = await fetch(`${baseApiUrl}/dns-leak/init`);
      if (!initRes.ok) throw new Error("Init failed");
      const { token, testSubdomain } = await initRes.json();

      // Trigger DNS query
      try {
        await fetch(`http://${testSubdomain}/health`, { mode: "no-cors", signal: AbortSignal.timeout(1500) });
      } catch (e) {
        // Expected network connection failure, DNS resolution has run
      }

      // Wait 2 seconds for DNS packet capture
      await new Promise(r => setTimeout(r, 2000));

      const checkRes = await fetch(`${baseApiUrl}/dns-leak/check?token=${token}`);
      if (checkRes.ok) {
        const result = await checkRes.json();
        setDnsLeakResolvers(result.resolvers || []);
        setDnsTested(true);
      }
    } catch (e) {
      console.warn("DNS leak test failed:", e);
    } finally {
      setDnsChecking(false);
    }
  };

  const handleBrowserLocate = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setCustomCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          label: "Your Device Location (Browser GPS)"
        });
      },
      (err) => {
        setLocating(false);
        alert(`Could not get location: ${err.message}. If you are on HTTP, please note that secure location requests are restricted to HTTPS/Localhost.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const getPrivacyScore = () => {
    let score = 95;
    if (localIPs.length > 0) score -= 15; // WebRTC leak
    if (data && data.ip.includes("127.0.0.1")) score += 5; // Local loopback test
    return Math.max(10, Math.min(100, score));
  };

  const score = getPrivacyScore();
  const mapCoords = customCoords || (data?.location?.latitude != null && data?.location?.longitude != null ? {
    lat: data.location.latitude,
    lon: data.location.longitude,
    label: `Approximate Geolocation Node (${data.ip})`
  } : null);

  return (
    <div className="flex flex-col min-h-screen bg-[#07080a] text-zinc-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Cyber Grid Overlay background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370c_1px,transparent_1px),linear-gradient(to_bottom,#1f29370c_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Header banner */}
      <header className="relative border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-950/50 border border-cyan-800/40 rounded-xl shadow-inner shadow-cyan-950">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white font-mono">
                WhoAmI<span className="text-cyan-400">.Audit</span>
              </h1>
              <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">
                Digital Footprint Sandbox
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab("audit")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium font-mono transition-all border ${
                activeTab === "audit" 
                  ? "bg-cyan-950/40 text-cyan-400 border-cyan-800/50" 
                  : "bg-transparent text-zinc-400 border-transparent hover:text-zinc-200"
              }`}
            >
              PRIVACY AUDIT
            </button>
            <button 
              onClick={() => setActiveTab("education")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium font-mono transition-all border ${
                activeTab === "education" 
                  ? "bg-cyan-950/40 text-cyan-400 border-cyan-800/50" 
                  : "bg-transparent text-zinc-400 border-transparent hover:text-zinc-200"
              }`}
            >
              LEARN TRACKING
            </button>
            <button 
              onClick={fetchWhoAmI}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850 transition-colors"
              title="Refresh Audit"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 relative z-20">
        
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-cyan-800 border-t-cyan-400 animate-spin" />
            <div className="text-sm font-mono text-cyan-500 uppercase tracking-widest animate-pulse">
              Running Diagnostic Analysis...
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="max-w-xl mx-auto bg-red-950/20 border border-red-900/40 rounded-2xl p-6 text-center shadow-lg">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-400 mb-2 font-mono">DIAGNOSTIC FAILURE</h3>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">{error}</p>
            <button 
              onClick={fetchWhoAmI}
              className="px-5 py-2.5 rounded-xl bg-red-900/40 hover:bg-red-800/40 border border-red-800 text-red-200 text-sm font-mono transition-all shadow-md"
            >
              RETRY SHAKING CONNECTION
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <div>
            {activeTab === "audit" ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Column 1: Core Identity Details */}
                <div className="space-y-8 lg:col-span-2">
                  
                  {/* Status Banner Widget */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-3 text-zinc-800 group-hover:text-zinc-700 transition-colors">
                        <Lock className="w-12 h-12" />
                      </div>
                      <div className="text-xs text-zinc-500 font-mono uppercase tracking-widest">
                        Privacy Score
                      </div>
                      <div className="text-3xl font-extrabold font-mono mt-2 flex items-baseline gap-1">
                        <span className={score >= 80 ? "text-emerald-400" : score >= 50 ? "text-yellow-400" : "text-red-400"}>
                          {score}
                        </span>
                        <span className="text-zinc-600 text-sm">/ 100</span>
                      </div>
                      <div className="text-xs text-zinc-400 font-mono mt-2">
                        {score >= 80 ? "Excellent Protection" : score >= 50 ? "Moderate Exposure" : "Vulnerable System Configuration"}
                      </div>
                    </div>

                    <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 shadow-sm relative overflow-hidden group sm:col-span-2">
                      <div className="absolute top-0 right-0 p-3 text-zinc-800 group-hover:text-zinc-700 transition-colors">
                        <Activity className="w-12 h-12" />
                      </div>
                      <div className="text-xs text-zinc-500 font-mono uppercase tracking-widest">
                        Telemetry Log
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div>
                          <div className="text-2xl font-bold font-mono text-cyan-400">{data.visits.total}</div>
                          <div className="text-[10px] text-zinc-500 font-mono uppercase">Total Visits</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold font-mono text-cyan-400">{data.visits.unique}</div>
                          <div className="text-[10px] text-zinc-500 font-mono uppercase">Unique Visitors</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold font-mono text-cyan-400">{data.visits.yourVisits}</div>
                          <div className="text-[10px] text-zinc-500 font-mono uppercase">Your Sessions</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Identity Audit Cards */}
                  <div className="bg-zinc-950/80 border border-zinc-900 rounded-3xl overflow-hidden shadow-sm">
                    <div className="px-6 py-5 border-b border-zinc-900 bg-zinc-900/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-cyan-400" />
                        <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">Network Identity</h3>
                      </div>
                      <div className="text-[10px] bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 px-2 py-0.5 rounded-full font-mono uppercase">
                        Proxy Aware
                      </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <div className="text-[10px] text-zinc-500 font-mono uppercase">Detected IP Address</div>
                          <div className="text-lg font-bold font-mono text-cyan-300 mt-1 select-all">{data.ip}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-zinc-500 font-mono uppercase">Platform Operating System</div>
                          <div className="text-sm font-bold font-mono text-zinc-300 mt-1">{data.os}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-zinc-500 font-mono uppercase">Browser Agent Profile</div>
                          <div className="text-sm font-bold font-mono text-zinc-300 mt-1">{data.browser}</div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="text-[10px] text-zinc-500 font-mono uppercase">Device Form Factor</div>
                          <div className="text-sm font-bold font-mono text-zinc-300 mt-1 uppercase tracking-wide">{data.device}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-zinc-500 font-mono uppercase">Resolved Geolocation</div>
                          <div className="text-sm font-bold font-mono text-zinc-300 mt-1">
                            {data.location.city || "Unknown City"}, {data.location.region || "Unknown Region"}, {data.location.country || "Unknown Country"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-zinc-500 font-mono uppercase">Network Coordinates</div>
                          <div className="text-sm font-bold font-mono text-zinc-300 mt-1">
                            {data.location.latitude != null && data.location.longitude != null 
                              ? `${data.location.latitude.toFixed(4)}, ${data.location.longitude.toFixed(4)}` 
                              : "No Coordinates"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Browser Fingerprinting & Local Leak Detection */}
                  <div className="bg-zinc-950/80 border border-zinc-900 rounded-3xl overflow-hidden shadow-sm">
                    <div className="px-6 py-5 border-b border-zinc-900 bg-zinc-900/20 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">Browser Fingerprint Sandbox</h3>
                    </div>

                    <div className="divide-y divide-zinc-900">
                      
                      {/* WebRTC Local IP Leak */}
                      <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-zinc-200 font-mono">WebRTC Local IP Leak Test</h4>
                          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                            WebSockets and WebRTC can expose your local LAN IP (e.g. 192.168.x.x) directly to scripts, bypassing standard VPN tunnels.
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 min-w-[150px]">
                          {localIPs.length > 0 ? (
                            <div className="w-full">
                              <span className="flex items-center gap-1.5 text-xs text-amber-500 font-mono font-bold bg-amber-950/30 border border-amber-900/30 px-3 py-1.5 rounded-xl justify-center">
                                <AlertTriangle className="w-3.5 h-3.5" /> LEAK DETECTED
                              </span>
                              <div className="text-[10px] text-zinc-500 font-mono text-right mt-1">
                                Exposed: {localIPs.join(", ")}
                              </div>
                            </div>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-bold bg-emerald-950/30 border border-emerald-900/30 px-3 py-1.5 rounded-xl justify-center w-full">
                              <CheckCircle className="w-3.5 h-3.5" /> SECURE (NO LEAK)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* DNS Leak Test */}
                      <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-zinc-200 font-mono">DNS Tunnel Leak Audit</h4>
                          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                            Verifies if your DNS lookup requests are routing through your secure VPN tunnel or leaking to your local ISP DNS servers.
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 min-w-[200px] w-full sm:w-auto">
                          {!dnsTested ? (
                            <button
                              onClick={runDnsLeakTest}
                              disabled={dnsChecking}
                              className="px-4 py-1.5 w-full rounded-xl bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/50 text-cyan-400 text-xs font-mono font-bold transition-all disabled:opacity-50"
                            >
                              {dnsChecking ? "TESTING TUNNELS..." : "RUN DNS LEAK TEST"}
                            </button>
                          ) : (
                            <div className="w-full text-right">
                              {dnsLeakResolvers.length > 0 ? (
                                <div className="space-y-1.5">
                                  <span className="flex items-center gap-1.5 text-xs text-red-500 font-mono font-bold bg-red-950/30 border border-red-900/30 px-3 py-1.5 rounded-xl justify-center">
                                    <AlertTriangle className="w-3.5 h-3.5" /> LEAK DETECTED
                                  </span>
                                  <div className="text-[10px] text-zinc-500 font-mono">
                                    Resolvers: {dnsLeakResolvers.map(r => `${r.ip} (${r.country})`).join(", ")}
                                  </div>
                                </div>
                              ) : (
                                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-bold bg-emerald-950/30 border border-emerald-900/30 px-3 py-1.5 rounded-xl justify-center w-full">
                                  <CheckCircle className="w-3.5 h-3.5" /> SECURE (NO LEAK)
                                </span>
                              )}
                              <button
                                onClick={runDnsLeakTest}
                                className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono underline mt-1"
                              >
                                Retest
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Canvas Rendering Fingerprint */}
                      <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-zinc-200 font-mono">HTML5 Canvas Rendering Hash</h4>
                          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                            Draws a hidden 2D shape in your browser. Differences in pixel rendering engine outputs create a unique hardware identifier.
                          </p>
                        </div>
                        <div className="min-w-[150px] text-right font-mono">
                          <div className="text-xs bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 rounded-xl inline-block text-zinc-300 font-semibold shadow-inner select-all">
                            {canvasHash}
                          </div>
                          {canvasUniqueness !== null && (
                            <div className="text-[10px] text-zinc-500 mt-1">
                              Shared by: <span className="text-cyan-400 font-bold">{canvasUniqueness}%</span> of users
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Web Audio API Fingerprint */}
                      <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-zinc-200 font-mono">Web Audio Context Hash</h4>
                          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                            Generates a high-frequency triangle wave and measures mathematical variance in the browser's hardware sound processing code.
                          </p>
                        </div>
                        <div className="min-w-[150px] text-right font-mono">
                          <div className="text-xs bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 rounded-xl inline-block text-zinc-300 font-semibold shadow-inner select-all">
                            {audioHash}
                          </div>
                          {audioUniqueness !== null && (
                            <div className="text-[10px] text-zinc-500 mt-1">
                              Shared by: <span className="text-cyan-400 font-bold">{audioUniqueness}%</span> of users
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

                {/* Column 2: Geographic & Controls */}
                <div className="space-y-8">
                  
                  {/* Interactive Map card */}
                  <div className="bg-zinc-950/80 border border-zinc-900 rounded-3xl overflow-hidden shadow-sm p-4 space-y-4">
                    <div className="flex items-center gap-2 px-2 py-1">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">Spatial Mapping</h3>
                    </div>

                    {mapCoords ? (
                      <DynamicMap 
                        lat={mapCoords.lat} 
                        lon={mapCoords.lon} 
                        label={mapCoords.label} 
                      />
                    ) : (
                      <div className="w-full h-[320px] rounded-2xl bg-zinc-900/30 border border-zinc-800 flex flex-col items-center justify-center p-6 text-center text-zinc-500 font-mono">
                        <EyeOff className="w-8 h-8 mb-2 text-zinc-600" />
                        <span className="text-xs uppercase tracking-wider font-bold text-zinc-400">NO COORDINATES PRESENT</span>
                        <span className="text-[10px] mt-1 text-zinc-600 leading-relaxed">Local address or proxy shields are masking server geolocation. Try locating manually below.</span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        onClick={handleBrowserLocate}
                        disabled={locating}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-900/40 hover:bg-cyan-800/40 border border-cyan-800 text-cyan-200 text-xs font-mono font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Compass className="w-4 h-4 animate-spin-slow" />
                        {locating ? "LOCATING..." : "REQUEST BROWSER GPS"}
                      </button>
                      
                      {customCoords && (
                        <button
                          onClick={() => setCustomCoords(null)}
                          className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-mono font-bold transition-all shadow-md"
                        >
                          RESET
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick Tips card */}
                  <div className="bg-zinc-950/80 border border-zinc-900 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider border-b border-zinc-900 pb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-cyan-400" /> Mitigation Tips
                    </h3>
                    <ul className="space-y-3 text-xs text-zinc-400 leading-relaxed font-mono">
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">»</span>
                        <span>Disable WebRTC inside Firefox/Chrome settings or use extension helpers to seal local IP leaks.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">»</span>
                        <span>Use privacy extensions to block canvas fingerprint requests or add random canvas rendering noise.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">»</span>
                        <span>Configure your client resolver to force secure DNS over HTTPS (DoH) to bypass DNS leakage.</span>
                      </li>
                    </ul>
                  </div>

                </div>

              </div>
            ) : (
              /* Education Tab */
              <div className="max-w-4xl mx-auto bg-zinc-950/80 border border-zinc-900 rounded-3xl p-8 shadow-lg space-y-8">
                <div>
                  <h2 className="text-lg font-bold text-white font-mono uppercase tracking-wider border-b border-zinc-900 pb-4">
                    Understanding Digital Tracking
                  </h2>
                  <p className="text-zinc-400 text-sm mt-4 leading-relaxed">
                    Cookies are no longer the primary tool for online user correlation. Modern ad-tech brokers use hardware fingerprint profiling to reconstruct and track your online identity across private domains.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="space-y-3 border-l border-cyan-800/40 pl-4 py-1">
                    <h4 className="text-sm font-bold text-zinc-200 font-mono">HTML5 Canvas Profiling</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Every graphics driver, GPU chip, and system font library processes curves and anti-aliasing pixel weights slightly differently. By forcing the browser to render a complex hidden texture, third-party code produces a distinct system signature that operates without storing cache keys.
                    </p>
                  </div>

                  <div className="space-y-3 border-l border-cyan-800/40 pl-4 py-1">
                    <h4 className="text-sm font-bold text-zinc-200 font-mono">WebRTC Local IP Leaking</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      WebRTC ICE candidate negotiations bypass normal application wrappers (like standard browser HTTP proxies). By generating candidate offers, third-party sites can map your home router gateway and local subnet ranges even while utilizing active VPN channels.
                    </p>
                  </div>

                  <div className="space-y-3 border-l border-cyan-800/40 pl-4 py-1">
                    <h4 className="text-sm font-bold text-zinc-200 font-mono">AudioContext Synthesis</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Just like GPU chipsets differ in rendering graphics, your computer's built-in sound card chipsets process synthetic sound waves (using AudioContext nodes) with mathematical variations. This leaves a reliable audio processing signature that can be hashed.
                    </p>
                  </div>

                  <div className="space-y-3 border-l border-cyan-800/40 pl-4 py-1">
                    <h4 className="text-sm font-bold text-zinc-200 font-mono">HTTP Headers Leakage</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Your browser automatically broadcasts details like your preferred languages (`Accept-Language`), client capabilities, and viewport dimensions. When cross-referenced with your network ASN, this data is often sufficient to uniquely identify your browsing session.
                    </p>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 text-center text-xs text-zinc-600 font-mono mt-auto relative z-30">
        <div>
          WHOAMI.AUDIT &copy; 2026 &middot; PROTOTYPE DEVELOPMENT
        </div>
      </footer>

    </div>
  );
}
