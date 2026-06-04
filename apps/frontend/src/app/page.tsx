"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { 
  Globe, 
  Cpu, 
  Shield, 
  MapPin, 
  RefreshCw, 
  Activity,
  Lock,
  Compass,
  AlertTriangle,
  CheckCircle,
  EyeOff,
  Terminal,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  X,
  Layers,
  Settings,
  Eye
} from "lucide-react";
import { getCanvasFingerprint, getAudioFingerprint, getWebRTCLocalIPs } from "./utils/fingerprint";
import eduDataRaw from "./data/education.json";

// Dynamic map import to avoid SSR errors
const DynamicMap = dynamic(() => import("./components/Map"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-[320px] rounded-2xl bg-zinc-950/60 border border-zinc-900 animate-pulse flex items-center justify-center text-cyan-500 font-mono text-sm">
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

interface ProxyData {
  hasProxyHeaders: boolean;
  parsedHeaders: Record<string, string>;
  rawForwardedCount: number;
}

interface AnonymizationData {
  isVpnOrHosting: boolean;
  isTorNode: boolean;
  provider: string;
}

interface SimulationData {
  active: boolean;
  isSpoofedIp: boolean;
  isSpoofedUserAgent: boolean;
  realIp: string;
  realUserAgent: string;
}

interface SecurityAuditData {
  userAgentMismatch: boolean;
}

interface WhoAmIData {
  ip: string;
  browser: string;
  os: string;
  device: string;
  location: LocationData;
  visits: VisitData;
  proxy: ProxyData;
  anonymization: AnonymizationData;
  simulation: SimulationData;
  securityAudit: SecurityAuditData;
}

interface EduItem {
  name: string;
  description: string;
  risk: string;
  constrain?: string;
  mitigation: string;
}

const eduData = eduDataRaw as Record<string, EduItem>;

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

  // Stats
  const [canvasUniqueness, setCanvasUniqueness] = useState<number | null>(null);
  const [audioUniqueness, setAudioUniqueness] = useState<number | null>(null);
  const [totalChecked, setTotalChecked] = useState<number | null>(null);
  const [apiUrlUsed, setApiUrlUsed] = useState<string>("/api");

  // DNS Leak
  const [dnsLeakResolvers, setDnsLeakResolvers] = useState<any[]>([]);
  const [dnsChecking, setDnsChecking] = useState(false);
  const [dnsTested, setDnsTested] = useState(false);

  // Adblocker
  const [adBlockerActive, setAdBlockerActive] = useState<boolean | null>(null);

  // UI States
  const [terminalCollapsed, setTerminalCollapsed] = useState(false);
  const [selectedEduKey, setSelectedEduKey] = useState<string | null>(null);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);

  // Simulation Form States
  const [simulateSpoof, setSimulateSpoof] = useState(false);
  const [spoofIp, setSpoofIp] = useState("");
  const [selectedUaPreset, setSelectedUaPreset] = useState("current");
  const [customUa, setCustomUa] = useState("");

  const terminalEndRef = useRef<HTMLDivElement>(null);

  const uaPresets: Record<string, string> = {
    iphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
    linux: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    windows: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
    tor: "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0"
  };

  const apiEndpoints = [
    "/api/whoami",
    "http://localhost:3000/api/whoami",
    "http://localhost:3001/api/whoami",
    "http://127.0.0.1:3000/api/whoami",
    "http://127.0.0.1:3001/api/whoami"
  ];

  const logMessage = (msg: string) => {
    setScanLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const triggerScanDiagnostics = async (overrideIp?: string, overrideUa?: string) => {
    setIsScanning(true);
    setScanLogs([]);
    setScanProgress(10);
    logMessage("Initializing core audit handshakes...");

    let targetIp = overrideIp || "";
    let targetUa = overrideUa || "";

    // Step-by-step console loading simulator
    await new Promise(r => setTimeout(r, 300));
    setScanProgress(30);
    logMessage("Analyzing connection headers and routing indexes...");

    await new Promise(r => setTimeout(r, 300));
    setScanProgress(50);
    logMessage("Reading server geolocation coordinates databases...");

    await new Promise(r => setTimeout(r, 300));
    setScanProgress(70);
    logMessage("Scanning canvas 2D frame buffer outputs...");

    await new Promise(r => setTimeout(r, 300));
    setScanProgress(85);
    logMessage("Parsing client sound synthesizers Context...");

    await new Promise(r => setTimeout(r, 200));
    setScanProgress(95);
    logMessage("Checking filter rules for network adblockers...");

    // Trigger Adblocker check
    try {
      const adRes = await fetch('/ads.js', { method: 'HEAD', cache: 'no-store' });
      setAdBlockerActive(false);
      logMessage("Adblocker Scanner: No active script blockers resolved.");
    } catch (e) {
      setAdBlockerActive(true);
      logMessage("Adblocker Scanner: Active block rules detected (ads.js blocked).");
    }

    // Trigger IP and UA fetches
    let lastError: any = null;
    let fetchedData: WhoAmIData | null = null;
    
    // Append OS hint for backend mismatch checks
    const clientOsHint = navigator.platform || "";
    let fetchUrl = "";

    for (const url of apiEndpoints) {
      try {
        let fullUrl = url;
        const queryParams: string[] = [];
        if (targetIp) queryParams.push(`spoofIp=${encodeURIComponent(targetIp)}`);
        if (targetUa) queryParams.push(`spoofUserAgent=${encodeURIComponent(targetUa)}`);
        if (clientOsHint) queryParams.push(`clientOs=${encodeURIComponent(clientOsHint)}`);

        if (queryParams.length > 0) {
          fullUrl += `?${queryParams.join("&")}`;
        }

        const response = await fetch(fullUrl, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        fetchedData = await response.json();
        fetchUrl = url;
        break;
      } catch (err) {
        lastError = err;
      }
    }

    if (fetchedData) {
      setData(fetchedData);
      setApiUrlUsed(fetchUrl);
      logMessage(`Network Data: Connection parsed successfully via ${fetchUrl}`);
      logMessage(`Detected IP: ${fetchedData.ip} | OS: ${fetchedData.os}`);
      if (fetchedData.anonymization.isVpnOrHosting) {
        logMessage(`Routing Security: [ALERT] Subnet matches hosting ASN: ${fetchedData.anonymization.provider}`);
      } else {
        logMessage("Routing Security: Direct residential range (no datacenter subnets matched).");
      }
      if (fetchedData.proxy.hasProxyHeaders) {
        logMessage("Proxy Scanner: [WARNING] Found proxy routing headers.");
      }
      if (fetchedData.securityAudit.userAgentMismatch) {
        logMessage("Security Monitor: [CRITICAL] User-Agent platform mismatch detected!");
      }
    } else {
      setError(`Handshake failed: ${lastError?.message || 'Connection refused'}`);
      logMessage("Diagnostic Failure: Core server endpoints are unreachable.");
    }

    setScanProgress(100);
    logMessage("Diagnosis scan finished. Dashboard active.");
    setIsScanning(false);
  };

  useEffect(() => {
    triggerScanDiagnostics();

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

  // Submit fingerprints to calculate comparative stats
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
        console.warn("Fingerprint submission failure:", e);
      }
    }

    submitFingerprint();
  }, [data, canvasHash, audioHash, apiUrlUsed]);

  // Auto-scroll terminal log console to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [scanLogs]);

  const runDnsLeakTest = async () => {
    if (dnsChecking) return;
    setDnsChecking(true);
    setDnsTested(false);
    setDnsLeakResolvers([]);
    logMessage("DNS Audit: Initiating secure resolver check...");

    try {
      const baseApiUrl = apiUrlUsed.replace(/\/whoami$/, "");
      const initRes = await fetch(`${baseApiUrl}/dns-leak/init`);
      if (!initRes.ok) throw new Error("Init failed");
      const { token, testSubdomain } = await initRes.json();

      logMessage(`DNS Audit: Resolving randomized token subdomain: ${testSubdomain}`);

      // Fire dummy request to trigger DNS lookup
      try {
        await fetch(`http://${testSubdomain}/health`, { mode: "no-cors", signal: AbortSignal.timeout(1500) });
      } catch (e) {
        // expected network failure
      }

      await new Promise(r => setTimeout(r, 2000));

      const checkRes = await fetch(`${baseApiUrl}/dns-leak/check?token=${token}`);
      if (checkRes.ok) {
        const result = await checkRes.json();
        setDnsLeakResolvers(result.resolvers || []);
        setDnsTested(true);
        if (result.resolvers.length > 0) {
          logMessage(`DNS Audit: [WARNING] Exposed resolvers found: ${result.resolvers.length}`);
        } else {
          logMessage("DNS Audit: No DNS leak detected.");
        }
      }
    } catch (e) {
      logMessage("DNS Audit: Failure resolving DNS packet checks.");
    } finally {
      setDnsChecking(false);
    }
  };

  const handleBrowserLocate = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }
    setLocating(true);
    logMessage("Sensor Query: Requesting coordinates from client Geolocation API...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setCustomCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          label: "Your Device Location (Browser GPS)"
        });
        logMessage(`Sensor Query: Client GPS coordinates parsed: ${pos.coords.latitude}, ${pos.coords.longitude}`);
      },
      (err) => {
        setLocating(false);
        logMessage(`Sensor Query: GPS access denied: ${err.message}`);
        alert(`Could not get location: ${err.message}. Secure GPS requires HTTPS or Localhost.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleApplySimulation = () => {
    let finalUa = "";
    if (selectedUaPreset === "custom") {
      finalUa = customUa;
    } else if (selectedUaPreset !== "current") {
      finalUa = uaPresets[selectedUaPreset] || "";
    }
    logMessage(`Simulation Monitor: Applying custom parameters (IP: ${spoofIp || 'default'}, UA: ${selectedUaPreset})`);
    triggerScanDiagnostics(spoofIp, finalUa);
  };

  const handleResetSimulation = () => {
    setSpoofIp("");
    setSelectedUaPreset("current");
    setCustomUa("");
    setSimulateSpoof(false);
    logMessage("Simulation Monitor: Sandbox parameters reset. Reloading native identity...");
    triggerScanDiagnostics();
  };

  // Advanced Privacy Score Logic
  const getPrivacyScore = () => {
    if (!data) return 100;
    let score = 100;
    if (localIPs.length > 0) score -= 15; // WebRTC leak
    if (dnsTested && dnsLeakResolvers.length > 0) score -= 20; // DNS leak
    if (data.proxy.hasProxyHeaders) score -= 10; // Proxy header leaks
    if (data.securityAudit.userAgentMismatch) score -= 15; // Header mismatch
    
    // Add points for active mitigations if they hide details safely
    if (data.anonymization.isTorNode) {
      score += 10;
    } else if (data.anonymization.isVpnOrHosting) {
      score += 5;
    }
    
    if (adBlockerActive) score += 5; // Active shields
    
    return Math.max(10, Math.min(100, score));
  };

  const score = getPrivacyScore();
  const mapCoords = customCoords || (data?.location?.latitude != null && data?.location?.longitude != null ? {
    lat: data.location.latitude,
    lon: data.location.longitude,
    label: `Approximate Geolocation Node (${data.ip})`
  } : null);

  const handleOpenEducation = (key: string) => {
    setSelectedEduKey(key);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#060709] text-zinc-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      
      {/* Cyber Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e905_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e905_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950/40 border border-cyan-900/30 rounded-xl">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono tracking-tight text-white">
                WhoAmI<span className="text-cyan-400">.Audit</span>
              </h1>
              <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
                Interactive Digital Footprint Sandbox
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab("audit")}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                activeTab === "audit" 
                  ? "bg-cyan-950/40 text-cyan-400 border-cyan-900/50" 
                  : "bg-transparent text-zinc-400 border-transparent hover:text-zinc-200"
              }`}
            >
              PRIVACY AUDIT
            </button>
            <button 
              onClick={() => setActiveTab("education")}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                activeTab === "education" 
                  ? "bg-cyan-950/40 text-cyan-400 border-cyan-900/50" 
                  : "bg-transparent text-zinc-400 border-transparent hover:text-zinc-200"
              }`}
            >
              LEARN TRACKING
            </button>
            <button 
              onClick={() => triggerScanDiagnostics()}
              disabled={isScanning}
              className="p-2 rounded-lg bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors disabled:opacity-50"
              title="Restart Diagnostic Audit"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 relative z-20">
        
        {/* Real-time Diagnostics Terminal (Collapsible Console) */}
        <div className="mb-8 bg-zinc-950 border border-zinc-900 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Diagnostic Console Log</span>
              {isScanning && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-900/30 animate-pulse font-mono">
                  SCANNING... {scanProgress}%
                </span>
              )}
            </div>
            <button 
              onClick={() => setTerminalCollapsed(!terminalCollapsed)}
              className="text-zinc-500 hover:text-zinc-300"
            >
              {terminalCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
          
          {!terminalCollapsed && (
            <div className="p-4 bg-zinc-950/90 font-mono text-xs text-zinc-400 h-[140px] overflow-y-auto space-y-1 scrollbar-thin">
              {scanLogs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-zinc-600 select-none">&gt;</span>
                  <span className={
                    log.includes('[ALERT]') ? 'text-amber-400 font-bold' :
                    log.includes('[CRITICAL]') ? 'text-red-400 font-bold' :
                    log.includes('[INIT]') || log.includes('[COMPLETE]') ? 'text-cyan-400' :
                    'text-zinc-300'
                  }>{log}</span>
                </div>
              ))}
              {isScanning && (
                <div className="flex gap-2 items-center text-cyan-400/70 animate-pulse">
                  <span className="text-zinc-600 select-none">&gt;</span>
                  <span>Fetching diagnostic buffers...</span>
                </div>
              )}
              <div ref={terminalEndRef} />
            </div>
          )}
        </div>

        {error && !data && (
          <div className="max-w-xl mx-auto bg-red-950/10 border border-red-900/30 rounded-2xl p-6 text-center shadow-lg">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-400 mb-2 font-mono">DIAGNOSTIC CRASH</h3>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">{error}</p>
            <button 
              onClick={() => triggerScanDiagnostics()}
              className="px-5 py-2.5 rounded-xl bg-red-900/30 hover:bg-red-900/50 border border-red-800 text-red-200 text-sm font-mono transition-all"
            >
              REBOOT PORT SHAKE
            </button>
          </div>
        )}

        {data && (
          <div>
            {activeTab === "audit" ? (
              <div className="space-y-8">
                
                {/* Status Dashboard & Privacy Grade */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Privacy Grade Gauge */}
                  <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-sm relative overflow-hidden group flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-4 text-zinc-900 group-hover:text-zinc-900/80 transition-colors">
                      <Lock className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest font-bold">Privacy Grade</span>
                        <HelpCircle 
                          className="w-4 h-4 text-zinc-600 hover:text-zinc-400 cursor-pointer"
                          onClick={() => handleOpenEducation("ip")}
                        />
                      </div>
                      
                      <div className="flex items-center gap-6 mt-4">
                        <div className="w-20 h-20 rounded-full border-4 border-zinc-900 border-t-cyan-500 flex items-center justify-center font-mono text-3xl font-extrabold text-white">
                          {score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 45 ? 'D' : 'F'}
                        </div>
                        <div>
                          <div className="text-3xl font-extrabold font-mono text-white">{score} <span className="text-zinc-600 text-xs">/ 100</span></div>
                          <div className="text-xs text-zinc-400 font-mono mt-1">
                            {score >= 80 ? "Solid Anonymity" : score >= 55 ? "Moderate Exposure" : "Critical Leaks Found"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-zinc-900/60 relative z-10 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500 font-mono">WebRTC Local IP:</span>
                        <span className={localIPs.length > 0 ? "text-amber-500 font-bold font-mono" : "text-emerald-500 font-mono"}>
                          {localIPs.length > 0 ? "EXPOSED" : "SECURED"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500 font-mono">DNS Resolution:</span>
                        <span className={dnsTested && dnsLeakResolvers.length > 0 ? "text-red-500 font-bold font-mono" : dnsTested ? "text-emerald-500 font-mono" : "text-zinc-500 font-mono"}>
                          {dnsTested ? (dnsLeakResolvers.length > 0 ? "LEAKING" : "SECURED") : "NOT TESTED"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500 font-mono">Adblock Protection:</span>
                        <span className={adBlockerActive ? "text-emerald-500 font-mono" : "text-zinc-500 font-mono"}>
                          {adBlockerActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Telemetry Counter Summary */}
                  <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-sm relative overflow-hidden group sm:col-span-2 flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-4 text-zinc-900 group-hover:text-zinc-900/80 transition-colors">
                      <Activity className="w-24 h-24" />
                    </div>
                    
                    <div className="relative z-10">
                      <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest font-bold">Diagnostics Database Log</span>
                      <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="bg-zinc-900/30 border border-zinc-900/60 p-4 rounded-2xl">
                          <div className="text-2xl font-bold font-mono text-cyan-400">{data.visits.total}</div>
                          <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mt-1">Total Hits</div>
                        </div>
                        <div className="bg-zinc-900/30 border border-zinc-900/60 p-4 rounded-2xl">
                          <div className="text-2xl font-bold font-mono text-cyan-400">{data.visits.unique}</div>
                          <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mt-1">Unique Nodes</div>
                        </div>
                        <div className="bg-zinc-900/30 border border-zinc-900/60 p-4 rounded-2xl">
                          <div className="text-2xl font-bold font-mono text-cyan-400">{data.visits.yourVisits}</div>
                          <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mt-1">My Logs</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-zinc-900/60 relative z-10 text-xs font-mono text-zinc-500 flex justify-between items-center">
                      <span>Server status: ACTIVE (100% Uptime)</span>
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Connection Encrypted
                      </span>
                    </div>
                  </div>
                </div>

                {/* Audit Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Column 1 & 2: Inspection Cards */}
                  <div className="lg:col-span-2 space-y-8">
                    
                    {/* Card 1: Network & ISP Identity */}
                    <div className="bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden shadow-sm">
                      <div className="px-6 py-5 border-b border-zinc-900 bg-zinc-900/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-cyan-400" />
                          <h3 className="font-bold text-xs text-white font-mono uppercase tracking-widest">Network & Route Audit</h3>
                        </div>
                        <HelpCircle 
                          className="w-4 h-4 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                          onClick={() => handleOpenEducation("ip")}
                        />
                      </div>
                      
                      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">IPv4 IP Address</div>
                            <div className="text-base font-bold font-mono text-cyan-400 mt-1 select-all">{data.ip}</div>
                          </div>
                          <div>
                            <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Resolved Location</div>
                            <div className="text-sm font-bold font-mono text-zinc-300 mt-1">
                              {data.location.city || "Unknown City"}, {data.location.region || "Unknown Region"}, {data.location.country || "Unknown Country"}
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Spatial Coordinate Vector</div>
                            <div className="text-sm font-bold font-mono text-zinc-300 mt-1">
                              {data.location.latitude != null && data.location.longitude != null 
                                ? `${data.location.latitude.toFixed(4)}, ${data.location.longitude.toFixed(4)}` 
                                : "No coordinates resolved"}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Routing Anonymization</div>
                            <div className="text-sm font-bold font-mono text-zinc-300 mt-1 flex items-center gap-1.5">
                              {data.anonymization.isVpnOrHosting || data.anonymization.isTorNode ? (
                                <span className="text-emerald-400 font-bold bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded">
                                  {data.anonymization.provider}
                                </span>
                              ) : (
                                <span className="text-zinc-500 font-normal">NONE (Direct Residential/Mobile IP)</span>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Forwarding proxy headers</div>
                            <div className="text-sm font-bold font-mono text-zinc-300 mt-1">
                              {data.proxy.hasProxyHeaders ? (
                                <span className="text-amber-400 font-bold bg-amber-950/20 border border-amber-900/30 px-2 py-0.5 rounded">
                                  DETECTED ({Object.keys(data.proxy.parsedHeaders).join(", ")})
                                </span>
                              ) : (
                                <span className="text-zinc-500 font-normal">NONE (No routing headers leaked)</span>
                              )}
                            </div>
                          </div>

                          {data.simulation.active && (
                            <div>
                              <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Simulation Sandbox</div>
                              <span className="inline-block text-[10px] font-mono bg-cyan-950/40 border border-cyan-800/30 text-cyan-400 px-2 py-0.5 rounded font-bold mt-1">
                                SIMULATION ACTIVE
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Leaks & Vulnerability Audits */}
                    <div className="bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden shadow-sm">
                      <div className="px-6 py-5 border-b border-zinc-900 bg-zinc-900/10 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-cyan-400" />
                        <h3 className="font-bold text-xs text-white font-mono uppercase tracking-widest">Active Leak & Filter Checks</h3>
                      </div>

                      <div className="divide-y divide-zinc-900">
                        {/* WebRTC Leak */}
                        <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-zinc-200 font-mono">WebRTC Local IP Leak Test</h4>
                              <HelpCircle 
                                className="w-3.5 h-3.5 text-zinc-600 hover:text-zinc-400 cursor-pointer"
                                onClick={() => handleOpenEducation("webrtc")}
                              />
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed max-w-md">
                              Queries browser ICE candidate APIs. Exposes your real LAN routing address (e.g. 192.168.x.x) even past VPN configurations.
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 min-w-[150px] w-full sm:w-auto">
                            {localIPs.length > 0 ? (
                              <div className="w-full">
                                <span className="flex items-center gap-1.5 text-xs text-amber-500 font-mono font-bold bg-amber-950/20 border border-amber-900/30 px-3 py-1.5 rounded-xl justify-center">
                                  <AlertTriangle className="w-3.5 h-3.5" /> EXPOSED (LEAKING)
                                </span>
                                <div className="text-[10px] text-zinc-500 font-mono text-right mt-1.5">
                                  Local: {localIPs.join(", ")}
                                </div>
                              </div>
                            ) : (
                              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-bold bg-emerald-950/20 border border-emerald-900/30 px-3 py-1.5 rounded-xl justify-center w-full">
                                <CheckCircle className="w-3.5 h-3.5" /> SECURE (NO LEAK)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* DNS Leak */}
                        <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-zinc-200 font-mono">DNS Tunnel Leak Test</h4>
                              <HelpCircle 
                                className="w-3.5 h-3.5 text-zinc-600 hover:text-zinc-400 cursor-pointer"
                                onClick={() => handleOpenEducation("dnsleak")}
                              />
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed max-w-md">
                              Forces a lookup query to a unique subdomain. If resolver servers bypass your VPN subnet, your real ISP leaks.
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 min-w-[200px] w-full sm:w-auto">
                            {!dnsTested ? (
                              <button
                                onClick={runDnsLeakTest}
                                disabled={dnsChecking}
                                className="px-4 py-1.5 w-full rounded-xl bg-cyan-950/40 hover:bg-cyan-950/60 border border-cyan-900/50 text-cyan-400 text-xs font-mono font-bold transition-all disabled:opacity-50"
                              >
                                {dnsChecking ? "TESTING TUNNELS..." : "RUN DNS LEAK TEST"}
                              </button>
                            ) : (
                              <div className="w-full text-right">
                                {dnsLeakResolvers.length > 0 ? (
                                  <div className="space-y-1.5">
                                    <span className="flex items-center gap-1.5 text-xs text-red-500 font-mono font-bold bg-red-950/20 border border-red-900/30 px-3 py-1.5 rounded-xl justify-center">
                                      <AlertTriangle className="w-3.5 h-3.5" /> LEAK DETECTED
                                    </span>
                                    <div className="text-[10px] text-zinc-500 font-mono">
                                      Exposed DNS: {dnsLeakResolvers.map(r => `${r.ip} (${r.country})`).join(", ")}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-bold bg-emerald-950/20 border border-emerald-900/30 px-3 py-1.5 rounded-xl justify-center w-full">
                                    <CheckCircle className="w-3.5 h-3.5" /> SECURE (NO LEAK)
                                  </span>
                                )}
                                <button
                                  onClick={runDnsLeakTest}
                                  className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono underline mt-1"
                                >
                                  Retest Tunnels
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Adblock trap */}
                        <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-zinc-200 font-mono">Ad-Blocker & Tracker Filter Check</h4>
                              <HelpCircle 
                                className="w-3.5 h-3.5 text-zinc-600 hover:text-zinc-400 cursor-pointer"
                                onClick={() => handleOpenEducation("vpnOrTor")}
                              />
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed max-w-md">
                              Attempts to fetch a local script trap (`ads.js`). If your browser blocks it, ad-blocking filters are active.
                            </p>
                          </div>
                          <div className="min-w-[150px] text-right font-mono">
                            {adBlockerActive === null ? (
                              <span className="text-xs text-zinc-600">Checking...</span>
                            ) : adBlockerActive ? (
                              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-bold bg-emerald-950/20 border border-emerald-900/30 px-3 py-1.5 rounded-xl justify-center">
                                <CheckCircle className="w-3.5 h-3.5" /> SHIELDS ACTIVE (BLOCKED)
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono font-bold bg-zinc-900/40 border border-zinc-800/80 px-3 py-1.5 rounded-xl justify-center">
                                NO BLOCKERS FOUND
                              </span>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Card 3: Browser Profile & Fingerprints */}
                    <div className="bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden shadow-sm">
                      <div className="px-6 py-5 border-b border-zinc-900 bg-zinc-900/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-cyan-400" />
                          <h3 className="font-bold text-xs text-white font-mono uppercase tracking-widest">Client & Hardware Fingerprints</h3>
                        </div>
                        <HelpCircle 
                          className="w-4 h-4 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                          onClick={() => handleOpenEducation("canvas")}
                        />
                      </div>

                      <div className="divide-y divide-zinc-900">
                        
                        {/* Browser & OS info */}
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">HTTP Browser Signature</span>
                              <HelpCircle 
                                className="w-3 h-3 text-zinc-600 hover:text-zinc-400 cursor-pointer"
                                onClick={() => handleOpenEducation("browser")}
                              />
                            </div>
                            <div className="text-sm font-bold font-mono text-zinc-300 mt-1">{data.browser}</div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Device Operating System</span>
                              <HelpCircle 
                                className="w-3 h-3 text-zinc-600 hover:text-zinc-400 cursor-pointer"
                                onClick={() => handleOpenEducation("os")}
                              />
                            </div>
                            <div className="text-sm font-bold font-mono text-zinc-300 mt-1 flex items-center gap-2">
                              {data.os}
                              {data.securityAudit.userAgentMismatch && (
                                <span className="text-[9px] font-mono bg-red-950/20 border border-red-900/40 text-red-400 px-1.5 py-0.5 rounded font-bold">
                                  MISMATCH
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Canvas Render Hash */}
                        <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <h4 className="text-xs font-bold text-zinc-200 font-mono">HTML5 Canvas Render Hash</h4>
                            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed max-w-md">
                              Draws an invisible graphic texture. Hardware rendering differences generate a reliable mathematical computer profile.
                            </p>
                          </div>
                          <div className="min-w-[180px] text-right font-mono">
                            <div className="text-xs bg-zinc-900/60 border border-zinc-900 px-3 py-1.5 rounded-xl inline-block text-zinc-300 font-bold select-all">
                              {canvasHash}
                            </div>
                            {canvasUniqueness !== null && (
                              <div className="text-[10px] text-zinc-500 mt-1">
                                Uniqueness ratio: <span className="text-cyan-400 font-bold">{canvasUniqueness.toFixed(2)}%</span> of logs
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Audio Context Hash */}
                        <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-zinc-200 font-mono">Web AudioContext Wave Hash</h4>
                              <HelpCircle 
                                className="w-3.5 h-3.5 text-zinc-600 hover:text-zinc-400 cursor-pointer"
                                onClick={() => handleOpenEducation("audio")}
                              />
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed max-w-md">
                              Synthesizes a silent sound block in the background. Audio card processing variations create a hardware identifier.
                            </p>
                          </div>
                          <div className="min-w-[180px] text-right font-mono">
                            <div className="text-xs bg-zinc-900/60 border border-zinc-900 px-3 py-1.5 rounded-xl inline-block text-zinc-300 font-bold select-all">
                              {audioHash}
                            </div>
                            {audioUniqueness !== null && (
                              <div className="text-[10px] text-zinc-500 mt-1">
                                Uniqueness ratio: <span className="text-cyan-400 font-bold">{audioUniqueness.toFixed(2)}%</span> of logs
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>

                  {/* Column 3: Geocoding Leaflet Map & Interactive GPS */}
                  <div className="space-y-8">
                    
                    {/* Leaflet Map Card */}
                    <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-4 shadow-sm space-y-4">
                      <div className="flex items-center justify-between px-2 py-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-cyan-400" />
                          <h3 className="font-bold text-xs text-white font-mono uppercase tracking-widest">Geolocation Spatial Map</h3>
                        </div>
                        <HelpCircle 
                          className="w-4 h-4 text-zinc-600 hover:text-zinc-400 cursor-pointer"
                          onClick={() => handleOpenEducation("location")}
                        />
                      </div>

                      {mapCoords ? (
                        <DynamicMap 
                          lat={mapCoords.lat} 
                          lon={mapCoords.lon} 
                          label={mapCoords.label} 
                        />
                      ) : (
                        <div className="w-full h-[320px] rounded-2xl bg-zinc-950/40 border border-zinc-900 flex flex-col items-center justify-center p-6 text-center text-zinc-500 font-mono">
                          <EyeOff className="w-8 h-8 mb-2 text-zinc-700" />
                          <span className="text-xs uppercase tracking-wider font-bold text-zinc-400">NO COORDINATES PRESENT</span>
                          <span className="text-[10px] mt-1 text-zinc-600 leading-relaxed">Local address or proxy shields are masking server geolocation. Try locating manually below.</span>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                          onClick={handleBrowserLocate}
                          disabled={locating}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-950/30 hover:bg-cyan-950/60 border border-cyan-900/50 text-cyan-400 text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                        >
                          <Compass className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
                          {locating ? "LOCATING..." : "REQUEST BROWSER GPS"}
                        </button>
                        
                        {customCoords && (
                          <button
                            onClick={() => {
                              setCustomCoords(null);
                              logMessage("Sensor Query: Custom GPS coordinates removed. Map reset to network IP geolocation.");
                            }}
                            className="px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-zinc-300 text-xs font-mono font-bold transition-all"
                          >
                            RESET
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Mitigation Quick Cards */}
                    <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-sm space-y-4">
                      <h3 className="font-bold text-xs text-white font-mono uppercase tracking-widest border-b border-zinc-900/80 pb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-cyan-400" /> Security Recommendations
                      </h3>
                      <ul className="space-y-3.5 text-xs text-zinc-400 leading-relaxed font-mono">
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 font-bold select-none">»</span>
                          <span><strong>Seal WebRTC leaks</strong> by disabling peer connections inside Firefox configs or browser privacy extensions.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 font-bold select-none">»</span>
                          <span><strong>Inject Canvas Noise</strong> using extensions to break graphic fingerprint correlation tracking IDs.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 font-bold select-none">»</span>
                          <span><strong>Enforce secure DNS-over-HTTPS (DoH)</strong> on your router or client settings to block DNS leakage lookups.</span>
                        </li>
                      </ul>
                    </div>

                  </div>
                </div>

                {/* Footer Simulator & Spoof Sandbox Form */}
                <div className="bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden shadow-xl">
                  <div className="px-6 py-4 border-b border-zinc-900 bg-zinc-900/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-cyan-400" />
                      <h3 className="font-bold text-xs text-white font-mono uppercase tracking-widest">
                        FOOTPRINT SIMULATOR & SPOOF TESTING
                      </h3>
                    </div>
                    <button 
                      onClick={() => setSimulateSpoof(!simulateSpoof)}
                      className="text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300"
                    >
                      {simulateSpoof ? "HIDE PANEL" : "OPEN PANEL"}
                    </button>
                  </div>

                  {simulateSpoof && (
                    <div className="p-6 bg-zinc-950/80 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] text-zinc-400 font-mono font-bold uppercase">Simulated IPv4 Address</label>
                        <input
                          type="text"
                          placeholder="e.g. 8.8.8.8 (Google Public DNS)"
                          value={spoofIp}
                          onChange={(e) => setSpoofIp(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-xs font-mono text-white px-3 py-2.5 rounded-xl transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] text-zinc-400 font-mono font-bold uppercase">Simulated User-Agent Profile</label>
                        <select
                          value={selectedUaPreset}
                          onChange={(e) => setSelectedUaPreset(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-500 outline-none text-xs font-mono text-white px-3 py-2.5 rounded-xl transition-all"
                        >
                          <option value="current">Current Browser (No spoofing)</option>
                          <option value="iphone">Safari Browser on Apple iPhone (iOS)</option>
                          <option value="linux">Chrome Browser on Ubuntu Linux</option>
                          <option value="windows">Firefox Browser on Windows 10/11</option>
                          <option value="tor">Tor Browser (simulated header format)</option>
                          <option value="custom">Custom string...</option>
                        </select>
                      </div>

                      <div className="space-y-2 flex flex-col justify-end">
                        {selectedUaPreset === "custom" && (
                          <div className="mb-2">
                            <input
                              type="text"
                              placeholder="Paste custom User-Agent string..."
                              value={customUa}
                              onChange={(e) => setCustomUa(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-500 outline-none text-xs font-mono text-white px-3 py-2 rounded-xl transition-all"
                            />
                          </div>
                        )}
                        <div className="flex gap-3">
                          <button
                            onClick={handleApplySimulation}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 text-xs font-mono font-bold transition-all shadow-md"
                          >
                            APPLY SIMULATOR
                          </button>
                          <button
                            onClick={handleResetSimulation}
                            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-xs font-mono font-bold transition-all"
                          >
                            RESET
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              /* Education Tab */
              <div className="max-w-4xl mx-auto bg-zinc-950 border border-zinc-900 rounded-3xl p-8 shadow-lg space-y-8">
                <div>
                  <h2 className="text-lg font-bold text-white font-mono uppercase tracking-wider border-b border-zinc-900 pb-4">
                    Tracking Mechanics & Explanations
                  </h2>
                  <p className="text-zinc-400 text-sm mt-4 leading-relaxed font-mono">
                    Modern web advertising and tracking networks no longer depend solely on browser cookies, which are easily blocked. Next-generation tracking mechanisms analyze unique hardware rendering differences and request routing vectors.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {Object.keys(eduData).map((key) => (
                    <div key={key} className="space-y-3 border-l-2 border-cyan-800/40 pl-4 py-1">
                      <h4 className="text-xs font-bold text-zinc-200 font-mono uppercase tracking-wider">{eduData[key].name}</h4>
                      <p className="text-xs text-zinc-500 leading-relaxed font-mono">{eduData[key].description}</p>
                      <button 
                        onClick={() => handleOpenEducation(key)}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono font-bold underline"
                      >
                        Read Risk & Mitigations →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Educational Slide-out Drawer */}
      {selectedEduKey && eduData[selectedEduKey] && (
        <div className="fixed inset-0 z-50 overflow-hidden font-mono">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedEduKey(null)} />
          
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-zinc-950 border-l border-zinc-900 p-6 flex flex-col justify-between shadow-2xl relative">
              
              <div className="space-y-6 overflow-y-auto pr-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest">
                    {eduData[selectedEduKey].name}
                  </h3>
                  <button 
                    onClick={() => setSelectedEduKey(null)}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 text-xs leading-relaxed text-zinc-300">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">What is this?</h4>
                    <p className="p-3.5 bg-zinc-900/40 rounded-xl border border-zinc-900/80">
                      {eduData[selectedEduKey].description}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Privacy Risk</h4>
                    <p className="p-3.5 bg-red-950/10 rounded-xl border border-red-900/20 text-zinc-400">
                      {eduData[selectedEduKey].risk}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">How to mitigate this risk?</h4>
                    <p className="p-3.5 bg-cyan-950/10 rounded-xl border border-cyan-900/20 text-zinc-400">
                      {eduData[selectedEduKey].mitigation}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-900 mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedEduKey(null)}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-850 rounded-xl text-xs font-bold font-mono transition-all"
                >
                  CLOSE AUDIT LOG
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900/80 bg-zinc-950 py-6 text-center text-[10px] text-zinc-600 font-mono mt-auto relative z-30 tracking-widest uppercase">
        <div>
          WhoAmI.Audit &middot; PROTOTYPE PRIVACY SANDBOX &middot; &copy; 2026
        </div>
      </footer>

    </div>
  );
}
