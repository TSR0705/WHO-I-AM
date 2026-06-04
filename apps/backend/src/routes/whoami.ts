import { Router, Request, Response } from 'express';
import UAParser from 'ua-parser-js';
import dns from 'dns';
import { resolveGeolocation } from '../services/geo';
import { vpnDetectorInstance } from '../services/vpn-detector';
import { visitsService } from '../services/visits';

const router = Router();

function getNetworkDetails(ipAddress: string): Promise<{ isp: string; asn: string }> {
  return new Promise((resolve) => {
    if (ipAddress === '127.0.0.1' || ipAddress === '::1') {
      return resolve({ isp: 'Local Loopback Connection', asn: 'AS0' });
    }
    
    dns.reverse(ipAddress, (err, hostnames) => {
      if (err || !hostnames || hostnames.length === 0) {
        return resolve({ isp: 'Unknown ISP / Network', asn: 'Unknown' });
      }
      
      const host = hostnames[0];
      let isp = host;
      let asn = 'Unknown';
      
      if (host.includes('comcast')) { isp = 'Comcast Cable'; asn = 'AS7922'; }
      else if (host.includes('verizon')) { isp = 'Verizon Communications'; asn = 'AS701'; }
      else if (host.includes('att') || host.includes('sbcglobal')) { isp = 'AT&T Internet'; asn = 'AS7018'; }
      else if (host.includes('charter') || host.includes('rr.com')) { isp = 'Charter Communications'; asn = 'AS20115'; }
      else if (host.includes('centurylink')) { isp = 'CenturyLink'; asn = 'AS209'; }
      else if (host.includes('amazonaws')) { isp = 'Amazon Web Services'; asn = 'AS16509'; }
      else if (host.includes('google')) { isp = 'Google LLC'; asn = 'AS15169'; }
      else if (host.includes('cloud.google')) { isp = 'Google Cloud Platform'; asn = 'AS36492'; }
      else if (host.includes('digitalocean')) { isp = 'DigitalOcean LLC'; asn = 'AS14061'; }
      
      resolve({ isp, asn });
    });
  });
}

router.get('/whoami', async (req: Request, res: Response) => {
  const ipRaw = req.ip || (req as any).clientIp || '';
  let ip = ipRaw.replace(/^::ffff:/, '').replace(/^\[::1\]$|^::1$/, '127.0.0.1');
  if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') ip = '127.0.0.1';

  const ua = req.headers['user-agent'] || '';

  // Spoof checks
  const spoofIp = req.query.spoofIp as string;
  const spoofUserAgent = req.query.spoofUserAgent as string;
  const clientOs = req.query.clientOs as string;

  let ipToAudit = ip;
  if (spoofIp && spoofIp.trim() !== '') {
    ipToAudit = spoofIp.trim();
  }

  let uaToAudit = ua;
  if (spoofUserAgent && spoofUserAgent.trim() !== '') {
    uaToAudit = spoofUserAgent.trim();
  }

  const parsed = new UAParser(uaToAudit).getResult();
  const browser = parsed.browser && parsed.browser.name ? `${parsed.browser.name} ${parsed.browser.version || ''}`.trim() : 'Unknown';
  const os = parsed.os && parsed.os.name ? `${parsed.os.name} ${parsed.os.version || ''}`.trim() : 'Unknown';
  const device = parsed.device && parsed.device.type ? parsed.device.type : 'desktop';

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

  // 2. Anonymizer Matches (VPN, Hosting Providers, Tor Nodes)
  const isTorNode = vpnDetectorInstance.isTorNode(ipToAudit);
  const hostingProvider = vpnDetectorInstance.getHostingProvider(ipToAudit);
  const isVpnOrHosting = hostingProvider !== null;

  // 3. User-Agent / Client Feature Mismatches (Suspicious Client Flags)
  let userAgentMismatch = false;
  if (clientOs && os !== 'Unknown') {
    const normalizedOs = os.toLowerCase();
    const normalizedClient = clientOs.toLowerCase();
    
    const isClientMac = normalizedClient.includes('mac') || normalizedClient.includes('ios') || normalizedClient.includes('apple');
    const isClientWindows = normalizedClient.includes('win');
    const isClientLinux = normalizedClient.includes('linux');
    const isClientAndroid = normalizedClient.includes('android');

    const isServerMac = normalizedOs.includes('mac') || normalizedOs.includes('ios');
    const isServerWindows = normalizedOs.includes('win');
    const isServerLinux = normalizedOs.includes('linux');
    const isServerAndroid = normalizedOs.includes('android');

    if (
      (isClientMac && !isServerMac) ||
      (isClientWindows && !isServerWindows) ||
      (isClientLinux && !isServerLinux) ||
      (isClientAndroid && !isServerAndroid)
    ) {
      userAgentMismatch = true;
    }
  }

  // 4. Resolve Location & ISP/ASN Details
  const location = await resolveGeolocation(ipToAudit);
  let netDetails = { isp: 'Local Loopback Connection', asn: 'AS0' };
  try {
    netDetails = await getNetworkDetails(ipToAudit);
  } catch (e) { /* ignore */ }

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
