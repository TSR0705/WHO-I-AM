import { Router, Request, Response } from 'express';
import { visitsService } from '../services/visits';

const router = Router();

router.get('/visits', async (req: Request, res: Response) => {
  try {
    const counts = await visitsService.getCounts();
    return res.json(counts);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to read visits statistics' });
  }
});

export default router;
