import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { items, boxes } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { boxId, name, category, description, quantity, image } = body

    const newItem = await db
      .insert(items)
      .values({
        id: crypto.randomUUID(),
        boxId,
        name,
        category: category || "Uncategorized",
        description: description || "",
        quantity: quantity || 1,
        image,
      })
      .returning()

    // Update box item count
    await db
      .update(boxes)
      .set({ itemCount: sql`${boxes.itemCount} + 1` })
      .where(eq(boxes.id, boxId))

    return NextResponse.json(newItem[0])
  } catch (error) {
    console.error("[v0] Error creating item:", error)
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 })
  }
}
