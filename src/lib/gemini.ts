// Minimal wrapper around Gemini's generateContent REST API — no SDK, same
// raw-fetch style as the Telegram OCR integration. The API key is per-user,
// stored in app_settings (Settings page), never an env var.

export type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } };
export type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

export async function generateContent({
  apiKey,
  model,
  systemInstruction,
  contents,
  responseSchema,
}: {
  apiKey: string;
  model: string;
  systemInstruction: string;
  contents: GeminiContent[];
  responseSchema: object;
}): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini API error: ${res.status} ${body.slice(0, 300)}`);
  }

  const json = await res.json();
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content.");
  return text;
}
