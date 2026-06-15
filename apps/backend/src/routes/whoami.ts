import { Router, Request, Response } from 'express';
import UAParser from 'ua-parser-js';
import { resolveGeolocation } from '../services/geo';
import { vpnDetectorInstance } from '../services/vpn-detector';
import { visitsService } from '../services/visits';
import { AsnLookupService } from '../services/asn';

const router = Router();

function isLocalIp(addr: string): boolean {
  const clean = addr.trim().replace(/^::ffff:/, '');
  if (clean.startsWith('127.') || clean === '::1' || clean === '0:0:0:0:0:0:0:1') return true;
  if (clean.startsWith('10.') || clean.startsWith('192.168.') || clean.startsWith('169.254.')) return true;
  if (clean.startsWith('172.')) {
    const parts = clean.split('.');
    if (parts.length >= 2) {
      const secondOctet = parseInt(parts[1], 10);
      if (secondOctet >= 16 && secondOctet <= 31) return true;
    }
  }
  const normalized = clean.toLowerCase();
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) return true;
  return false;
}

function getWindowsVersionName(platformVersion: string): string {
  if (!platformVersion) return '10';
  const cleanVersion = platformVersion.replace(/"/g, '').trim();
  const parts = cleanVersion.split('.');
  const major = parseInt(parts[0], 10);
  if (!isNaN(major)) {
    if (major >= 13 || major >= 22000) {
      return '11';
    }
  }
  return '10';
}

router.get('/whoami', async (req: Request, res: Response) => {
  const ipRaw = req.ip || (req as any).clientIp || '';
  let ip = ipRaw.replace(/^::ffff:/, '').replace(/^\[::1\]$|^::1$/, '127.0.0.1');
  if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') ip = '127.0.0.1';

  const ua = req.headers['user-agent'] || '';

  // Spoof checks and client hints
  const spoofIp = req.query.spoofIp as string;
  const spoofUserAgent = req.query.spoofUserAgent as string;
  const clientOs = req.query.clientOs as string;
  const detectedIp = req.query.detectedIp as string;
  const clientPlatform = req.query.clientPlatform as string;
  const clientOsVersion = req.query.clientOsVersion as string;

  const chPlatform = (req.headers['sec-ch-ua-platform'] as string) || '';
  const chPlatformVersion = (req.headers['sec-ch-ua-platform-version'] as string) || '';

  let ipToAudit = ip;
  if (spoofIp && spoofIp.trim() !== '') {
    ipToAudit = spoofIp.trim();
  } else if (isLocalIp(ip) && detectedIp && detectedIp.trim() !== '' && !isLocalIp(detectedIp)) {
    ipToAudit = detectedIp.trim();
  }

  let uaToAudit = ua;
  if (spoofUserAgent && spoofUserAgent.trim() !== '') {
    uaToAudit = spoofUserAgent.trim();
  }

  const parsed = new UAParser(uaToAudit).getResult();
  const browser = parsed.browser && parsed.browser.name ? `${parsed.browser.name} ${parsed.browser.version || ''}`.trim() : 'Unknown';
  let os = parsed.os && parsed.os.name ? `${parsed.os.name} ${parsed.os.version || ''}`.trim() : 'Unknown';
  const device = parsed.device && parsed.device.type ? parsed.device.type : 'desktop';

  // Apply OS version normalization from Client Hints
  const isWindows = os.toLowerCase().includes('windows') || 
                    chPlatform.toLowerCase().includes('win') || 
                    (clientPlatform && clientPlatform.toLowerCase().includes('win'));
                     
  const isMac = os.toLowerCase().includes('mac') || 
                chPlatform.toLowerCase().includes('mac') || 
                (clientPlatform && clientPlatform.toLowerCase().includes('mac'));

  const isAndroid = os.toLowerCase().includes('android') || 
                    chPlatform.toLowerCase().includes('android') || 
                    (clientPlatform && clientPlatform.toLowerCase().includes('android'));

  const versionToUse = (clientOsVersion && clientOsVersion.trim() !== '') ? clientOsVersion : chPlatformVersion;

  if (versionToUse && versionToUse.trim() !== '') {
    const cleanVer = versionToUse.replace(/"/g, '').trim();
    if (isWindows) {
      const windowsVer = getWindowsVersionName(cleanVer);
      os = `Windows ${windowsVer}`;
    } else if (isMac) {
      os = `macOS ${cleanVer}`;
    } else if (isAndroid) {
      os = `Android ${cleanVer}`;
    }
  }

  // 1. Proxy Headers Parser
  const viaHeader = req.headers['via'] || '';
  const forwardedHeader = req.headers['forwarded'] || '';
  const xForwardedForHeader = req.headers['x-forwarded-for'] || '';
  const clientIpHeader = req.headers['client-ip'] || req.headers['x-client-ip'] || '';
  const xRealIpHeader = req.headers['x-real-ip'] || '';

  const parsedHeaders: Record<string, string> = {};
  if (viaHeader) parsedHeaders['via'] = String(viaHeader);
  if (forwardedHeader) parsedHeaders['forwarded'] = String(forwardedHeader);
  if (xForwardedForHeader) parsedHeaders['x-forwarded-for'] = String(xForwardedForHeader);
  if (clientIpHeader) parsedHeaders['client-ip'] = String(clientIpHeader);
  if (xRealIpHeader) parsedHeaders['x-real-ip'] = String(xRealIpHeader);

  const hasProxyHeaders = Object.keys(parsedHeaders).length > 0;
  const xffIps = typeof xForwardedForHeader === 'string' ? xForwardedForHeader.split(',').map(s => s.trim()) : [];
  const rawForwardedCount = xffIps.length;

  // Resolve Location & ISP/ASN Details (First, so ASN Org is available for Hosting checks)
  const location = await resolveGeolocation(ipToAudit);
  let netDetails = { isp: 'Unknown ISP / Network', asn: 'Unknown' };
  try {
    const asnRes = await AsnLookupService.lookup(ipToAudit);
    netDetails = { isp: asnRes.organization, asn: asnRes.asn };
  } catch (e) { /* ignore */ }

  // 2. Anonymizer Matches (VPN, Hosting Providers, Tor Nodes)
  const isTorNode = vpnDetectorInstance.isTorNode(ipToAudit);
  const hostingProvider = vpnDetectorInstance.getHostingProvider(ipToAudit, netDetails.isp);
  const isVpnOrHosting = hostingProvider !== null;

  // 3. User-Agent / Client Feature Mismatches (Suspicious Client Flags)
  let userAgentMismatch = false;
  if (clientOs && os !== 'Unknown') {
    const normalizedOs = os.toLowerCase();
    const normalizedClient = clientOs.toLowerCase();
    
    const isClientMac = normalizedClient.includes('mac') || normalizedClient.includes('ios') || normalizedClient.includes('apple') || normalizedClient.includes('iphone') || normalizedClient.includes('ipad');
    const isClientWindows = normalizedClient.includes('win');
    const isClientLinux = normalizedClient.includes('linux');
    const isClientAndroid = normalizedClient.includes('android');

    const isServerMac = normalizedOs.includes('mac') || normalizedOs.includes('ios') || normalizedOs.includes('iphone') || normalizedOs.includes('ipad');
    const isServerWindows = normalizedOs.includes('win');
    const isServerLinux = normalizedOs.includes('linux');
    const isServerAndroid = normalizedOs.includes('android');

    // Android and Linux are compatible (Android reports "Linux" on navigator.platform)
    const matchesMac = isClientMac && isServerMac;
    const matchesWindows = isClientWindows && isServerWindows;
    const matchesAndroid = isClientAndroid && isServerAndroid;
    const matchesLinux = isClientLinux && (isServerLinux || isServerAndroid); // Android is Linux

    const clientHasBrand = isClientMac || isClientWindows || isClientAndroid || isClientLinux;
    const serverHasBrand = isServerMac || isServerWindows || isServerAndroid || isServerLinux;

    if (clientHasBrand && serverHasBrand) {
      if (!matchesMac && !matchesWindows && !matchesAndroid && !matchesLinux) {
        userAgentMismatch = true;
      }
    }
  }

  try {
    const v = await visitsService.increment(ip);
    
    res.json({
      ip: ipToAudit,
      network: {
        isp: netDetails.isp,
        asn: netDetails.asn,
        timezone: location.timezone || 'UTC'
      },
      browser,
      os,
      device,
      location,
      visits: { total: v.total, unique: v.unique, yourVisits: v.yourVisits },
      proxy: {
        hasProxyHeaders,
        parsedHeaders,
        rawForwardedCount
      },
      anonymization: {
        isVpnOrHosting,
        isTorNode,
        provider: hostingProvider || (isTorNode ? 'Tor Exit Node' : 'None')
      },
      simulation: {
        active: !!(spoofIp || spoofUserAgent),
        isSpoofedIp: !!spoofIp && spoofIp !== ip,
        isSpoofedUserAgent: !!spoofUserAgent && spoofUserAgent !== ua,
        realIp: ip,
        realUserAgent: ua
      },
      securityAudit: {
        userAgentMismatch
      }
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update visits data' });
  }
});

export default router;
