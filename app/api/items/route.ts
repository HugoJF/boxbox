import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { boxes, items } from "@/lib/db/schema"
import { and, desc, eq, like, or, sql } from "drizzle-orm"

const ITEM_PLACEHOLDER_IMAGE = "/item-placeholder.svg"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const boxId = searchParams.get("boxId")
    const search = searchParams.get("search")

    const conditions = []

    if (boxId) {
      conditions.push(eq(items.boxId, boxId))
    }

    if (search && search.trim().length > 0) {
      const pattern = `%${search.trim()}%`
      conditions.push(
        or(like(items.name, pattern), like(items.category, pattern), like(items.description, pattern)),
      )
    }

    let itemQuery = db.select().from(items)

    if (conditions.length === 1) {
      itemQuery = itemQuery.where(conditions[0]!)
    } else if (conditions.length > 1) {
      itemQuery = itemQuery.where(and(...conditions))
    }

    const results = await itemQuery.orderBy(desc(items.createdAt))
    return NextResponse.json(results)
  } catch (error) {
    console.error("[v0] Error fetching items:", error)
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { boxId, name, category, description, quantity, image } = body

    const imageValue = typeof image === "string" && image.trim().length > 0 ? image : ITEM_PLACEHOLDER_IMAGE

    const newItem = await db
      .insert(items)
      .values({
        id: crypto.randomUUID(),
        boxId,
        name,
        category: category || "Uncategorized",
        description: description || "",
        quantity: quantity || 1,
        image: imageValue,
      })
      .returning()

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
