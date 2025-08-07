const FIREWORKS_API_KEY = process.env.FIREWORKS_API_KEY!;
const BASE_URL = process.env.FIREWORKS_BASE_URL || "https://api.fireworks.ai/inference/v1";
const MODEL = process.env.FIREWORKS_MODEL || "accounts/fireworks/models/gpt-oss-20b";

if (!FIREWORKS_API_KEY) {
  throw new Error("Missing FIREWORKS_API_KEY");
}

export async function completeWithFireworks(prompt: string, opts?: {
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stop?: string[]; 
}) {
  const payload = {
    model: MODEL,
    prompt,
    max_tokens: opts?.max_tokens ?? 256,
    temperature: opts?.temperature ?? 0.7,
    top_p: opts?.top_p ?? 1,
    stop: opts?.stop
  };

  const response = await fetch(`${BASE_URL}/completions`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${FIREWORKS_API_KEY}`, 
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fireworks API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  
  // Fireworks returns { choices: [{ text: "..." }], ... }
  return data.choices?.[0]?.text ?? "";
}

