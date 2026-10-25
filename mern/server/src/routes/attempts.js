import { Router } from 'express';
import { z } from 'zod';
import { TestAttempt } from '../models/TestAttempt.js';
import { Mcq } from '../models/Mcq.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../utils/errors.js';

const router = Router();
router.use(requireAuth);

const submitBody = z.object({
  category: z.string().trim().max(80).default('ALL'),
  startedAt: z.string().datetime().optional(),
  answers: z
    .array(
      z.object({
        mcqId: z.string().min(1),
        selectedIndex: z.number().int().min(0).max(3).nullable(),
      })
    )
    .min(1)
    .max(100),
});

router.post(
  '/',
  validate(submitBody),
  asyncHandler(async (req, res) => {
    const { category, startedAt, answers } = req.body;

    const ids = answers.map((answer) => answer.mcqId);
    const mcqs = await Mcq.find({ _id: { $in: ids } });
    if (mcqs.length === 0) throw new ApiError(400, 'No valid questions in this attempt');

    const byId = new Map(mcqs.map((mcq) => [String(mcq._id), mcq]));
    const errorsByCategory = new Map();

    let correct = 0;
    let wrong = 0;
    let unattempted = 0;

    const graded = answers.map((answer) => {
      const mcq = byId.get(answer.mcqId);
      if (!mcq) {
        unattempted += 1;
        return { mcq: answer.mcqId, selectedIndex: answer.selectedIndex, correct: false };
      }

      if (answer.selectedIndex === null || answer.selectedIndex === undefined) {
        unattempted += 1;
        return { mcq: mcq._id, selectedIndex: null, correct: false };
      }

      const isCorrect = answer.selectedIndex === mcq.answerIndex;
      if (isCorrect) {
        correct += 1;
      } else {
        wrong += 1;
        errorsByCategory.set(
          mcq.category,
          (errorsByCategory.get(mcq.category) || 0) + 1
        );
      }

      return { mcq: mcq._id, selectedIndex: answer.selectedIndex, correct: isCorrect };
    });

    const total = graded.length;
    const percentage = Math.round((correct / total) * 100);

    const weakSubjects = [...errorsByCategory.entries()]
      .map(([name, wrongCount]) => ({ category: name, wrong: wrongCount }))
      .sort((a, b) => b.wrong - a.wrong);

    const attempt = await TestAttempt.create({
      user: req.user.id,
      category,
      total,
      correct,
      wrong,
      unattempted,
      percentage,
      weakSubjects,
      answers: graded,
      startedAt: startedAt ? new Date(startedAt) : undefined,
    });

    res.status(201).json({ data: { attempt } });
  })
);

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const attempts = await TestAttempt.find({ user: req.user.id })
      .sort({ submittedAt: -1 })
      .limit(20);
    res.json({ data: { items: attempts } });
  })
);

export default router;
