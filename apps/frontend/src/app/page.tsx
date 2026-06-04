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
  Compass,
  Printer,
  Share2,
  Clock,
  Smartphone,
  Tablet,
  Laptop,
  Terminal,
  Lock,
  Info,
  HelpCircle,
  EyeOff
} from "lucide-react";

// Types
import { WhoAmIData, HistoryEntry, BrowserCapabilities, SecurityConfig } from "./types";

// Decoupled Components
import ScannerConsole from "./components/ScannerConsole";
import PrivacyScoreDial from "./components/PrivacyScoreDial";
import RiskFindingsCard from "./components/RiskFindingsCard";
import SimulationConsole from "./components/SimulationConsole";
import EducationalDrawer from "./components/EducationalDrawer";
import AuditCategoryCard from "./components/AuditCategoryCard";

// Fingerprinting & capability utilities
import {
  getCanvasFingerprint,
  getAudioFingerprint,
  getWebGLFingerprint,
  getBrowserCapabilities,
  getSecurityConfiguration,
  getWebRTCLocalIPs
} from "./utils/fingerprint";

// Educational copy database
import eduDataRaw from "./data/education.json";
const eduData = eduDataRaw as Record<string, any>;

// Dynamic Leaflet Map wrapper
const DynamicMap = dynamic(() => import("./components/Map"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-[320px] rounded-2xl bg-zinc-950/60 border border-zinc-900 animate-pulse flex items-center justify-center text-cyan-500 font-mono text-xs">
      INITIALIZING MAP ENGINE...
    </div>
  )
});

