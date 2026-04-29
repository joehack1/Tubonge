const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST,OPTIONS",
      "access-control-allow-headers": "content-type"
    },
    body: JSON.stringify(body)
  };
}

export default async function handler(event) {
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json(500, { error: "Missing GEMINI_API_KEY env var." });
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const prompt = String(payload.prompt || "").trim();
    const history = Array.isArray(payload.history) ? payload.history : [];
    if (!prompt) return json(400, { error: "Prompt is required." });

    const chatTurns = history
      .slice(-8)
      .map((h) => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: String(h.text || "").slice(0, 2000) }]
      }));
    chatTurns.push({
      role: "user",
      parts: [{ text: prompt }]
    });

    const systemPrompt =
      "You are Aston, a friendly AI assistant in a realtime chat app. " +
      "Keep responses concise, helpful, and safe. Use simple language.";

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(DEFAULT_MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            role: "system",
            parts: [{ text: systemPrompt }]
          },
          contents: chatTurns,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 350
          }
        })
      }
    );

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const msg =
        data?.error?.message ||
        data?.message ||
        `Gemini request failed (${resp.status})`;
      return json(resp.status, { error: msg });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p?.text || "")
        .join("")
        .trim() || "";

    if (!reply) {
      return json(502, { error: "No response text returned from Gemini." });
    }

    return json(200, { reply, model: DEFAULT_MODEL });
  } catch (error) {
    return json(500, {
      error: error?.message || "Unexpected Aston function error."
    });
  }
}
