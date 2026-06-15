import { useEffect, useState, useCallback } from "react";
import { ExposurData, HistoryEntry, BrowserCapabilities, SecurityConfig } from "../types";
import {
  getCanvasFingerprint,
  getAudioFingerprint,
  getWebGLFingerprint,
  getBrowserCapabilities,
  getSecurityConfiguration,
  getWebRTCLocalIPs
} from "../utils/fingerprint";

export const testCategories = [
  { id: 0, name: "Network Identity Audit", desc: "Inspecting Public IP routing and ISP subnets" },
  { id: 1, name: "Device Profile Audit", desc: "Checking user-agent formats and device characteristics" },
  { id: 2, name: "Location Accuracy Audit", desc: "Resolving IP coordinates and device GPS boundaries" },
  { id: 3, name: "Browser Fingerprinting Audit", desc: "Hashing canvas rendering and audio synthesis outputs" },
  { id: 4, name: "WebRTC local IP exposure test", desc: "Checking ICE negotiation candidates leaking LAN IPs" },
  { id: 5, name: "DNS Privacy Audit", desc: "Running custom DNS queries checking tunnel leakages" },
  { id: 6, name: "Browser Capabilities Audit", desc: "Verifying local storage blocks and script execution settings" },
  { id: 7, name: "Security Configuration Audit", desc: "Checking HTTPS context and referrer headers leakage" }
];

export const scanSteps = [
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

const apiEndpoint = "/api/whoami";

async function fetchPublicIpWithFallback(): Promise<string> {
  const providers = [
    "https://api64.ipify.org?format=json",
    "https://api.ipify.org?format=json",
    "https://ipapi.co/json/"
  ];
  for (const url of providers) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const data = await res.json();
        if (data && data.ip) return data.ip;
      }
    } catch (e) {
      console.warn(`Failed to fetch IP from ${url}:`, e);
    }
  }
  return "";
}

