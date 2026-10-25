import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';
import { resolveLink } from '../services/onedrive.js';

const router = Router();

const linkBody = z.object({
  url: z.string().trim().min(1),
});

router.post(
  '/resolve',
  requireAuth,
  requireAdmin,
  validate(linkBody),
  asyncHandler(async (req, res) => {
    const result = await resolveLink(req.body.url);
    res.json({ data: result });
  })
);

export default router;
