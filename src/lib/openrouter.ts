export function openRouterKey() {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) throw new Error("Missing OPENROUTER_API_KEY in .env");
  return key;
}

export function hasOpenRouterKey() {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

export function nicheModel() {
  return (
    process.env.OPENROUTER_NICHE_MODEL?.trim() ||
    "anthropic/claude-sonnet-4.5"
  );
}

export function textModel() {
  return (
    process.env.OPENROUTER_TEXT_MODEL?.trim() ||
    "openai/gpt-4o-mini"
  );
}

export function visionModel() {
  return (
    process.env.OPENROUTER_VISION_MODEL?.trim() ||
    textModel()
  );
}

export async function openRouterChat(opts: {
  model: string;
  messages: { role: string; content: unknown }[];
  maxTokens?: number;
}) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openRouterKey()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/sid-kiwilab/youtube-thumbnail-generator",
      "X-Title": "youtube-thumbnail-generator",
    },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      max_tokens: opts.maxTokens ?? 500,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      data?.error?.message || `OpenRouter ${res.status}`,
    );
  }
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from OpenRouter");
  return String(text).trim();
}

export async function generateTitle(prompt: string) {
  const raw = await openRouterChat({
    model: textModel(),
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    maxTokens: 120,
  });
  return raw.replace(/^["']|["']$/g, "").split("\n")[0]?.trim() || raw;
}

export async function visionEval(imageUrlOrDataUrl: string) {
  const system = await import("./prompts").then((m) =>
    m.visionEvalSystemPrompt(),
  );
  const raw = await openRouterChat({
    model: visionModel(),
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: [
          { type: "text", text: "Evaluate this YouTube thumbnail." },
          {
            type: "image_url",
            image_url: { url: imageUrlOrDataUrl },
          },
        ],
      },
    ],
    maxTokens: 300,
  });
  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(raw.slice(start, end + 1)) as {
        score: number;
        notes: string;
      };
    }
  } catch {
    /* fall through */
  }
  return { score: 0, notes: raw };
}