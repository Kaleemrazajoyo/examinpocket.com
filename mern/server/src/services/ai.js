import { env } from '../config/env.js';

const SYSTEM_PROMPT =
  'You are ExamInPocket Gemini AI Tutor, a friendly CSS/PMS senior mentor in Pakistan. ' +
  'Explain concepts in simple Roman Urdu / Hinglish with clear bullet points. ' +
  'Keep answers exam-focused and under 250 words unless the student asks for detail.';

function fallbackReply(prompt = '') {
  return (
    `Suno student! Topic **"${prompt}"** ko simple Roman Urdu mein samajhte hain:\n\n` +
    '* **Core Concept:** Yeh competitive exams (FPSC, SPSC, PPSC, CSS) ka high-yield concept hai.\n' +
    '* **Exam Tip:** Pehle definition yaad karein, phir ek current example likhein.\n' +
    '* **Next Step:** Library section se related notes revise karein aur mock test dein.'
  );
}

async function callGemini(prompt) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(env.geminiModel)}:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(25000),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 900 },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Gemini ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = (data?.candidates?.[0]?.content?.parts || [])
    .map((part) => part?.text)
    .filter(Boolean)
    .join('\n')
    .trim();

  if (!text) throw new Error('Gemini returned an empty response');
  return text;
}

/**
 * Ask the AI tutor. Always resolves — falls back to a canned reply when the
 * key is missing or the upstream call fails, so the UI never breaks.
 */
export async function askTutor(prompt) {
  if (!env.geminiApiKey) {
    return { reply: fallbackReply(prompt), offline: true, reason: 'missing-key' };
  }

  try {
    const reply = await callGemini(prompt);
    return { reply, offline: false };
  } catch (error) {
    return {
      reply: fallbackReply(prompt),
      offline: true,
      reason: env.isProd ? 'upstream-error' : error.message,
    };
  }
}

export function buildMcqPrompt(mcq) {
  const letters = ['A', 'B', 'C', 'D'];
  const options = mcq.options
    .map((option, index) => `${letters[index]}. ${option}`)
    .join('\n');

  return (
    `Explain this MCQ for a CSS/PMS student.\n\n` +
    `Question: ${mcq.question}\n${options}\n` +
    `Correct answer: ${letters[mcq.answerIndex]}. ${mcq.options[mcq.answerIndex]}\n` +
    `Existing explanation: ${mcq.explanation || 'none'}\n\n` +
    `Explain why the correct option is right, why the others are wrong, and give one exam tip.`
  );
}