export default function Home() {
  // Navigation & Landing Page States
  const [auditStarted, setAuditStarted] = useState(false);
  const [auditComplete, setAuditComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<"audit" | "education">("audit");
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Diagnostic Logs & Step Indicators
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [terminalCollapsed, setTerminalCollapsed] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Data States
  const [data, setData] = useState<WhoAmIData | null>(null);
  const [localIPs, setLocalIPs] = useState<string[]>([]);
  const [canvasHash, setCanvasHash] = useState<string>("detecting...");
  const [audioHash, setAudioHash] = useState<string>("detecting...");
  const [webglInfo, setWebglInfo] = useState<{ hash: string; vendor: string; renderer: string }>({ hash: "detecting...", vendor: "detecting...", renderer: "detecting..." });
  const [capabilities, setCapabilities] = useState<BrowserCapabilities | null>(null);
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig | null>(null);
  const [gpsData, setGpsData] = useState<{ lat: number; lon: number; accuracy: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [customCoords, setCustomCoords] = useState<{ lat: number; lon: number; label: string } | null>(null);

  // Scroll terminal to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [scanLogs]);

  // Uniqueness ratios
  const [canvasUniqueness, setCanvasUniqueness] = useState<number | null>(null);
  const [audioUniqueness, setAudioUniqueness] = useState<number | null>(null);
  const [totalChecked, setTotalChecked] = useState<number | null>(null);
  const [apiUrlUsed, setApiUrlUsed] = useState<string>("/api");

  // DNS Leak Test
  const [dnsLeakResolvers, setDnsLeakResolvers] = useState<any[]>([]);
  const [dnsChecking, setDnsChecking] = useState(false);
  const [dnsTested, setDnsTested] = useState(false);

  // Adblock Status
  const [adBlockerActive, setAdBlockerActive] = useState<boolean | null>(null);

  // Simulator Form States
  const [simulateSpoof, setSimulateSpoof] = useState(false);
  const [spoofIp, setSpoofIp] = useState("");
  const [selectedUaPreset, setSelectedUaPreset] = useState("current");
  const [customUa, setCustomUa] = useState("");

  // History & Educational Drawers
  const [selectedEduKey, setSelectedEduKey] = useState<string | null>(null);
  const [localHistory, setLocalHistory] = useState<HistoryEntry[]>([]);

  const testCategories = [
    { id: 0, name: "Network Identity Audit", desc: "Inspecting Public IP routing and ISP subnets" },
    { id: 1, name: "Device Profile Audit", desc: "Checking user-agent formats and device characteristics" },
    { id: 2, name: "Location Accuracy Audit", desc: "Resolving IP coordinates and device GPS boundaries" },
    { id: 3, name: "Browser Fingerprinting Audit", desc: "Hashing canvas rendering and audio synthesis outputs" },
    { id: 4, name: "WebRTC local IP exposure test", desc: "Checking ICE negotiation candidates leaking LAN IPs" },
    { id: 5, name: "DNS Privacy Audit", desc: "Running custom DNS queries checking tunnel leakages" },
    { id: 6, name: "Browser Capabilities Audit", desc: "Verifying local storage blocks and script execution settings" },
    { id: 7, name: "Security Configuration Audit", desc: "Checking HTTPS context and referrer headers leakage" }
  ];

  const scanSteps = [
    "Preparing Test Sequence...",
    "Collecting Browser Attributes...",
    "Analyzing Payload Patterns...",
    "Generating Comparative Results...",
    "Compiling Audit Recommendations..."
  ];

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

  // Load history from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("whoami_history");
      if (saved) {
        setLocalHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Could not read local storage history");
    }
  }, []);

  const triggerAuditPipeline = async (overrideIp?: string, overrideUa?: string) => {
    setAuditStarted(true);
    setAuditComplete(false);
    setScanLogs([]);
    setLocalIPs([]);
    setDnsTested(false);
    setDnsLeakResolvers([]);

    // Step-by-step scanner simulator
    for (let c = 0; c < testCategories.length; c++) {
      setActiveCategoryIndex(c);
      logMessage(`[STARTING] ${testCategories[c].name} - ${testCategories[c].desc}`);
      
      for (let s = 0; s < scanSteps.length; s++) {
        setActiveStepIndex(s);
        logMessage(`  └─ [STEP ${s + 1}/5] ${scanSteps[s]}`);
        await new Promise(r => setTimeout(r, 90)); // Fast sequential pacing
      }
      
      // Execute the actual checks inline as we progress
      if (c === 0) {
        // Network
        let fetchedData: WhoAmIData | null = null;
        let lastError: any = null;
        let fetchUrl = "";
        const clientOsHint = navigator.platform || "";

        for (const url of apiEndpoints) {
          try {
            let fullUrl = url;
            const queryParams: string[] = [];
            if (overrideIp) queryParams.push(`spoofIp=${encodeURIComponent(overrideIp)}`);
            if (overrideUa) queryParams.push(`spoofUserAgent=${encodeURIComponent(overrideUa)}`);
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
          logMessage(`[NETWORK] IP address resolved: ${fetchedData.ip}`);
          logMessage(`[NETWORK] ISP: ${fetchedData.network?.isp || 'Unknown'} | ASN: ${fetchedData.network?.asn || 'Unknown'}`);
        } else {
          setError(`Handshake failed: ${lastError?.message || 'Connection refused'}`);
          logMessage("[CRITICAL] Host connection endpoints are unreachable.");
          return;
        }
      }

      if (c === 2) {
        logMessage("[LOCATION] Validating coordinate sets...");
      }

      if (c === 3) {
        // Fingerprints
        const canvas = getCanvasFingerprint();
        setCanvasHash(canvas);
        
        const audio = await getAudioFingerprint();
        setAudioHash(audio);

        const gl = getWebGLFingerprint();
        setWebglInfo(gl);

        logMessage(`[FINGERPRINT] WebGL Graphic hash: ${gl.hash.substring(0, 10)}...`);
        logMessage(`[FINGERPRINT] Canvas drawing hash: ${canvas.substring(0, 10)}...`);
      }

      if (c === 4) {
        getWebRTCLocalIPs((ip) => {
          setLocalIPs(prev => prev.includes(ip) ? prev : [...prev, ip]);
        });
      }

      if (c === 6) {
        const caps = getBrowserCapabilities();
        setCapabilities(caps);
        logMessage("[CAPABILITIES] Standard Web storage checks finished.");
      }

      if (c === 7) {
        const sec = getSecurityConfiguration();
        setSecurityConfig(sec);
        logMessage("[SECURITY] Secure Context indicator checks completed.");
      }
    }

    // Adblock check
    try {
      await fetch('/ads.js', { method: 'HEAD', cache: 'no-store' });
      setAdBlockerActive(false);
    } catch (e) {
      setAdBlockerActive(true);
    }

    // Run custom DNS leak checks automatically on complete
    logMessage("[DNS] Running automated resolver check in background...");
    try {
      const baseApiUrl = apiUrlUsed.replace(/\/whoami$/, "");
      const initRes = await fetch(`${baseApiUrl}/dns-leak/init`);
      if (initRes.ok) {
        const { token, testSubdomain } = await initRes.json();
        try {
          await fetch(`http://${testSubdomain}/health`, { mode: "no-cors", signal: AbortSignal.timeout(1200) });
        } catch (e) { /* ignore network error */ }

        await new Promise(r => setTimeout(r, 1500));
        const checkRes = await fetch(`${baseApiUrl}/dns-leak/check?token=${token}`);
        if (checkRes.ok) {
          const result = await checkRes.json();
          setDnsLeakResolvers(result.resolvers || []);
          setDnsTested(true);
        }
      }
    } catch (e) {
      console.warn("DNS background test failure");
    }

    setAuditComplete(true);
    logMessage("[COMPLETE] Digital footprint audit successfully parsed. Dashboard loaded.");
  };

  useEffect(() => {
    triggerAuditPipeline();

    // Trigger local WebRTC checks on initialization
    getWebRTCLocalIPs((ip) => {
      setLocalIPs(prev => prev.includes(ip) ? prev : [...prev, ip]);
    });

    const canvas = getCanvasFingerprint();
    setCanvasHash(canvas);

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

  // Save history on completion
  useEffect(() => {
    if (!auditComplete || !data) return;

    const currentScore = getPrivacyScore();
    const currentGrade = currentScore >= 90 ? 'A' : currentScore >= 75 ? 'B' : currentScore >= 60 ? 'C' : currentScore >= 45 ? 'D' : 'F';
    
    const entry: HistoryEntry = {
      timestamp: new Date().toLocaleString(),
      score: currentScore,
      ip: data.ip,
      grade: currentGrade
    };

    setLocalHistory(prev => {
      const updated = [entry, ...prev.slice(0, 4)];
      try {
        localStorage.setItem("whoami_history", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, [auditComplete]);

  // Privacy Score Calculations
  const getPrivacyScore = () => {
    if (!data) return 100;
    let score = 100;
    if (localIPs.length > 0) score -= 15;
    if (dnsTested && dnsLeakResolvers.length > 0) score -= 20;
    if (data.proxy.hasProxyHeaders) score -= 10;
    if (data.securityAudit.userAgentMismatch) score -= 15;
    if (securityConfig && !securityConfig.isHttps) score -= 15;
    
    if (data.anonymization.isTorNode) {
      score += 10;
    } else if (data.anonymization.isVpnOrHosting) {
      score += 5;
    }
    
    if (adBlockerActive) score += 5;
    
    return Math.max(10, Math.min(100, score));
  };

  const score = getPrivacyScore();

  const mapCoords = gpsData ? {
    lat: gpsData.lat,
    lon: gpsData.lon,
    label: `GPS Coordinates Target (Accuracy: ${gpsData.accuracy.toFixed(1)}m)`
  } : (customCoords || (data?.location?.latitude != null && data?.location?.longitude != null ? {
    lat: data.location.latitude,
    lon: data.location.longitude,
    label: `IP Geolocation node (${data.ip})`
  } : null));

  const handleOpenEducation = (key: string) => {
    setSelectedEduKey(key);
  };

  const handleShareReport = () => {
    if (!data) return;
    const shareText = `WhoAmI Audit Report\nIPv4 Address: ${data.ip}\nPrivacy Score: ${score}/100\nAnonymization: ${data.anonymization.provider}\nRun your scan here: ${window.location.origin}`;
    navigator.clipboard.writeText(shareText).then(() => {
      alert("Privacy Audit Report copied to clipboard!");
    });
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleApplySimulation = () => {
    let finalUa = "";
    if (selectedUaPreset === "custom") {
      finalUa = customUa;
    } else if (selectedUaPreset !== "current") {
      finalUa = uaPresets[selectedUaPreset] || "";
    }
    triggerAuditPipeline(spoofIp, finalUa);
  };

  const handleResetSimulation = () => {
    setSpoofIp("");
    setSelectedUaPreset("current");
    setCustomUa("");
    setSimulateSpoof(false);
    triggerAuditPipeline();
  };

  const getRiskBreakdown = () => {
    const risks: { type: "high" | "medium" | "low", title: string, desc: string }[] = [];

    if (localIPs.length > 0) {
      risks.push({
        type: "high",
        title: "WebRTC Local IP Exposure",
        desc: "Your local network routing IP (e.g. 192.168.x.x) is exposed, bypassing VPN wrappers."
      });
    }
    
    if (dnsTested && dnsLeakResolvers.length > 0) {
      risks.push({
        type: "high",
        title: "DNS Tunnel Leak Detected",
        desc: "Your system's DNS lookup requests are bypassing your secure VPN tunnel, exposing sites to your ISP."
      });
    }

    if (securityConfig && !securityConfig.isHttps) {
      risks.push({
        type: "high",
        title: "Unencrypted Connection (Insecure HTTP)",
        desc: "You are accessing this site via insecure HTTP. Local eavesdroppers can read or modify your data."
      });
    }

    if (data && data.securityAudit.userAgentMismatch) {
      risks.push({
        type: "medium",
        title: "Platform Fingerprint Discrepancy",
        desc: "Your HTTP user-agent header reports one OS while your device browser APIs suggest another. Often blocked by anti-bot firewalls."
      });
    }

    if (data && data.proxy.hasProxyHeaders) {
      risks.push({
        type: "medium",
        title: "Proxy Routing Headers Detected",
        desc: "Your connection leaks forwarding headers indicating you route traffic via intermediate proxies."
      });
    }

    if (canvasHash !== "blocked" && canvasHash !== "not-supported") {
      risks.push({
        type: "medium",
        title: "HTML5 Canvas Tracking ID Active",
        desc: "Your graphics engine generates a reliable tracking fingerprint that correlates sessions without cookies."
      });
    }

    if (capabilities && capabilities.localStorageSupported) {
      risks.push({
        type: "low",
        title: "Active LocalStorage Capability",
        desc: "Allows websites to save up to 5MB of persistent files that track profiles after clearing cookies."
      });
    }

    if (data && !data.anonymization.isVpnOrHosting) {
      risks.push({
        type: "low",
        title: "Residential Route Exposure",
        desc: "Your connection resolves to a residential range, directly identifying your physical region/ISP."
      });
    }

    return risks;
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
        setGpsData({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy
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

  const riskFindings = getRiskBreakdown();

  return (
    <div className="flex flex-col min-h-screen bg-[#050608] text-zinc-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      
      {/* Global CSS Print Style Sheets */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          header, footer, button, select, input, .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
            max-width: 100% !important;
          }
          .print-card {
            border: 1px solid #e4e4e7 !important;
            background: white !important;
            color: black !important;
            page-break-inside: avoid;
            margin-bottom: 1.5rem;
            padding: 1.5rem !important;
            border-radius: 0.75rem !important;
            box-shadow: none !important;
          }
          .print-title {
            color: black !important;
            border-bottom: 2px solid black !important;
            padding-bottom: 0.5rem;
          }
          .print-grid {
            display: block !important;
          }
          .text-cyan-400, .text-cyan-300, .text-emerald-400, .text-amber-400, .text-red-400 {
            color: black !important;
            font-weight: bold !important;
          }
        }
      `}</style>

      {/* Cyber Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e904_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e904_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none no-print" />

      {/* Header */}
      <header className="relative border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md z-30 no-print">
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
                Privacy Diagnostics Sandbox
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-zinc-900/60 border border-zinc-800 p-0.5 rounded-lg mr-2">
              <button
                onClick={() => setIsAdvancedMode(false)}
                className={`px-3 py-1 rounded text-[10px] font-mono font-bold transition-all ${!isAdvancedMode ? 'bg-cyan-950 text-cyan-400' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                BEGINNER
              </button>
              <button
                onClick={() => setIsAdvancedMode(true)}
                className={`px-3 py-1 rounded text-[10px] font-mono font-bold transition-all ${isAdvancedMode ? 'bg-cyan-950 text-cyan-400' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                ADVANCED
              </button>
            </div>
            {auditComplete && (
              <button
                onClick={() => triggerAuditPipeline()}
                className="px-4 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono font-bold text-zinc-300 hover:text-white transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> RETEST
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 relative z-20">
        
        {error && (
          <div className="bg-red-950/20 border border-red-900/50 p-4 rounded-2xl text-red-400 font-mono text-xs mb-6 flex items-center justify-between no-print animate-fade-in">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="hover:text-white text-lg">&times;</button>
          </div>
        )}

        {/* Landing screen if audit not started */}
        {!auditStarted && (
          <div className="max-w-3xl mx-auto text-center py-20 space-y-8 no-print">
            <div className="inline-block p-4 bg-cyan-950/20 border border-cyan-800/30 rounded-3xl animate-bounce-slow shadow-2xl">
              <Shield className="w-16 h-16 text-cyan-400" />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white uppercase">
                What does the internet <span className="text-cyan-400">know about you?</span>
              </h2>
              <p className="text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed font-mono">
                Clear cookie blocking is no longer enough. Websites collect hardware hashes, check network tunnels, and query WebRTC APIs to compile unique, tracking fingerprints of your device.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
              <button
                onClick={() => triggerAuditPipeline()}
                className="px-8 py-4 rounded-2xl bg-cyan-950/40 hover:bg-cyan-950/80 border border-cyan-700/60 text-cyan-400 font-mono font-bold transition-all shadow-lg hover:shadow-cyan-900/30 tracking-wider uppercase text-sm"
              >
                START PRIVACY AUDIT
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 text-left border-t border-zinc-900 max-w-2xl mx-auto">
              <div className="p-3 bg-zinc-950/50 border border-zinc-900/60 rounded-2xl">
                <Globe className="w-4 h-4 text-cyan-400 mb-2" />
                <div className="text-[10px] text-zinc-500 font-mono uppercase font-bold">Network Audits</div>
                <div className="text-[11px] text-zinc-400 font-mono mt-0.5">ISP & ASN leak validations</div>
              </div>
              <div className="p-3 bg-zinc-950/50 border border-zinc-900/60 rounded-2xl">
                <Cpu className="w-4 h-4 text-cyan-400 mb-2" />
                <div className="text-[10px] text-zinc-500 font-mono uppercase font-bold">Fingerprinting</div>
                <div className="text-[11px] text-zinc-400 font-mono mt-0.5">Canvas & audio synthesizers</div>
              </div>
              <div className="p-3 bg-zinc-950/50 border border-zinc-900/60 rounded-2xl">
                <MapPin className="w-4 h-4 text-cyan-400 mb-2" />
                <div className="text-[10px] text-zinc-500 font-mono uppercase font-bold">GPS Coordinate</div>
                <div className="text-[11px] text-zinc-400 font-mono mt-0.5">Physical node discrepancies</div>
              </div>
              <div className="p-3 bg-zinc-950/50 border border-zinc-900/60 rounded-2xl">
                <Lock className="w-4 h-4 text-cyan-400 mb-2" />
                <div className="text-[10px] text-zinc-500 font-mono uppercase font-bold">Secure Contexts</div>
                <div className="text-[11px] text-zinc-400 font-mono mt-0.5">Security configurations</div>
              </div>
            </div>
          </div>
        )}

        {/* Live scanning progress overlay */}
        {auditStarted && !auditComplete && (
          <div className="max-w-2xl mx-auto py-12 space-y-8 no-print">
            <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-3xl shadow-xl space-y-6">
              
              {/* Category tracker */}
              <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                <div className="flex items-center gap-3">
                  <Terminal className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Scanned Category {activeCategoryIndex + 1}/8</div>
                    <div className="text-sm font-bold text-white font-mono">{testCategories[activeCategoryIndex].name}</div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-cyan-800 border-t-cyan-400 animate-spin" />
              </div>

              {/* Console log display */}
              <div className="bg-zinc-950/90 border border-zinc-900/80 p-4 rounded-2xl h-[240px] overflow-y-auto font-mono text-xs text-zinc-400 space-y-1">
                {scanLogs.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-zinc-600 select-none">&gt;</span>
                    <span className={log.includes('[STARTING]') ? 'text-cyan-400 font-bold' : 'text-zinc-300'}>{log}</span>
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                  <span>ANALYZING SYSTEM PARAMETERS</span>
                  <span>{Math.round(((activeCategoryIndex * 5 + activeStepIndex + 1) / 40) * 100)}%</span>
                </div>
                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan-500 transition-all duration-100" 
                    style={{ width: `${((activeCategoryIndex * 5 + activeStepIndex + 1) / 40) * 100}%` }}
                  />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Diagnostic Dashboard (Scans Complete) */}
        {auditStarted && auditComplete && data && (
          <div className="space-y-8">
            
            {/* Top Controls Banner */}
            <div className="flex justify-between items-center bg-zinc-950/50 border border-zinc-900 rounded-2xl px-5 py-3 no-print">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>Viewing diagnostics in <strong className="text-cyan-400 uppercase">{isAdvancedMode ? 'Advanced Mode' : 'Beginner Mode'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShareReport}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-300 hover:text-white rounded-lg transition-all flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" /> SHARE
                </button>
                <button
                  onClick={handleExportPDF}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-300 hover:text-white rounded-lg transition-all flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> EXPORT PDF
                </button>
              </div>
            </div>

            {/* Results Summary Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print-card">
              
              {/* Radial Dial Score */}
              <PrivacyScoreDial
                score={score}
                localIPsExposed={localIPs.length > 0}
                dnsLeaking={dnsTested && dnsLeakResolvers.length > 0}
                dnsTested={dnsTested}
                adblockerActive={adBlockerActive}
                onExplainClick={handleOpenEducation}
              />

              {/* Severity Counts */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 flex flex-col justify-between print-card lg:col-span-2">
                <div>
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest font-bold">Threat Severity Log</span>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-red-950/10 border border-red-900/20 p-4 rounded-2xl flex flex-col justify-between h-24">
                      <span className="text-[10px] text-red-400 font-mono font-bold uppercase">High Risk</span>
                      <div className="text-3xl font-extrabold font-mono text-red-500">{riskFindings.filter(r => r.type === "high").length}</div>
                    </div>
                    <div className="bg-amber-950/10 border border-amber-900/20 p-4 rounded-2xl flex flex-col justify-between h-24">
                      <span className="text-[10px] text-amber-400 font-mono font-bold uppercase">Medium Risk</span>
                      <div className="text-3xl font-extrabold font-mono text-amber-500">{riskFindings.filter(r => r.type === "medium").length}</div>
                    </div>
                    <div className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-2xl flex flex-col justify-between h-24">
                      <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase">Low Risk</span>
                      <div className="text-3xl font-extrabold font-mono text-cyan-400">{riskFindings.filter(r => r.type === "low").length}</div>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs font-mono text-zinc-500 mt-4 border-t border-zinc-900 pt-4 flex justify-between items-center">
                  <span>Mitigation Grade: {riskFindings.filter(r => r.type === "high").length === 0 ? "EXCELLENT" : "IMPROVEMENTS REQUIRED"}</span>
                  <span className="text-cyan-400 font-bold hover:underline cursor-pointer" onClick={() => setActiveTab("education")}>
                    Learn mitigation mechanics →
                  </span>
                </div>
              </div>

            </div>

            {/* Findings List (Strengths/Weaknesses Summary Report) */}
            <RiskFindingsCard findings={riskFindings} />

            {/* Test Categories Audit Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print-grid">
              
              <div className="lg:col-span-2 space-y-8 print-grid">
                
                {/* Category 1: Network Identity Audit */}
                <AuditCategoryCard
                  title="Network Identity Audit"
                  icon={<Globe className="w-4 h-4 text-cyan-400" />}
                  eduKey="ip"
                  onExplainClick={handleOpenEducation}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-4 font-mono text-xs">
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Public IP Address</span>
                        <span className="font-bold text-cyan-400 select-all">{data.ip}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">ISP Network Provider</span>
                        <span className="font-bold text-zinc-300">{data.network?.isp || 'Unknown'}</span>
                      </div>
                      {isAdvancedMode && (
                        <div>
                          <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Autonomous System Number (ASN)</span>
                          <span className="font-bold text-zinc-300">{data.network?.asn || 'Unknown'}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Routing Location</span>
                        <span className="font-bold text-zinc-300">
                          {data.location.city || "Unknown"}, {data.location.region || "Unknown"}, {data.location.country || "Unknown"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4 font-mono text-xs">
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Vpn / Datacenter Route</span>
                        <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                          {data.anonymization.isVpnOrHosting ? (
                            <span className="text-emerald-400 font-bold bg-emerald-950/20 border border-emerald-900/30 px-1.5 py-0.5 rounded">
                              {data.anonymization.provider}
                            </span>
                          ) : (
                            <span className="text-zinc-500 font-normal">No (Datacenter Ranges Secure)</span>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Tor Relay Exit</span>
                        <span className="font-bold text-zinc-300">
                          {data.anonymization.isTorNode ? (
                            <span className="text-emerald-400 font-bold bg-emerald-950/20 border border-emerald-900/30 px-1.5 py-0.5 rounded">
                              ACTIVE TOR RELAY
                            </span>
                          ) : (
                            <span className="text-zinc-500 font-normal">No (Direct IP Route)</span>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Timezone</span>
                        <span className="font-bold text-zinc-300">{data.network?.timezone || 'UTC'}</span>
                      </div>
                    </div>
                  </div>
                </AuditCategoryCard>

                {/* Category 2: Device Profile Audit */}
                <AuditCategoryCard
                  title="Device Profile Audit"
                  icon={<Cpu className="w-4 h-4 text-cyan-400" />}
                  eduKey="browser"
                  onExplainClick={handleOpenEducation}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-4 font-mono text-xs">
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Browser Profile</span>
                        <span className="font-bold text-zinc-300">{data.browser}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Operating System</span>
                        <span className="font-bold text-zinc-300 flex items-center gap-2">
                          {data.os}
                          {data.securityAudit.userAgentMismatch && (
                            <span className="text-[9px] font-bold bg-red-950/20 border border-red-900/30 text-red-400 px-1 rounded">
                              MISMATCH
                            </span>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Form Factor</span>
                        <span className="font-bold text-zinc-300 uppercase flex items-center gap-1.5">
                          {data.device === "mobile" ? <Smartphone className="w-3.5 h-3.5 text-cyan-400" /> :
                           data.device === "tablet" ? <Tablet className="w-3.5 h-3.5 text-cyan-400" /> :
                           <Laptop className="w-3.5 h-3.5 text-cyan-400" />}
                          {data.device}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4 font-mono text-xs">
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Display Screen Parameters</span>
                        <span className="font-bold text-zinc-300">
                          {typeof window !== 'undefined' ? `${window.screen.width} x ${window.screen.height} (${window.screen.colorDepth}-bit)` : 'Unavailable'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Client Device Languages</span>
                        <span className="font-bold text-zinc-300">
                          {typeof navigator !== 'undefined' ? (navigator.languages ? navigator.languages.join(", ") : navigator.language) : 'Unknown'}
                        </span>
                      </div>
                      {isAdvancedMode && (
                        <div>
                          <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Client Device CPU architecture</span>
                          <span className="font-bold text-zinc-300">
                            {typeof navigator !== 'undefined' ? ((navigator as any).deviceMemory ? `Memory: ${(navigator as any).deviceMemory}GB | CPU cores: ${navigator.hardwareConcurrency || 'Unknown'}` : `CPU cores: ${navigator.hardwareConcurrency || 'Unknown'}`) : 'Unknown'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </AuditCategoryCard>

                {/* Category 4: Browser Fingerprint Audit */}
                <AuditCategoryCard
                  title={isAdvancedMode ? "Browser Fingerprinting Audit" : "Browser Identity Profile"}
                  icon={<Cpu className="w-4 h-4 text-cyan-400" />}
                  eduKey="canvas"
                  onExplainClick={handleOpenEducation}
                  paddingStyle="p-0"
                >
                  <div className="divide-y divide-zinc-900 font-mono text-xs">
                    <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="font-bold text-zinc-200 uppercase tracking-wide">
                          {isAdvancedMode ? "HTML5 Canvas Render Hash" : "Unique Rendering Signature"}
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed max-w-sm">
                          Assesses graphic GPU calculations. Uniquely logs device outputs without cookie cookies.
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs bg-zinc-900/60 border border-zinc-900 px-3 py-1.5 rounded-xl font-bold select-all">
                          {canvasHash}
                        </div>
                        {canvasUniqueness !== null && (
                          <div className="text-[9px] text-zinc-500 mt-1">
                            Shared by: <strong className="text-cyan-400">{canvasUniqueness.toFixed(2)}%</strong> of visitors
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="font-bold text-zinc-200 uppercase tracking-wide">WebGL Hardware Synthesis</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed max-w-sm">
                          Queries local graphic card rendering details and GPU shader configurations.
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs bg-zinc-900/60 border border-zinc-900 px-3 py-1.5 rounded-xl font-bold select-all">
                          {webglInfo.hash.substring(0, 16)}...
                        </div>
                        {isAdvancedMode && (
                          <div className="text-[9px] text-zinc-500 mt-1 max-w-[200px] truncate">
                            GPU: {webglInfo.renderer}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="font-bold text-zinc-200 uppercase tracking-wide">Web Audio context synthesis</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed max-w-sm">
                          Checks sound processing card variance using silent synthesized frequencies.
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs bg-zinc-900/60 border border-zinc-900 px-3 py-1.5 rounded-xl font-bold select-all">
                          {audioHash}
                        </div>
                        {audioUniqueness !== null && (
                          <div className="text-[9px] text-zinc-500 mt-1">
                            Shared by: <strong className="text-cyan-400">{audioUniqueness.toFixed(2)}%</strong> of visitors
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </AuditCategoryCard>

                {/* Category 5 & 6: WebRTC & DNS leaks */}
                <AuditCategoryCard
                  title="WebRTC & DNS Privacy"
                  icon={<Shield className="w-4 h-4 text-cyan-400" />}
                  eduKey="webrtc"
                  onExplainClick={handleOpenEducation}
                  paddingStyle="p-0"
                >
                  <div className="divide-y divide-zinc-900 font-mono text-xs">
                    <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="font-bold text-zinc-200 uppercase tracking-wide">
                          {isAdvancedMode ? "WebRTC ICE Leak candidates" : "Local Network Exposure Check"}
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed max-w-sm">
                          WebRTC exposes your local router client subnet, bypasses standard IP shields.
                        </p>
                      </div>
                      <div className="text-right">
                        {localIPs.length > 0 ? (
                          <div>
                            <span className="text-xs text-amber-500 font-bold bg-amber-950/20 border border-amber-900/30 px-2.5 py-1 rounded">
                              EXPOSED
                            </span>
                            <div className="text-[9px] text-zinc-500 mt-1.5">Leaks: {localIPs.join(", ")}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-emerald-400 font-bold bg-emerald-950/20 border border-emerald-900/30 px-2.5 py-1 rounded">
                            SECURE
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="font-bold text-zinc-200 uppercase tracking-wide">
                          {isAdvancedMode ? "DNS Resolver Leak audit" : "Domain Query Log Check"}
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed max-w-sm">
                          Checks if your domain lookup resolvers match the subnet of your VPN IP address.
                        </p>
                      </div>
                      <div className="text-right">
                        {dnsTested ? (
                          dnsLeakResolvers.length > 0 ? (
                            <div>
                              <span className="text-xs text-red-500 font-bold bg-red-950/20 border border-red-900/30 px-2.5 py-1 rounded">
                                LEAK DETECTED
                              </span>
                              <div className="text-[9px] text-zinc-500 mt-1.5 truncate max-w-[200px]">
                                DNS: {dnsLeakResolvers.map(r => r.ip).join(", ")}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-emerald-400 font-bold bg-emerald-950/20 border border-emerald-900/30 px-2.5 py-1 rounded">
                              SECURE
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-zinc-500">RUN TEST ABOVE</span>
                        )}
                      </div>
                    </div>
                  </div>
                </AuditCategoryCard>

                {/* Category 7: Browser Capabilities */}
                <AuditCategoryCard
                  title="Browser Capabilities Audit"
                  icon={<Terminal className="w-4 h-4 text-cyan-400" />}
                  eduKey="capabilities"
                  onExplainClick={handleOpenEducation}
                >
                  <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                        <span className="text-zinc-500">Cookies Enabled:</span>
                        <span className={capabilities?.cookiesEnabled ? "text-cyan-400" : "text-red-400"}>
                          {capabilities?.cookiesEnabled ? "YES" : "NO"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                        <span className="text-zinc-500">LocalStorage Supported:</span>
                        <span className={capabilities?.localStorageSupported ? "text-cyan-400" : "text-red-400"}>
                          {capabilities?.localStorageSupported ? "YES" : "NO"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                        <span className="text-zinc-500">SessionStorage:</span>
                        <span className={capabilities?.sessionStorageSupported ? "text-cyan-400" : "text-red-400"}>
                          {capabilities?.sessionStorageSupported ? "YES" : "NO"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                        <span className="text-zinc-500">IndexedDB Access:</span>
                        <span className={capabilities?.indexedDbSupported ? "text-cyan-400" : "text-red-400"}>
                          {capabilities?.indexedDbSupported ? "YES" : "NO"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                        <span className="text-zinc-500">Service Workers:</span>
                        <span className={capabilities?.serviceWorkerSupported ? "text-cyan-400" : "text-zinc-500"}>
                          {capabilities?.serviceWorkerSupported ? "SUPPORTED" : "UNSUPPORTED"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                        <span className="text-zinc-500">JavaScript Execution:</span>
                        <span className="text-emerald-400">ACTIVE</span>
                      </div>
                    </div>
                  </div>
                </AuditCategoryCard>

                {/* Category 8: Security Configurations */}
                <AuditCategoryCard
                  title="Security Configuration Audit"
                  icon={<Lock className="w-4 h-4 text-cyan-400" />}
                  eduKey="security"
                  onExplainClick={handleOpenEducation}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-mono text-xs">
                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                        <span className="text-zinc-500">HTTPS Encryption:</span>
                        <span className={securityConfig?.isHttps ? "text-emerald-400" : "text-red-500 font-bold"}>
                          {securityConfig?.isHttps ? "ACTIVE" : "INSECURE"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                        <span className="text-zinc-500">Secure Context Mode:</span>
                        <span className={securityConfig?.isSecureContext ? "text-emerald-400" : "text-red-500 font-bold"}>
                          {securityConfig?.isSecureContext ? "YES" : "NO"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                        <span className="text-zinc-500">Referrer Leakage:</span>
                        <span className={securityConfig?.referrer !== 'None' ? "text-amber-500 truncate max-w-[150px]" : "text-emerald-400"}>
                          {securityConfig?.referrer === 'None' ? "BLOCKED" : securityConfig?.referrer}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                        <span className="text-zinc-500">Mixed Content Block:</span>
                        <span className={securityConfig?.mixedContentBlocked ? "text-emerald-400" : "text-amber-400"}>
                          {securityConfig?.mixedContentBlocked ? "ENFORCED" : "INACTIVE"}
                        </span>
                      </div>
                    </div>
                  </div>
                </AuditCategoryCard>

              </div>

              {/* Column 3: Geocoding Map & Simulation Controls */}
              <div className="space-y-8 print-card">
                
                {/* Geocoding Map */}
                <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-4 shadow-sm space-y-4 print-card">
                  <div className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      <h3 className="font-bold text-xs text-white font-mono uppercase tracking-widest">Geolocation Target Map</h3>
                    </div>
                    <HelpCircle 
                      className="w-4 h-4 text-zinc-600 hover:text-zinc-400 cursor-pointer no-print"
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

                  {gpsData && (
                    <div className="bg-zinc-900/40 border border-zinc-800 p-3 rounded-2xl font-mono text-xs space-y-1">
                      <div className="flex justify-between text-zinc-400">
                        <span>Accuracy Radius:</span>
                        <span className="text-cyan-400 font-bold">~{gpsData.accuracy.toFixed(1)} meters</span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>IP vs. GPS Discrepancy:</span>
                        <span className="text-amber-500">EXPOSED</span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-2 no-print">
                    <button
                      onClick={handleBrowserLocate}
                      disabled={locating}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-950/30 hover:bg-cyan-950/60 border border-cyan-900/50 text-cyan-400 text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                    >
                      <Compass className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
                      {locating ? "LOCATING..." : "REQUEST BROWSER GPS"}
                    </button>
                    
                    {(gpsData || customCoords) && (
                      <button
                        onClick={() => {
                          setGpsData(null);
                          setCustomCoords(null);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-zinc-300 text-xs font-mono font-bold transition-all"
                      >
                        RESET
                      </button>
                    )}
                  </div>
                </div>

                {/* Simulation Form Panel */}
                <SimulationConsole
                  spoofIp={spoofIp}
                  setSpoofIp={setSpoofIp}
                  selectedUaPreset={selectedUaPreset}
                  setSelectedUaPreset={setSelectedUaPreset}
                  customUa={customUa}
                  setCustomUa={setCustomUa}
                  simulateSpoof={simulateSpoof}
                  setSimulateSpoof={setSimulateSpoof}
                  onApply={handleApplySimulation}
                  onReset={handleResetSimulation}
                />

                {/* Local History trends */}
                <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-sm space-y-4 no-print">
                  <h3 className="font-bold text-xs text-white font-mono uppercase tracking-widest border-b border-zinc-900/80 pb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" /> Local Audit History
                  </h3>
                  <div className="space-y-3 font-mono text-xs">
                    {localHistory.map((item, index) => (
                      <div key={index} className="flex justify-between items-center border-b border-zinc-900/60 pb-2">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-zinc-500 block">{item.timestamp}</span>
                          <span className="text-zinc-400 tracking-wide truncate max-w-[150px] inline-block">{item.ip}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-400 font-bold bg-cyan-950/20 border border-cyan-900/30 px-2 py-0.5 rounded">
                            {item.score}/100
                          </span>
                          <span className="font-extrabold text-white">{item.grade}</span>
                        </div>
                      </div>
                    ))}
                    {localHistory.length === 0 && (
                      <div className="text-center py-4 text-zinc-600 text-[11px] uppercase tracking-wider">
                        No previous audit runs found
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* Diagnostic logs slider terminal when audit complete */}
        {auditStarted && auditComplete && (
          <ScannerConsole
            logs={scanLogs}
            progress={100}
            isScanning={false}
            collapsed={terminalCollapsed}
            onToggleCollapse={() => setTerminalCollapsed(!terminalCollapsed)}
          />
        )}

      </main>

      {/* Slide-out Educational Drawer overlay */}
      <EducationalDrawer 
        eduKey={selectedEduKey} 
        onClose={() => setSelectedEduKey(null)} 
      />

      {/* Footer */}
      <footer className="border-t border-zinc-900/80 bg-zinc-950 py-6 text-center text-[10px] text-zinc-600 font-mono mt-auto relative z-30 tracking-widest uppercase no-print">
        <div>
          WhoAmI.Audit &middot; PRIVACY DIAGNOSTICS &middot; &copy; 2026
        </div>
      </footer>

    </div>
  );
}
