import { generateContent as generateGemini, type GeminiContent } from "@/lib/gemini";
import type { AppSettings } from "@/lib/types";

// Unified LLM client: routes to Gemini (default) or any OpenAI-compatible
// endpoint (OpenAI, Ollama, LM Studio, vLLM, ...) based on app_settings.
// Both backends produce the same structured JSON, so advisor logic stays
// provider-agnostic.

export type ChatMessage = { role: "user" | "model"; text: string };

export async function generateStructuredJson({
  settings,
  systemInstruction,
  messages,
  image,
  schema,
}: {
  settings: AppSettings;
  systemInstruction: string;
  messages: ChatMessage[];
  image?: { mimeType: string; base64: string };
  schema: object;
}): Promise<string> {
  const apiKey = settings.gemini_api_key;
  if (!apiKey) throw new Error("Missing AI API key");

  if (settings.ai_provider === "openai") {
    return generateOpenAiCompatible({
      apiKey,
      baseUrl: settings.ai_base_url,
      model: settings.gemini_model,
      systemInstruction,
      messages,
      image,
    });
  }
  return generateGemini({
    apiKey,
    model: settings.gemini_model,
    systemInstruction,
    contents: toGeminiContents(messages, image),
    responseSchema: schema,
  });
}

function toGeminiContents(messages: ChatMessage[], image?: { mimeType: string; base64: string }): GeminiContent[] {
  const contents: GeminiContent[] = [
    { role: "user", parts: [{ text: messages[0]?.text ?? "" }] },
    { role: "model", parts: [{ text: JSON.stringify({ type: "answer", answer_text: "Siap, ada yang bisa dibantu?" }) }] },
    ...messages.slice(1).map((m) => ({ role: m.role, parts: [{ text: m.text }] }) satisfies GeminiContent),
  ];
  if (image) {
    const last = contents[contents.length - 1];
    last.parts.push({ inline_data: { mime_type: image.mimeType, data: image.base64 } });
  }
  return contents;
}

async function generateOpenAiCompatible({
  apiKey,
  baseUrl,
  model,
  systemInstruction,
  messages,
  image,
}: {
  apiKey: string;
  baseUrl: string | null;
  model: string;
  systemInstruction: string;
  messages: ChatMessage[];
  image?: { mimeType: string; base64: string };
}): Promise<string> {
  // baseUrl should be base path (e.g., https://api.openai.com/v1 or https://api.vikey.ai/v1),
  // NOT including /chat/completions. If it has /chat/completions already, strip it.
  let base = baseUrl ?? "https://api.openai.com/v1";
  base = base.replace(/\/$/, "").replace(/\/chat\/completions\s*$/, "");
  const endpoint = `${base}/chat/completions`;

  const llmMessages: Array<{ role: string; content: unknown }> = [
    { role: "system", content: systemInstruction },
    ...messages.map((m) => ({ role: m.role, content: m.text })),
  ];
  if (image) {
    const last = llmMessages[llmMessages.length - 1];
    const lastContent = typeof last.content === "string" ? last.content : JSON.stringify(last.content);
    last.content = [
      { type: "text", text: lastContent },
      { type: "image_url", image_url: { url: `data:${image.mimeType};base64,${image.base64}` } },
    ];
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: llmMessages,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI API error: ${res.status} ${body.slice(0, 300)}`);
  }
  const json = await res.json();
  const text: string | undefined = json?.choices?.[0]?.message?.content;
  if (!text) throw new Error("AI returned no content.");
  return text;
}
