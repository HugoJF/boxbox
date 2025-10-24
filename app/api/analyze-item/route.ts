import { generateObject, generateText } from "ai"
import { openrouter } from "@openrouter/ai-sdk-provider"
import { z } from "zod"

import { authenticateRequest } from "@/lib/auth/server"

const itemSchema = z.object({
  name: z.string().describe("The name or title of the item"),
  description: z.string().describe("A brief description of the item and its condition"),
  quantity: z.number().positive().describe("Estimated quantity visible in the image"),
})

type AnalyzeItemProfile = "fast" | "balanced" | "high"

const PROFILE_MODEL_MAP: Record<AnalyzeItemProfile, string> = {
  fast: "google/gemini-2.5-flash-lite",
  balanced: "openai/chatgpt-4o-latest",
  high: "x-ai/grok-4-fast",
}

const JSON_SCHEMA_UNSUPPORTED_MODELS = new Set<string>(["openai/chatgpt-4o-latest"])
const SCHEMA_PROMPT = `Respond with JSON using this exact shape:
{
  "name": string,
  "description": string,
  "quantity": number
}
`

const JSON_BLOCK_REGEX = /```(?:json)?\s*([\s\S]*?)```/i

const isAnalyzeProfile = (profile: unknown): profile is AnalyzeItemProfile =>
  profile === "fast" || profile === "balanced" || profile === "high"

export async function POST(req: Request) {
  const authResult = await authenticateRequest(req)
  if ("response" in authResult) {
    return authResult.response
  }

  try {
    const { image, profile } = await req.json()

    if (!image) {
      return Response.json({ error: "Image is required" }, { status: 400 })
    }

    const selectedProfile: AnalyzeItemProfile = isAnalyzeProfile(profile) ? profile : "balanced"
    const model = PROFILE_MODEL_MAP[selectedProfile] ?? PROFILE_MODEL_MAP.balanced

    const basePrompt = {
      role: "user" as const,
      content: [
        {
          type: "text" as const,
          text: `Analyze this image and extract inventory information. Identify the item, provide a brief description, and estimate the quantity visible. Use the "${selectedProfile}" profile guidelines: ${
            selectedProfile === "fast"
              ? "prioritize speed over completeness, returning concise but usable fields."
              : selectedProfile === "high"
                ? "prioritize accuracy and detail, even if it takes more reasoning."
                : "balance speed and completeness for a reliable summary."
          } Return valid JSON only.`,
        },
        {
          type: "image" as const,
          image,
        },
      ],
    }

    if (!JSON_SCHEMA_UNSUPPORTED_MODELS.has(model)) {
      const { object } = await generateObject({
        model: openrouter(model),
        schema: itemSchema,
        messages: [basePrompt],
      })

      return Response.json({ ...object, profile: selectedProfile })
    }

    const { text } = await generateText({
      model: openrouter(model),
      messages: [
        basePrompt,
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${SCHEMA_PROMPT}Do not include any additional commentary.`,
            },
          ],
        },
      ],
    })

    let parsed: unknown
    try {
      let jsonPayload = text.trim()
      const codeBlockMatch = text.match(JSON_BLOCK_REGEX)
      if (codeBlockMatch?.[1]) {
        jsonPayload = codeBlockMatch[1].trim()
      }
      parsed = JSON.parse(jsonPayload)
    } catch (parseError) {
      console.error("Failed to parse analysis response:", parseError, text)
      return Response.json({ error: "AI response was not valid JSON", raw: text }, { status: 502 })
    }

    const validation = itemSchema.safeParse(parsed)

    if (!validation.success) {
      console.error("Analysis response failed schema validation:", validation.error)
      return Response.json({ error: "AI response failed validation" }, { status: 502 })
    }

    return Response.json({ ...validation.data, profile: selectedProfile })
  } catch (error) {
    console.error("Error analyzing item:", error)
    return Response.json({ error: "Failed to analyze item" }, { status: 500 })
  }
}
