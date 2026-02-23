export interface GeminiOptions {
  apiKey: string;
  leadName: string;
  platform: string;
  category: string;
  notes: string;
  serviceDescription: string;
  tone: string;
  length: string;
  customInstructions: string;
  type: 'dm' | 'followup';
  previousDm?: string;
  templateBase?: string; // NEW: use a template as the base for AI to personalize
}

// Try multiple models in order until one works
const GEMINI_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-pro',
  'gemini-1.0-pro',
];

export async function callGeminiAPI(apiKey: string, prompt: string): Promise<string> {
  let lastError = '';
  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.85,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 512,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
        throw new Error('Empty response from model');
      }

      const err = await response.json().catch(() => ({}));
      lastError = (err as any)?.error?.message || `HTTP ${response.status}`;

      // If it's an auth error, no point trying other models
      if (response.status === 400 || response.status === 401 || response.status === 403) {
        throw new Error(`API Key Error: ${lastError}`);
      }
    } catch (e: any) {
      if (e?.message?.startsWith('API Key Error')) throw e;
      lastError = e?.message || 'Unknown error';
    }
  }
  throw new Error(`All models failed. Last error: ${lastError}`);
}

export async function generateMessageWithGemini(opts: GeminiOptions): Promise<string> {
  const {
    apiKey,
    leadName,
    platform,
    category,
    notes,
    serviceDescription,
    tone,
    length,
    customInstructions,
    type,
    previousDm,
    templateBase,
  } = opts;

  const lengthGuide =
    length === 'short'
      ? 'Keep it under 60 words. Very concise.'
      : length === 'medium'
      ? 'Keep it between 80-120 words.'
      : 'Write a detailed message between 150-200 words.';

  const toneGuide =
    tone === 'professional'
      ? 'Use a professional, formal tone.'
      : tone === 'friendly'
      ? 'Use a warm, friendly and approachable tone.'
      : tone === 'casual'
      ? 'Use a super casual, conversational tone like texting a friend.'
      : tone === 'bold'
      ? 'Use a bold, confident, direct tone that commands attention.'
      : 'Use a witty, fun, and engaging tone with light humor.';

  let prompt = '';

  if (type === 'dm') {
    if (templateBase) {
      prompt = `You are an expert outreach copywriter. I have a message template below. Your job is to PERSONALIZE it for a specific lead while keeping the same general structure and intent.

MY SERVICE/NICHE: ${serviceDescription || 'General outreach.'}

LEAD DETAILS:
- Name: ${leadName}
- Platform: ${platform}
- Category: ${category}
- Notes about this lead: ${notes || 'No additional notes'}

ORIGINAL TEMPLATE TO PERSONALIZE:
"""
${templateBase}
"""

TONE: ${toneGuide}
LENGTH: ${lengthGuide}

ADDITIONAL INSTRUCTIONS FROM USER: ${customInstructions || 'None'}

RULES:
- Replace [Name] or any placeholder with the actual lead name: ${leadName}
- Keep the core message structure but make it feel uniquely written for this person
- Reference their category (${category}) naturally if it fits
- Do NOT use placeholder text like [Your Name] — write as if you are the sender
- Make it feel human and personal
- Use 1-2 emojis max

Write only the personalized message, nothing else.`;
    } else {
      prompt = `You are an expert outreach copywriter. Write a personalized first DM for a lead.

MY SERVICE/NICHE: ${serviceDescription || 'Not specified — write a general outreach message.'}

LEAD DETAILS:
- Name: ${leadName}
- Platform: ${platform}
- Category: ${category}
- Notes about this lead: ${notes || 'No additional notes'}

TONE: ${toneGuide}
LENGTH: ${lengthGuide}

ADDITIONAL INSTRUCTIONS FROM USER: ${customInstructions || 'None'}

RULES:
- Do NOT use placeholder text like [Your Name] or [Your Service] — write as if you are the sender
- Make it feel human and personal, not like a template
- Do NOT include a subject line
- Start directly with a greeting like "Hey ${leadName}!"
- End with a soft call to action (not pushy)
- Use 1-2 relevant emojis max

Write only the message, nothing else.`;
    }
  } else {
    if (templateBase) {
      prompt = `You are an expert outreach copywriter. I have a follow-up message template. Your job is to PERSONALIZE it for this specific lead.

MY SERVICE/NICHE: ${serviceDescription || 'General outreach.'}

LEAD DETAILS:
- Name: ${leadName}
- Platform: ${platform}
- Category: ${category}
- Notes: ${notes || 'No additional notes'}

${previousDm ? `ORIGINAL FIRST DM SENT:\n"${previousDm}"\n` : ''}

FOLLOW-UP TEMPLATE TO PERSONALIZE:
"""
${templateBase}
"""

TONE: ${toneGuide}
LENGTH: ${lengthGuide}

ADDITIONAL INSTRUCTIONS FROM USER: ${customInstructions || 'None'}

RULES:
- Replace [Name] with actual name: ${leadName}
- Keep the follow-up spirit but personalize for this lead
- Reference their category naturally: ${category}
- Don't be pushy — be light and genuine
- Use 1-2 emojis max

Write only the personalized message, nothing else.`;
    } else {
      prompt = `You are an expert outreach copywriter. Write a follow-up DM for a lead who did not reply to the first message.

MY SERVICE/NICHE: ${serviceDescription || 'Not specified — write a general follow-up message.'}

LEAD DETAILS:
- Name: ${leadName}
- Platform: ${platform}
- Category: ${category}
- Notes: ${notes || 'No additional notes'}

${previousDm ? `ORIGINAL FIRST DM SENT:\n"${previousDm}"\n` : ''}

TONE: ${toneGuide}
LENGTH: ${lengthGuide}

ADDITIONAL INSTRUCTIONS FROM USER: ${customInstructions || 'None'}

RULES:
- Acknowledge that you already sent a message before (briefly)
- Don't be pushy or desperate — be light and genuine
- Do NOT use placeholder text
- Start with a casual opener
- Use 1-2 emojis max
- Make it feel human

Write only the message, nothing else.`;
    }
  }

  return callGeminiAPI(apiKey, prompt);
}
