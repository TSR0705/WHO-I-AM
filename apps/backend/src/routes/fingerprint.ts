import { Router, Request, Response } from 'express';
import { pool } from '../services/db';
import { ENV } from '../config/env';
import pino from 'pino';

const logger = pino({ level: ENV.LOG_LEVEL });
const router = Router();

router.post('/fingerprint', async (req: Request, res: Response) => {
  try {
    const { canvasHash, audioHash, browser, os, device } = req.body;
    if (!canvasHash || !audioHash) {
      return res.status(400).json({ error: 'Missing canvasHash or audioHash' });
    }

    let canvasUniqueness = 100.0;
    let audioUniqueness = 100.0;
    let totalProfiles = 1;

    if (ENV.DATABASE_URL) {
      try {
        await pool.query(
          'INSERT INTO fingerprints (canvas_hash, audio_hash, browser, os, device) VALUES ($1, $2, $3, $4, $5)',
          [canvasHash, audioHash, browser || 'Unknown', os || 'Unknown', device || 'desktop']
        );

        const totalRes = await pool.query('SELECT COUNT(*) FROM fingerprints');
        totalProfiles = Number(totalRes.rows[0].count || 1);

        const canvasRes = await pool.query('SELECT COUNT(*) FROM fingerprints WHERE canvas_hash = $1', [canvasHash]);
        const canvasCount = Number(canvasRes.rows[0].count || 1);
        canvasUniqueness = (canvasCount / totalProfiles) * 100;

        const audioRes = await pool.query('SELECT COUNT(*) FROM fingerprints WHERE audio_hash = $1', [audioHash]);
        const audioCount = Number(audioRes.rows[0].count || 1);
        audioUniqueness = (audioCount / totalProfiles) * 100;
      } catch (dbErr) {
        logger.error({ err: dbErr }, 'Database query failed, falling back to clean defaults');
        canvasUniqueness = 100.0;
        audioUniqueness = 100.0;
        totalProfiles = 1;
      }
    }

    return res.json({
      totalChecked: totalProfiles,
      canvas: {
        hash: canvasHash,
        sharedPercentage: Number(canvasUniqueness.toFixed(2)),
        isUnique: canvasUniqueness <= (100 / totalProfiles)
      },
      audio: {
        hash: audioHash,
        sharedPercentage: Number(audioUniqueness.toFixed(2)),
        isUnique: audioUniqueness <= (100 / totalProfiles)
      }
    });
  } catch (err) {
    logger.error({ err }, 'Failed to compute fingerprint uniqueness');
    return res.status(500).json({ error: 'Failed to process fingerprint' });
  }
});

export default router;
