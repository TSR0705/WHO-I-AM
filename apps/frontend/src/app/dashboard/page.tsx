"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { 
  Globe, 
  Cpu, 
  Shield, 
  MapPin, 
  RefreshCw, 
  Compass,
  Printer,
  Share2,
  Clock,
  Terminal,
  Lock,
  ArrowLeft,
  HelpCircle,
  EyeOff
} from "lucide-react";

// Components
import ScannerConsole from "../components/ScannerConsole";
import PrivacyScoreDial from "../components/PrivacyScoreDial";
import RiskFindingsCard from "../components/RiskFindingsCard";
import SimulationConsole from "../components/SimulationConsole";
import EducationalDrawer from "../components/EducationalDrawer";
import AuditCategoryCard from "../components/AuditCategoryCard";

// Category Panels
import NetworkAuditPanel from "../components/categories/NetworkAuditPanel";
import DeviceAuditPanel from "../components/categories/DeviceAuditPanel";
import FingerprintAuditPanel from "../components/categories/FingerprintAuditPanel";
import WebRTCDNSPanel from "../components/categories/WebRTCDNSPanel";
import CapabilitiesPanel from "../components/categories/CapabilitiesPanel";
import SecurityPanel from "../components/categories/SecurityPanel";

// Custom Hook & Constants
import { useAuditPipeline, testCategories } from "../hooks/useAuditPipeline";

// Dynamic Leaflet Map wrapper
const DynamicMap = dynamic(() => import("../components/Map"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-[320px] rounded-2xl bg-zinc-950/60 border border-zinc-900 animate-pulse flex items-center justify-center text-cyan-500 font-mono text-xs">
      INITIALIZING MAP ENGINE...
    </div>
  )
});

export default function Dashboard() {
  const {
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
  } = useAuditPipeline();

  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [terminalCollapsed, setTerminalCollapsed] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [selectedEduKey, setSelectedEduKey] = useState<string | null>(null);

  // Trigger scan automatically on mount
  useEffect(() => {
    triggerAuditPipeline();
  }, [triggerAuditPipeline]);

  // Scroll terminal to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [scanLogs]);

  const score = getPrivacyScore();
  const riskFindings = getRiskBreakdown();

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

        {/* Live scanning progress overlay */}
        {!auditComplete && (
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
        {auditComplete && data && (
          <div className="space-y-8">
            
            {/* Top Controls Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-center glass-panel rounded-2xl px-5 py-3.5 gap-4 no-print">
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="p-2 bg-zinc-950/60 hover:bg-zinc-900 border border-zinc-900 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center"
                  title="Return to Home"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
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
                      className="px-4 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-zinc-350 text-xs font-mono font-bold transition-all cursor-pointer"
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
                    <NetworkAuditPanel data={data} isAdvancedMode={isAdvancedMode} apiUrlUsed={apiUrlUsed} />
                  </AuditCategoryCard>

                  {/* Category 2: Device Profile Audit */}
                  <AuditCategoryCard
                    title="Device Profile Audit"
                    icon={<Cpu className="w-4 h-4 text-neon-cyan" />}
                    eduKey="browser"
                    onExplainClick={handleOpenEducation}
                  >
                    <DeviceAuditPanel data={data} isAdvancedMode={isAdvancedMode} />
                  </AuditCategoryCard>

                  {/* Category 4: Browser Fingerprint Audit */}
                  <AuditCategoryCard
                    title={isAdvancedMode ? "Browser Fingerprinting Audit" : "Browser Identity Profile"}
                    icon={<Cpu className="w-4 h-4 text-neon-cyan" />}
                    eduKey="canvas"
                    onExplainClick={handleOpenEducation}
                    paddingStyle="p-0"
                  >
                    <FingerprintAuditPanel
                      canvasHash={canvasHash}
                      webglInfo={webglInfo}
                      audioHash={audioHash}
                      canvasUniqueness={canvasUniqueness}
                      audioUniqueness={audioUniqueness}
                      isAdvancedMode={isAdvancedMode}
                    />
                  </AuditCategoryCard>

                  {/* Category 5 & 6: WebRTC & DNS leaks */}
                  <AuditCategoryCard
                    title="WebRTC & DNS Privacy"
                    icon={<Shield className="w-4 h-4 text-neon-cyan" />}
                    eduKey="webrtc"
                    onExplainClick={handleOpenEducation}
                    paddingStyle="p-0"
                  >
                    <WebRTCDNSPanel
                      localIPs={localIPs}
                      dnsTested={dnsTested}
                      dnsLeakResolvers={dnsLeakResolvers}
                      isAdvancedMode={isAdvancedMode}
                    />
                  </AuditCategoryCard>

                  {/* Category 7: Browser Capabilities */}
                  <AuditCategoryCard
                    title="Browser Capabilities Audit"
                    icon={<Terminal className="w-4 h-4 text-neon-cyan" />}
                    eduKey="capabilities"
                    onExplainClick={handleOpenEducation}
                  >
                    <CapabilitiesPanel capabilities={capabilities} />
                  </AuditCategoryCard>

                  {/* Category 8: Security Configurations */}
                  <AuditCategoryCard
                    title="Security Configuration Audit"
                    icon={<Lock className="w-4 h-4 text-neon-cyan" />}
                    eduKey="security"
                    onExplainClick={handleOpenEducation}
                  >
                    <SecurityPanel securityConfig={securityConfig} />
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
