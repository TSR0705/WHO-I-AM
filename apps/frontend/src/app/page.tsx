"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
import DataGridHero from "@/components/ui/data-grid-hero";
import GridControlPanel from "./components/GridControlPanel";

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

  // Grid Configuration States for Landing Hero
  const [gridCfg, setGridCfg] = useState({
    rows: 25,
    cols: 35,
    spacing: 4,
    duration: 5.0,
    color: "hsl(var(--cyan))",
    animationType: "pulse" as "pulse" | "wave" | "random",
    pulseEffect: true,
    mouseGlow: true,
    opacityMin: 0.05,
    opacityMax: 0.5,
    background: "transparent",
  });
  const [gridPanelOpen, setGridPanelOpen] = useState(false);

  const randomizeGrid = useCallback(() => {
    const rand = (min: number, max: number) => Math.random() * (max - min) + min;
    const colors = [
      "hsl(var(--green))",
      "hsl(var(--pink))",
      "hsl(var(--cyan))",
      "hsl(var(--yellow))",
      "hsl(var(--orange))",
    ];
    const anims: ("pulse" | "wave" | "random")[] = ["pulse", "wave", "random"];
    setGridCfg((c) => ({
      ...c,
      rows: Math.floor(rand(15, 35)),
      cols: Math.floor(rand(20, 40)),
      duration: rand(4, 9),
      color: colors[Math.floor(Math.random() * colors.length)],
      animationType: anims[Math.floor(Math.random() * anims.length)],
      pulseEffect: Math.random() > 0.2,
      mouseGlow: Math.random() > 0.3,
      opacityMin: rand(0.02, 0.1),
      opacityMax: rand(0.3, 0.7),
      spacing: Math.floor(rand(2, 6)),
      background: "transparent"
    }));
  }, []);

  useEffect(() => {
    if (auditStarted) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName && target.tagName.toLowerCase() === "input") return;
      const k = e.key.toLowerCase();
      if (k === "h") setGridPanelOpen((v) => !v);
      if (k === "r") randomizeGrid();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [auditStarted, randomizeGrid]);

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
    // triggerAuditPipeline(); // Disabled to allow the Hero branding page to show first on load/refresh.

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

  if (!auditStarted) {
    return (
      <div className="flex flex-col w-screen h-screen min-h-screen bg-cyber-black text-zinc-100 font-sans selection:bg-neon-cyan/20 selection:text-neon-cyan relative overflow-hidden">
        {/* Cyber Grid background */}
        <div className="absolute inset-0 cyber-grid pointer-events-none no-print" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl pointer-events-none no-print" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl pointer-events-none no-print" />
        
        <DataGridHero {...gridCfg}>
          <h1>DataGrid Hero</h1>
          <p>
            A generative, interactive hero component built with React. Customize
            the grid animation using the control panel.
          </p>
          <div className="buttons">
            <button 
              className="button"
              onClick={() => triggerAuditPipeline()}
            >
              Get Started
            </button>
            <button
              className="button-outline"
              onClick={() => setGridPanelOpen(true)}
            >
              Controls (H)
            </button>
          </div>

          {gridPanelOpen && (
            <GridControlPanel
              cfg={gridCfg}
              setCfg={setGridCfg}
              onClose={() => setGridPanelOpen(false)}
              onRandomize={randomizeGrid}
            />
          )}
        </DataGridHero>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-cyber-black text-zinc-100 font-sans selection:bg-neon-cyan/20 selection:text-neon-cyan relative">
      
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
      <div className="absolute inset-0 cyber-grid pointer-events-none no-print" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl pointer-events-none no-print" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl pointer-events-none no-print" />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 relative z-20">
        
        {error && (
          <div className="bg-neon-rose/5 border border-neon-rose/25 p-4 rounded-2xl text-neon-rose font-mono text-xs mb-6 flex items-center justify-between no-print animate-fade-in">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="hover:text-white text-lg font-bold">&times;</button>
          </div>
        )}

        {/* Landing screen if audit not started */}
        {!auditStarted && (
          <div className="relative w-full no-print">
            <DataGridHero {...gridCfg}>
              <h1>DataGrid Hero</h1>
              <p>
                A generative, interactive hero component built with React. Customize
                the grid animation using the control panel.
              </p>
              <div className="buttons">
                <button 
                  className="button"
                  onClick={() => triggerAuditPipeline()}
                >
                  Get Started
                </button>
                <button
                  className="button-outline"
                  onClick={() => setGridPanelOpen(true)}
                >
                  Controls (H)
                </button>
              </div>

              {gridPanelOpen && (
                <GridControlPanel
                  cfg={gridCfg}
                  setCfg={setGridCfg}
                  onClose={() => setGridPanelOpen(false)}
                  onRandomize={randomizeGrid}
                />
              )}
            </DataGridHero>
          </div>
        )}

        {/* Live scanning progress overlay */}
        {auditStarted && !auditComplete && (
          <div className="max-w-2xl mx-auto py-16 space-y-8 no-print">
            <div className="glass-panel p-6 rounded-3xl shadow-2xl space-y-6">
              
              {/* Category tracker */}
              <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                <div className="flex items-center gap-3">
                  <Terminal className="w-4 h-4 text-neon-cyan animate-pulse" />
                  <div>
                    <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest font-bold">Scanning category {activeCategoryIndex + 1}/8</div>
                    <div className="text-xs font-bold text-white font-mono uppercase tracking-wide mt-0.5">{testCategories[activeCategoryIndex].name}</div>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
              </div>

              {/* Console log display */}
              <div className="bg-black/40 border border-zinc-900/60 p-4 rounded-2xl h-[240px] overflow-y-auto font-mono text-[11px] text-zinc-400 space-y-1 scrollbar-cyber">
                {scanLogs.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-neon-cyan/40 select-none">&gt;</span>
                    <span className={log.includes('[STARTING]') ? 'text-neon-cyan font-bold' : 'text-zinc-300'}>{log}</span>
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                  <span>Running Diagnostic Sequence</span>
                  <span>{Math.round(((activeCategoryIndex * 5 + activeStepIndex + 1) / 40) * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-950 border border-zinc-900/60 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple transition-all duration-100 shadow-[0_0_10px_rgba(0,242,255,0.4)]" 
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
            <div className="flex flex-col sm:flex-row justify-between items-center glass-panel rounded-2xl px-5 py-3.5 gap-4 no-print">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neon-cyan/5 border border-neon-cyan/20 rounded-xl">
                  <Shield className="w-4 h-4 text-neon-cyan" />
                </div>
                <div>
                  <h1 className="text-sm font-black tracking-tight text-white uppercase">
                    WhoAmI<span className="text-neon-cyan">.Audit</span>
                  </h1>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Mode Selector */}
                <div className="flex bg-zinc-950/60 border border-zinc-900 p-0.5 rounded-xl text-[9px] font-mono font-bold">
                  <button
                    onClick={() => setIsAdvancedMode(false)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${!isAdvancedMode ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    BEGINNER
                  </button>
                  <button
                    onClick={() => setIsAdvancedMode(true)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${isAdvancedMode ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    ADVANCED
                  </button>
                </div>
                
                {/* Action buttons */}
                <button
                  onClick={() => triggerAuditPipeline()}
                  className="px-3 py-1.5 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-300 hover:text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> RETEST
                </button>
                <button
                  onClick={handleShareReport}
                  className="px-3 py-1.5 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-300 hover:text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" /> SHARE
                </button>
                <button
                  onClick={handleExportPDF}
                  className="px-3 py-1.5 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-300 hover:text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> EXPORT PDF
                </button>
              </div>
            </div>

            {/* Row 1: Core Dashboard Gauges & Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 print-card">
              <PrivacyScoreDial
                score={score}
                localIPsExposed={localIPs.length > 0}
                dnsLeaking={dnsTested && dnsLeakResolvers.length > 0}
                dnsTested={dnsTested}
                adblockerActive={adBlockerActive}
                onExplainClick={handleOpenEducation}
              />

              {/* Severity counts ledger */}
              <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between print-card relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-neon-purple/5 rounded-full blur-3xl pointer-events-none" />
                <div>
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest font-bold">Threat Severity Ledger</span>
                  <div className="grid grid-cols-3 gap-3 mt-4 font-mono">
                    <div className="bg-neon-rose/5 border border-neon-rose/10 p-3 rounded-2xl flex flex-col justify-between h-22">
                      <span className="text-[9px] text-neon-rose font-bold uppercase">High Risk</span>
                      <div className="text-2xl font-extrabold text-neon-rose drop-shadow-[0_0_10px_rgba(244,63,94,0.3)]">{riskFindings.filter(r => r.type === "high").length}</div>
                    </div>
                    <div className="bg-neon-amber/5 border border-neon-amber/10 p-3 rounded-2xl flex flex-col justify-between h-22">
                      <span className="text-[9px] text-neon-amber font-bold uppercase">Med Risk</span>
                      <div className="text-2xl font-extrabold text-neon-amber drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">{riskFindings.filter(r => r.type === "medium").length}</div>
                    </div>
                    <div className="bg-neon-cyan/5 border border-neon-cyan/10 p-3 rounded-2xl flex flex-col justify-between h-22">
                      <span className="text-[9px] text-neon-cyan font-bold uppercase">Low Risk</span>
                      <div className="text-2xl font-extrabold text-neon-cyan drop-shadow-[0_0_10px_rgba(0,242,255,0.3)]">{riskFindings.filter(r => r.type === "low").length}</div>
                    </div>
                  </div>
                </div>
                <div className="text-[11px] font-mono text-zinc-500 mt-4 border-t border-zinc-900/60 pt-4 flex justify-between items-center relative z-10">
                  <span>Mitigation Grade: <strong className={riskFindings.filter(r => r.type === "high").length === 0 ? "text-neon-emerald" : "text-neon-amber"}>{riskFindings.filter(r => r.type === "high").length === 0 ? "EXCELLENT" : "IMPROVEMENTS REQUIRED"}</strong></span>
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
            </div>

            {/* Row 2: Diagnostics Ledger & Location Map */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print-card">
              <div className="lg:col-span-2">
                <RiskFindingsCard findings={riskFindings} />
              </div>

              {/* Geocoding Map */}
              <div className="glass-panel border border-zinc-900 rounded-3xl p-4 shadow-sm space-y-4 print-card flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-neon-cyan" />
                      <h3 className="font-bold text-xs text-white font-mono uppercase tracking-widest">Geolocation Target Map</h3>
                    </div>
                    <HelpCircle 
                      className="w-4 h-4 text-zinc-600 hover:text-neon-cyan cursor-pointer no-print"
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
                    <div className="w-full h-[220px] rounded-2xl bg-zinc-950/40 border border-zinc-900 flex flex-col items-center justify-center p-6 text-center text-zinc-500 font-mono">
                      <EyeOff className="w-8 h-8 mb-2 text-zinc-700" />
                      <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">NO COORDINATES PRESENT</span>
                      <span className="text-[9px] mt-1 text-zinc-650 leading-relaxed">Local address or proxy shields are masking server geolocation. Try locating manually below.</span>
                    </div>
                  )}

                  {gpsData && (
                    <div className="bg-zinc-900/40 border border-zinc-850 p-3 rounded-2xl font-mono text-[10px] space-y-1">
                      <div className="flex justify-between text-zinc-400">
                        <span>Accuracy Radius:</span>
                        <span className="text-neon-cyan font-bold">~{gpsData.accuracy.toFixed(1)} meters</span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>IP vs. GPS Discrepancy:</span>
                        <span className="text-neon-amber font-bold">EXPOSED</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2 no-print">
                  <button
                    onClick={handleBrowserLocate}
                    disabled={locating}
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm cursor-pointer"
                  >
                    <Compass className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
                    {locating ? "LOCATING..." : "REQUEST GPS"}
                  </button>
                  
                  {(gpsData || customCoords) && (
                    <button
                      onClick={() => {
                        setGpsData(null);
                        setCustomCoords(null);
                      }}
                      className="px-4 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-zinc-300 text-xs font-mono font-bold transition-all cursor-pointer"
                    >
                      RESET
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Row 3: Technical Audits Category Grid & History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print-grid">
              
              {/* Category cards subgrid */}
              <div className="lg:col-span-2 space-y-6 print-grid">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Category 1: Network Identity Audit */}
                  <AuditCategoryCard
                    title="Network Identity Audit"
                    icon={<Globe className="w-4 h-4 text-neon-cyan" />}
                    eduKey="ip"
                    onExplainClick={handleOpenEducation}
                  >
                    <div className="space-y-4 font-mono text-xs">
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Public IP Address</span>
                        <span className="font-bold text-neon-cyan select-all tracking-wide">{data.ip}</span>
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
                        <span className="font-bold text-zinc-300">{data.network?.timezone || 'UTC'}</span>
                      </div>
                    </div>
                  </AuditCategoryCard>

                  {/* Category 2: Device Profile Audit */}
                  <AuditCategoryCard
                    title="Device Profile Audit"
                    icon={<Cpu className="w-4 h-4 text-neon-cyan" />}
                    eduKey="browser"
                    onExplainClick={handleOpenEducation}
                  >
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
                            <span className="text-[9px] font-bold bg-neon-rose/10 border border-neon-rose/25 text-neon-rose px-1.5 py-0.5 rounded-md animate-pulse">
                              MISMATCH
                            </span>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Form Factor</span>
                        <span className="font-bold text-zinc-300 uppercase flex items-center gap-1.5">
                          {data.device === "mobile" ? <Smartphone className="w-3.5 h-3.5 text-neon-cyan" /> :
                           data.device === "tablet" ? <Tablet className="w-3.5 h-3.5 text-neon-cyan" /> :
                           <Laptop className="w-3.5 h-3.5 text-neon-cyan" />}
                          {data.device}
                        </span>
                      </div>
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
                          <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Client Hardware CPU architecture</span>
                          <span className="font-bold text-zinc-300">
                            {typeof navigator !== 'undefined' ? ((navigator as any).deviceMemory ? `Memory: ${(navigator as any).deviceMemory}GB | CPU cores: ${navigator.hardwareConcurrency || 'Unknown'}` : `CPU cores: ${navigator.hardwareConcurrency || 'Unknown'}`) : 'Unknown'}
                          </span>
                        </div>
                      )}
                    </div>
                  </AuditCategoryCard>

                  {/* Category 4: Browser Fingerprint Audit */}
                  <AuditCategoryCard
                    title={isAdvancedMode ? "Browser Fingerprinting Audit" : "Browser Identity Profile"}
                    icon={<Cpu className="w-4 h-4 text-neon-cyan" />}
                    eduKey="canvas"
                    onExplainClick={handleOpenEducation}
                    paddingStyle="p-0"
                  >
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
                          {canvasHash.substring(0, 16)}...
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
                          {webglInfo.hash.substring(0, 16)}...
                        </div>
                        {isAdvancedMode && (
                          <div className="text-[9px] text-zinc-500 truncate">
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
                          {audioHash.substring(0, 16)}...
                        </div>
                        {audioUniqueness !== null && (
                          <div className="text-[9px] text-zinc-500">
                            Shared by: <strong className="text-neon-cyan">{audioUniqueness.toFixed(2)}%</strong> of visitors
                          </div>
                        )}
                      </div>
                    </div>
                  </AuditCategoryCard>

                  {/* Category 5 & 6: WebRTC & DNS leaks */}
                  <AuditCategoryCard
                    title="WebRTC & DNS Privacy"
                    icon={<Shield className="w-4 h-4 text-neon-cyan" />}
                    eduKey="webrtc"
                    onExplainClick={handleOpenEducation}
                    paddingStyle="p-0"
                  >
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
                              <div className="text-[9px] text-zinc-500 mt-1 max-w-[100px] truncate">Leaks: {localIPs.join(", ")}</div>
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
                                <div className="text-[9px] text-zinc-500 mt-1 truncate max-w-[100px]">
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
                  </AuditCategoryCard>

                  {/* Category 7: Browser Capabilities */}
                  <AuditCategoryCard
                    title="Browser Capabilities Audit"
                    icon={<Terminal className="w-4 h-4 text-neon-cyan" />}
                    eduKey="capabilities"
                    onExplainClick={handleOpenEducation}
                  >
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
                  </AuditCategoryCard>

                  {/* Category 8: Security Configurations */}
                  <AuditCategoryCard
                    title="Security Configuration Audit"
                    icon={<Lock className="w-4 h-4 text-neon-cyan" />}
                    eduKey="security"
                    onExplainClick={handleOpenEducation}
                  >
                    <div className="grid grid-cols-1 gap-3 font-mono text-xs">
                      <div className="space-y-3">
                        <div className="flex justify-between border-b border-zinc-900/60 pb-1.5">
                          <span className="text-zinc-500">HTTPS Encryption:</span>
                          <span className={securityConfig?.isHttps ? "text-neon-emerald font-bold" : "text-neon-rose font-bold"}>
                            {securityConfig?.isHttps ? "ACTIVE" : "INSECURE"}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-900/60 pb-1.5">
                          <span className="text-zinc-500">Secure Context Mode:</span>
                          <span className={securityConfig?.isSecureContext ? "text-neon-emerald font-bold" : "text-neon-rose font-bold"}>
                            {securityConfig?.isSecureContext ? "YES" : "NO"}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-900/60 pb-1.5">
                          <span className="text-zinc-500">Referrer Leakage:</span>
                          <span className={securityConfig?.referrer !== 'None' ? "text-neon-amber font-bold truncate max-w-[120px]" : "text-neon-emerald"}>
                            {securityConfig?.referrer === 'None' ? "BLOCKED" : securityConfig?.referrer}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-900/60 pb-1.5">
                          <span className="text-zinc-500">Mixed Content Block:</span>
                          <span className={securityConfig?.mixedContentBlocked ? "text-neon-emerald font-bold" : "text-neon-amber"}>
                            {securityConfig?.mixedContentBlocked ? "ENFORCED" : "INACTIVE"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </AuditCategoryCard>

                </div>
              </div>

              {/* Column 3: History Trends & Stats */}
              <div className="space-y-8 print-card no-print">
                
                {/* Local History trends */}
                <div className="glass-panel rounded-3xl p-6 shadow-sm space-y-5">
                  <h3 className="font-bold text-xs text-white font-mono uppercase tracking-widest border-b border-zinc-900/80 pb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-neon-cyan" /> Local Audit History
                  </h3>
                  <div className="space-y-4 font-mono text-xs">
                    {localHistory.map((item, index) => (
                      <div key={index} className="flex justify-between items-center border-b border-zinc-900/60 pb-2">
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-500 block">{item.timestamp}</span>
                          <span className="text-zinc-400 tracking-wide truncate max-w-[150px] inline-block">{item.ip}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-neon-cyan font-bold bg-neon-cyan/5 border border-neon-cyan/20 px-2 py-0.5 rounded-lg">
                            {item.score}/100
                          </span>
                          <span className="font-extrabold text-white">{item.grade}</span>
                        </div>
                      </div>
                    ))}
                    {localHistory.length === 0 && (
                      <div className="text-center py-6 text-zinc-650 text-[10px] uppercase tracking-wider">
                        No previous records found
                      </div>
                    )}
                  </div>
                </div>

                {/* Technical Node Parameters */}
                <div className="glass-panel rounded-3xl p-6 shadow-sm space-y-4 font-mono text-xs">
                  <h3 className="font-bold text-xs text-white uppercase tracking-widest border-b border-zinc-900/80 pb-3">
                    Diagnostics Parameters
                  </h3>
                  <div className="space-y-3 font-mono text-[10px] text-zinc-400">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">API Gateway URL:</span>
                      <span className="text-zinc-300 truncate max-w-[140px]" title={apiUrlUsed}>{apiUrlUsed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Total Scanned:</span>
                      <span className="text-zinc-300 font-bold">{totalChecked ?? "Connecting..."} users</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Local Cache:</span>
                      <span className="text-neon-emerald font-semibold">Active Filesystem</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Status Check:</span>
                      <span className="text-neon-cyan animate-pulse">Ready</span>
                    </div>
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
