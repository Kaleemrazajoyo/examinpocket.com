import { Router } from 'express';
import { z } from 'zod';
import { Mcq } from '../models/Mcq.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { asyncHandler, ApiError } from '../utils/errors.js';
import { askTutor, buildMcqPrompt } from '../services/ai.js';

const router = Router();
router.use(requireAuth);
router.use(aiLimiter);

const chatBody = z.object({
  prompt: z.string().trim().min(2).max(2000),
});

const explainBody = z.object({
  mcqId: z.string().min(1),
});

router.post(
  '/chat',
  validate(chatBody),
  asyncHandler(async (req, res) => {
    const result = await askTutor(req.body.prompt);
    res.json({ data: result });
  })
);

router.post(
  '/explain-mcq',
  validate(explainBody),
  asyncHandler(async (req, res) => {
    const mcq = await Mcq.findById(req.body.mcqId);
    if (!mcq) throw new ApiError(404, 'MCQ not found');

    const prompt = buildMcqPrompt(mcq);
    const result = await askTutor(prompt);
    res.json({ data: { ...result, mcqId: mcq._id } });
  })
);

export default router;
