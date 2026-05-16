/**
 * Invoice total extraction via Groq (Llama 4 Scout). Set GROQ_API_KEY in .env.
 * Returns null amount if the key is missing or parsing fails (creator can edit manually).
 */

const GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

export type InvoiceOcrResult = {
  amountINR: number | null;
  rawText: string;
};

export async function extractInvoiceAmountINRFromDocument(
  base64Data: string,
  mimeType: string
): Promise<InvoiceOcrResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { amountINR: null, rawText: '' };
  }

  const url = `https://api.groq.com/openai/v1/chat/completions`;

  const body = {
    model: GROQ_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `You are reading an invoice or receipt. Find the total amount payable in Indian Rupees (INR).
Respond with ONLY valid JSON, no markdown: {"amountINR": <number>} where amountINR is a positive decimal number.
If unclear, use {"amountINR": null}.`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType || 'application/pdf'};base64,${base64Data}`,
            },
          },
        ],
      },
    ],
    temperature: 0.1,
    max_tokens: 256,
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Groq OCR HTTP error', res.status, err);
      return { amountINR: null, rawText: err.slice(0, 500) };
    }

    const json = await res.json();
    const text: string = json?.choices?.[0]?.message?.content || '';

    const match = text.match(/\{[\s\S]*"amountINR"[\s\S]*\}/);
    if (!match) {
      return { amountINR: null, rawText: text };
    }

    const parsed = JSON.parse(match[0]) as { amountINR?: number | null };
    const n = parsed.amountINR;
    if (n == null || !Number.isFinite(Number(n)) || Number(n) <= 0) {
      return { amountINR: null, rawText: text };
    }

    return { amountINR: Number(n), rawText: text };
  } catch (e) {
    console.error('Groq OCR error', e);
    return { amountINR: null, rawText: '' };
  }
}