export function useAuditPipeline() {
  const [auditStarted, setAuditStarted] = useState(false);
  const [auditComplete, setAuditComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Diagnostic Logs & Step Indicators
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [scanLogs, setScanLogs] = useState<string[]>([]);

  // Data States
  const [data, setData] = useState<ExposurData | null>(null);
  const [localIPs, setLocalIPs] = useState<string[]>([]);
  const [canvasHash, setCanvasHash] = useState<string>("detecting...");
  const [audioHash, setAudioHash] = useState<string>("detecting...");
  const [webglInfo, setWebGLInfo] = useState<{ hash: string; vendor: string; renderer: string }>({ hash: "detecting...", vendor: "detecting...", renderer: "detecting..." });
  const [capabilities, setCapabilities] = useState<BrowserCapabilities | null>(null);
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig | null>(null);
  const [gpsData, setGpsData] = useState<{ lat: number; lon: number; accuracy: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [customCoords, setCustomCoords] = useState<{ lat: number; lon: number; label: string } | null>(null);

  // Uniqueness ratios
  const [canvasUniqueness, setCanvasUniqueness] = useState<number | null>(null);
  const [audioUniqueness, setAudioUniqueness] = useState<number | null>(null);
  const [totalChecked, setTotalChecked] = useState<number | null>(null);
  const [apiUrlUsed, setApiUrlUsed] = useState<string>("/api");

  // DNS Leak Test
  const [dnsLeakResolvers, setDnsLeakResolvers] = useState<any[]>([]);
  const [dnsTested, setDnsTested] = useState(false);

  // Adblock Status
  const [adBlockerActive, setAdBlockerActive] = useState<boolean | null>(null);

  // Simulator Form States
  const [simulateSpoof, setSimulateSpoof] = useState(true);
  const [spoofIp, setSpoofIp] = useState("");
  const [selectedUaPreset, setSelectedUaPreset] = useState("current");
  const [customUa, setCustomUa] = useState("");

  // History Drawer
  const [localHistory, setLocalHistory] = useState<HistoryEntry[]>([]);

  const logMessage = useCallback((msg: string) => {
    setScanLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  // Load history from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("exposur_history");
      if (saved) {
        setLocalHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Could not read local storage history");
    }
  }, []);

  // Trigger initial fingerprinting and local WebRTC checks on mount
  useEffect(() => {
    getWebRTCLocalIPs((ip) => {
      setLocalIPs(prev => prev.includes(ip) ? prev : [...prev, ip]);
    });

    const canvas = getCanvasFingerprint();
    setCanvasHash(canvas);

    getAudioFingerprint().then(hash => setAudioHash(hash));
  }, []);

  const triggerAuditPipeline = useCallback(async (overrideIp?: string, overrideUa?: string) => {
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
        let fetchedData: ExposurData | null = null;
        let lastError: any = null;
        let fetchUrl = apiEndpoint;
        const clientOsHint = typeof navigator !== 'undefined' ? (navigator.platform || "") : "";

        let detectedIp = "";
        let clientPlatform = "";
        let clientOsVersion = "";

        // 1. Fetch high-entropy client hints
        if (typeof navigator !== 'undefined' && (navigator as any).userAgentData) {
          const uaData = (navigator as any).userAgentData;
          clientPlatform = uaData.platform || "";
          try {
            const highEntropy = await uaData.getHighEntropyValues(["platformVersion"]);
            clientOsVersion = highEntropy.platformVersion || "";
          } catch (e) {
            console.warn("Failed to get high entropy userAgentData:", e);
          }
        }

        // 2. Fetch public IP if running locally
        try {
          const hostname = typeof window !== 'undefined' ? window.location.hostname : "";
          const isLocal = hostname === "localhost" || 
                          hostname === "127.0.0.1" || 
                          hostname === "[::1]" || 
                          hostname.startsWith("192.168.") || 
                          hostname.startsWith("10.") ||
                          hostname.endsWith(".local");
          
          if (isLocal && !overrideIp) {
            logMessage("[NETWORK] Local environment detected. Fetching public IP for accurate audit...");
            detectedIp = await fetchPublicIpWithFallback();
            if (detectedIp) {
              logMessage(`[NETWORK] Public IP auto-resolved: ${detectedIp}`);
            } else {
              logMessage("[NETWORK] Public IP lookup failed. Falling back to local loopback.");
            }
          }
        } catch (e) {
          console.warn("Error auto-resolving local environment IP:", e);
        }

        const queryParams: string[] = [];
        if (overrideIp) queryParams.push(`spoofIp=${encodeURIComponent(overrideIp)}`);
        if (overrideUa) queryParams.push(`spoofUserAgent=${encodeURIComponent(overrideUa)}`);
        if (clientOsHint) queryParams.push(`clientOs=${encodeURIComponent(clientOsHint)}`);
        if (detectedIp) queryParams.push(`detectedIp=${encodeURIComponent(detectedIp)}`);
        if (clientPlatform) queryParams.push(`clientPlatform=${encodeURIComponent(clientPlatform)}`);
        if (clientOsVersion) queryParams.push(`clientOsVersion=${encodeURIComponent(clientOsVersion)}`);
        
        const queryStr = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

        try {
          const response = await fetch(`${apiEndpoint}${queryStr}`, { cache: "no-store" });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          fetchedData = await response.json();
        } catch (err) {
          try {
            const absoluteUrl = `${window.location.origin}${apiEndpoint}${queryStr}`;
            const response = await fetch(absoluteUrl, { cache: "no-store" });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            fetchedData = await response.json();
            fetchUrl = absoluteUrl;
          } catch (err2) {
            lastError = err2;
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
        const canvas = getCanvasFingerprint();
        setCanvasHash(canvas);
        
        const audio = await getAudioFingerprint();
        setAudioHash(audio);

        const gl = getWebGLFingerprint();
        setWebGLInfo(gl);

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
  }, [apiUrlUsed, logMessage]);

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

  // Privacy Score Calculation
  const getPrivacyScore = useCallback(() => {
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
  }, [data, localIPs, dnsTested, dnsLeakResolvers, securityConfig, adBlockerActive]);

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
        localStorage.setItem("exposur_history", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, [auditComplete, data, getPrivacyScore]);

  const handleBrowserLocate = useCallback(() => {
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
  }, [logMessage]);

  const getRiskBreakdown = useCallback(() => {
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

    if (canvasHash !== "blocked" && canvasHash !== "not-supported" && canvasHash !== "detecting...") {
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
  }, [localIPs, dnsTested, dnsLeakResolvers, securityConfig, data, canvasHash, capabilities]);

  const handleShareReport = useCallback(() => {
    if (!data) return;
    const score = getPrivacyScore();
    const shareText = `Exposur Audit Report\nIPv4 Address: ${data.ip}\nPrivacy Score: ${score}/100\nAnonymization: ${data.anonymization.provider}\nRun your scan here: ${window.location.origin}`;
    navigator.clipboard.writeText(shareText).then(() => {
      alert("Privacy Audit Report copied to clipboard!");
    });
  }, [data, getPrivacyScore]);

  const handleExportPDF = useCallback(() => {
    window.print();
  }, []);

  const handleApplySimulation = useCallback(() => {
    let finalUa = "";
    if (selectedUaPreset === "custom") {
      finalUa = customUa;
    } else if (selectedUaPreset !== "current") {
      finalUa = uaPresets[selectedUaPreset] || "";
    }
    triggerAuditPipeline(spoofIp, finalUa);
  }, [selectedUaPreset, customUa, spoofIp, triggerAuditPipeline]);

  const handleResetSimulation = useCallback(() => {
    setSpoofIp("");
    setSelectedUaPreset("current");
    setCustomUa("");
    setSimulateSpoof(false);
    triggerAuditPipeline();
  }, [triggerAuditPipeline]);

  return {
    auditStarted,
    auditComplete,
    error,
    setError,
    activeCategoryIndex,
    activeStepIndex,
    scanLogs,
    data,
    localIPs,
    canvasHash,
    audioHash,
    webglInfo,
    capabilities,
    securityConfig,
    gpsData,
    setGpsData,
    locating,
    customCoords,
    setCustomCoords,
    canvasUniqueness,
    audioUniqueness,
    totalChecked,
    apiUrlUsed,
    dnsLeakResolvers,
    dnsTested,
    adBlockerActive,
    simulateSpoof,
    setSimulateSpoof,
    spoofIp,
    setSpoofIp,
    selectedUaPreset,
    setSelectedUaPreset,
    customUa,
    setCustomUa,
    localHistory,
    triggerAuditPipeline,
    getPrivacyScore,
    handleBrowserLocate,
    getRiskBreakdown,
    handleShareReport,
    handleExportPDF,
    handleApplySimulation,
    handleResetSimulation
  };
}
