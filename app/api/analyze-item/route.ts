import { generateObject } from "ai"
import { openrouter } from "@openrouter/ai-sdk-provider"
import { z } from "zod"

const itemSchema = z.object({
  name: z.string().describe("The name or title of the item"),
  category: z.string().describe("The category (e.g., Electronics, Food, Clothing, Tools, etc.)"),
  description: z.string().describe("A brief description of the item and its condition"),
  quantity: z.number().positive().describe("Estimated quantity visible in the image"),
})

export async function POST(req: Request) {
  try {
    const { image } = await req.json()

    const { object } = await generateObject({
      model: openrouter("openai/gpt-4o"),
      schema: itemSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image and extract inventory information. Identify the item, categorize it, provide a brief description, and estimate the quantity visible.",
            },
            {
              type: "image",
              image,
            },
          ],
        },
      ],
    })

    return Response.json(object)
  } catch (error) {
    console.error("[v0] Error analyzing item:", error)
    return Response.json({ error: "Failed to analyze item" }, { status: 500 })
  }
}
