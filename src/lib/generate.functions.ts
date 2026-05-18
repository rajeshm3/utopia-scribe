import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SYSTEM_PROMPT = `You are a content operator for Utopia Studio, an AI-native venture studio based in Doha. Your voice is declarative, specific, and confident. No hedging. No filler. You publish opinions not summaries.

Given a meeting transcript, produce exactly three outputs in JSON format:

linkedin_post: A LinkedIn post for Utopia Studio. Max 150 words. Specific insight from the meeting, not a summary. Ends with one sharp line.

followup_email: A personalised follow-up email to the key attendee. Subject line included. Max 100 words. References something specific they said.

press_angle: One sentence. Specific enough for a journalist to write a story from. Not a summary of the meeting.

Return only valid JSON with these three keys. No other text.`;

export const generateContent = createServerFn({ method: "POST" })
  .inputValidator(z.object({ transcript: z.string().min(1).max(100000) }))
  .handler(async ({ data }) => {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY is not configured");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514"
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: data.transcript }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Anthropic API error (${res.status}): ${text.slice(0, 500)}`);
    }

    const payload = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = payload.content?.find((c) => c.type === "text")?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Model did not return JSON");

    const parsed = JSON.parse(match[0]) as {
      linkedin_post?: string;
      followup_email?: string;
      press_angle?: string;
    };

    return {
      linkedin_post: parsed.linkedin_post ?? "",
      followup_email: parsed.followup_email ?? "",
      press_angle: parsed.press_angle ?? "",
    };
  });