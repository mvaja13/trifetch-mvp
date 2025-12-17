import type { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { IntakeSummary, SummarizeRequest } from "@/types";

const SYSTEM_PROMPT = `You are a pediatric intake assistant. Input: { raw_text: string, age_months: integer (optional), temp_c: number (optional) }.

Produce ONLY valid JSON (no extra text) with the exact fields below:

{
  "chief_concern": "short phrase (3-6 words)",
  "duration": "short phrase (e.g., '2 days', '3 hours', or 'unknown')",
  "key_symptoms": ["list", "of", "3-6", "short", "phrases"],
  "red_flags": ["list of critical items (empty array if none)"],
  "triage": "emergency|high|moderate|low",
  "follow_up_questions": ["3-6 concise clinician questions (yes/no or short answer)"],
  "possible_causes": ["3 high-level non-diagnostic possibilities"],
  "hpi": "1-2 sentence chart-ready HPI paragraph."
}

Rules:
- Use age_months and temp_c when present in your reasoning.
- red_flags may include items like "respiratory distress", "cyanosis", "seizures", "poor perfusion", "unresponsive", etc.
- Triage rules (apply in this order):
  - If any red_flags → "emergency"
  - If age_months <= 6 and temp_c >= 38.5 → "high"
  - If breathing concerns or poor feeding → "high"
  - Otherwise moderate or low depending on severity
- Keep text concise and clinical.
- Return ONLY JSON. No commentary, no code fences.`;

function validateIntakeSummary(obj: unknown): obj is IntakeSummary {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;

  return (
    typeof o.chief_concern === "string" &&
    typeof o.duration === "string" &&
    Array.isArray(o.key_symptoms) &&
    Array.isArray(o.red_flags) &&
    ["emergency", "high", "moderate", "low"].includes(o.triage as string) &&
    Array.isArray(o.follow_up_questions) &&
    Array.isArray(o.possible_causes) &&
    typeof o.hpi === "string"
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { raw_text, age_months, temp_c } = req.body as SummarizeRequest;

  if (!raw_text || typeof raw_text !== "string") {
    return res.status(400).json({ error: "raw_text is required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const userMessage = JSON.stringify({
    raw_text,
    ...(age_months !== undefined && { age_months }),
    ...(temp_c !== undefined && { temp_c }),
  });

  try {
    const result = await model.generateContent({
      systemInstruction: SYSTEM_PROMPT,
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    });

    const response = result.response;
    const content = response.text();

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Retry with stricter prompt
      const retryResult = await model.generateContent({
        systemInstruction: SYSTEM_PROMPT,
        contents: [
          { role: "user", parts: [{ text: userMessage }] },
          { role: "model", parts: [{ text: content }] },
          {
            role: "user",
            parts: [
              {
                text: "Return only JSON exactly matching the schema. No other text.",
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      });

      const retryContent = retryResult.response.text();

      try {
        parsed = JSON.parse(retryContent);
      } catch {
        return res.status(500).json({
          error: "Failed to parse Gemini response after retry",
          raw: retryContent,
        });
      }
    }

    if (!validateIntakeSummary(parsed)) {
      return res.status(500).json({
        error: "Response does not match expected schema",
        raw: parsed,
      });
    }

    return res.status(200).json(parsed);
  } catch (error) {
    console.error("Gemini API error:", error);
    return res.status(500).json({
      error: "Failed to call Gemini API",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
