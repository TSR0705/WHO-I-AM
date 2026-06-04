import { Router, Request, Response } from 'express';
// @ts-ignore
import geoip from 'geoip-lite';
import { dnsCache } from '../services/dns';
import { visitsService } from '../services/visits';
import { ENV } from '../config/env';

const router = Router();

router.get('/dns-leak/init', (req: Request, res: Response) => {
  const token = Math.random().toString(36).substring(2, 10);
  const dnsDomain = ENV.DNS_DOMAIN;
  const testSubdomain = `${token}.${dnsDomain}`;
  
  if (!visitsService.redis || !visitsService.redisReady) {
    dnsCache.set(token, []);
  }
  
  res.json({ token, testSubdomain });
});

router.get('/dns-leak/check', async (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (!token) {
    return res.status(400).json({ error: 'Missing token parameter' });
  }

  let resolvers: string[] = [];

  if (visitsService.redis && visitsService.redisReady) {
    resolvers = await visitsService.redis.smembers(`dns:leak:${token}`);
  } else {
    resolvers = dnsCache.get(token) || [];
  }

  const resolvedResolvers = resolvers.map(ip => {
    const geo = geoip.lookup(ip) || {};
    return {
      ip,
      country: geo.country || 'Unknown',
      region: geo.region || 'Unknown',
      city: geo.city || 'Unknown'
    };
  });

  return res.json({
    token,
    resolversCount: resolvedResolvers.length,
    resolvers: resolvedResolvers
  });
});

export default router;
