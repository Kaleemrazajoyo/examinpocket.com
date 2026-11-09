import { env } from '../config/env.js';

const SYSTEM_PROMPT =
  'You are ExamInPocket AI Tutor, a friendly CSS/PMS/PPSC/FPSC senior mentor in Pakistan. ' +
  'Answer in simple Roman Urdu / English mix unless the student asks for English or Urdu script. ' +
  'Be accurate: never invent dates, names, statistics, quotes or sources. If you are not sure about a fact or current event, ' +
  'say clearly that you are not sure and advise the student to verify from an official or reliable source. ' +
  'You may answer general knowledge and current affairs questions, not only ExamInPocket data. ' +
  'Keep answers exam-focused with short headings and bullet points. ' +
  'Keep normal answers under 250 words unless the student asks for detail.';

// Gemini model names change over time. Try the configured model first, then
// fall back to other available Flash models so a retired model name does not
// break the whole AI tutor.
const MODEL_FALLBACKS = [
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
];

function modelList() {
  const preferred = String(env.geminiModel || '').trim();
  return [...new Set([preferred, ...MODEL_FALLBACKS].filter(Boolean))];
}

function normalizeHistory(history = []) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (message) =>
        message &&
        typeof message.text === 'string' &&
        message.text.trim() &&
        (message.role === 'user' || message.role === 'model' || message.role === 'ai')
    )
    .slice(-10)
    .map((message) => ({
      role: message.role === 'user' ? 'user' : 'model',
      parts: [{ text: message.text.trim().slice(0, 4000) }],
    }));
}

function blockedReply(reason) {
  return (
    `Yeh sawal safety policy ki wajah se answer nahi ho saka (${reason}). ` +
    'Baraye meharbani sawal ko doosre alfaz mein dobara likhein.'
  );
}

async function callGeminiModel(model, prompt, history) {
  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/' +
    `${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(45000),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
        topP: 0.95,
        maxOutputTokens: 1600,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    const error = new Error(`Gemini ${response.status}: ${body.slice(0, 300)}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const blockReason = data?.promptFeedback?.blockReason;
  if (blockReason) {
    return { text: blockedReply(blockReason), blocked: true, finishReason: 'BLOCKED' };
  }

  const candidate = data?.candidates?.[0];
  const text = (candidate?.content?.parts || [])
    .map((part) => part?.text)
    .filter(Boolean)
    .join('\n')
    .trim();

  if (!text) {
    const finishReason = candidate?.finishReason || 'UNKNOWN';
    if (finishReason === 'SAFETY' || finishReason === 'PROHIBITED_CONTENT') {
      return { text: blockedReply(finishReason), blocked: true, finishReason };
    }
    throw new Error(`Gemini returned an empty response (${finishReason})`);
  }

  return { text, blocked: false, finishReason: candidate?.finishReason || 'STOP' };
}

function shouldTryNextModel(error) {
  if (!error) return false;
  // A timeout or network failure will hit every model, so stop early.
  if (error.name === 'TimeoutError' || error.name === 'AbortError') return false;

  const status = Number(error.status);
  const message = String(error.message || '');

  if (status === 404 || status === 429) return true;
  if (status >= 500) return true;
  if (status === 400) {
    return /not found|not supported|does not exist|invalid model|unknown model/i.test(message);
  }
  if (status === 403) {
    // Invalid API key / permission errors will not improve with another model.
    return !/api key|permission|unauthenticated|credential/i.test(message);
  }
  return false;
}

async function callGemini(prompt, history) {
  const errors = [];

  for (const model of modelList().slice(0, 5)) {
    try {
      const result = await callGeminiModel(model, prompt, history);
      return { ...result, model };
    } catch (error) {
      errors.push(`${model}: ${error.message}`);
      if (!shouldTryNextModel(error)) break;
    }
  }

  throw new Error(errors.join(' | ').slice(0, 500) || 'All Gemini models failed');
}

/**
 * Ask the AI tutor. Always resolves so the UI never breaks, but returns a
 * clear offline message instead of fake study content when the API fails.
 */
export async function askTutor(prompt, history = []) {
  if (!env.geminiApiKey) {
    return {
      reply:
        'AI Tutor abhi configure nahi hua. Admin ko Render par GEMINI_API_KEY add karna hoga, phir service redeploy karein.',
      offline: true,
      reason: 'missing-key',
    };
  }

  try {
    const result = await callGemini(prompt, normalizeHistory(history));
    return {
      reply: result.text,
      offline: false,
      provider: 'gemini',
      model: result.model,
      blocked: Boolean(result.blocked),
    };
  } catch (error) {
    console.error('[ai] Gemini request failed:', error.message);
    return {
      reply:
        'AI Tutor se connect nahi ho saka. Thori der baad dobara koshish karein. ' +
        'Agar masla barqarar rahe to admin Render logs check karein.',
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
