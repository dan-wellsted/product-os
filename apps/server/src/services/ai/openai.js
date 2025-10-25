import OpenAI from "openai";
export const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
const apiKey = process.env.OPENAI_API_KEY;
const timeout = Number(process.env.OPENAI_TIMEOUT_MS || 30000);
export const openai = new OpenAI({ apiKey, timeout });

export async function chatJSON({ system, user }) {
  const resp = await openai.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.2,
  });
  const raw = resp.choices?.[0]?.message?.content || "{}";
  return JSON.parse(raw);
}
