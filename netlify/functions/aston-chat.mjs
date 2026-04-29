const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash"
].filter(Boolean);
const TEST_GEMINI_API_KEY = "AIzaSyC9-SKbxtrN33RTVYZDLFfCsdlToO1rTa4";

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

export const handler = async (event) => {
  const method = event?.httpMethod || event?.requestContext?.http?.method || "GET";
  if (method === "OPTIONS") return json(200, { ok: true });
  if (method !== "POST") return json(405, { error: "Method not allowed" });

  const apiKey = process.env.GEMINI_API_KEY || TEST_GEMINI_API_KEY;
  if (!apiKey) {
    return json(500, { error: "Missing GEMINI_API_KEY env var." });
  }

  try {
    async function resolveModels(apiKey) {
      const listed = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
      );
      const payload = await listed.json().catch(() => ({}));
      const valid = Array.isArray(payload?.models)
        ? payload.models
            .filter((m) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes("generateContent"))
            .map((m) => String(m.name || "").replace(/^models\//, ""))
            .filter(Boolean)
        : [];
      return Array.from(new Set([...MODEL_CANDIDATES, ...valid]));
    }

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

    let data = {};
    let usedModel = "";
    let lastError = "";

    const modelsToTry = await resolveModels(apiKey);
    for (const model of modelsToTry) {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
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

      data = await resp.json().catch(() => ({}));
      if (resp.ok) {
        usedModel = model;
        break;
      }
      lastError =
        data?.error?.message ||
        data?.message ||
        `Gemini request failed (${resp.status})`;
    }

    if (!usedModel) {
      return json(502, { error: lastError || "No compatible Gemini model worked." });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p?.text || "")
        .join("")
        .trim() || "";

    if (!reply) {
      return json(502, { error: "No response text returned from Gemini." });
    }

    return json(200, { reply, model: usedModel });
  } catch (error) {
    return json(500, {
      error: error?.message || "Unexpected Aston function error."
    });
  }
};
