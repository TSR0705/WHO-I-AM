export interface LocationData {
  city: string;
  region: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
}

export interface VisitData {
  total: number;
  unique: number;
  yourVisits: number;
}

export interface ProxyData {
  hasProxyHeaders: boolean;
  parsedHeaders: Record<string, string>;
  rawForwardedCount: number;
}

export interface AnonymizationData {
  isVpnOrHosting: boolean;
  isTorNode: boolean;
  provider: string;
}

export interface SimulationData {
  active: boolean;
  isSpoofedIp: boolean;
  isSpoofedUserAgent: boolean;
  realIp: string;
  realUserAgent: string;
}

export interface SecurityAuditData {
  userAgentMismatch: boolean;
}

export interface ExposurData {
  ip: string;
  network?: {
    isp: string;
    asn: string;
    timezone: string;
  };
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

export interface EduItem {
  name: string;
  whatChecked: string;
  whyAccess: string;
  privacyImpact: string;
  realWorldExample: string;
  protection: string;
  learnMore: string;
}

export interface HistoryEntry {
  timestamp: string;
  score: number;
  ip: string;
  grade: string;
}

export interface BrowserCapabilities {
  cookiesEnabled: boolean;
  localStorageSupported: boolean;
  sessionStorageSupported: boolean;
  indexedDbSupported: boolean;
  serviceWorkerSupported: boolean;
  javascriptEnabled: boolean;
}

export interface SecurityConfig {
  isHttps: boolean;
  isSecureContext: boolean;
  referrer: string;
  mixedContentBlocked: boolean;
}
