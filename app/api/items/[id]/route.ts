import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { items, boxes } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

import { authenticateRequest } from "@/lib/auth/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await authenticateRequest(request)
  if ("response" in authResult) {
    return authResult.response
  }

  try {
    const { id } = await params
    const item = await db.select().from(items).where(eq(items.id, id)).limit(1)

    if (!item.length) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json(item[0])
  } catch (error) {
    console.error("Error fetching item:", error)
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await authenticateRequest(request)
  if ("response" in authResult) {
    return authResult.response
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, quantity, boxId } = body

    // Get current item to check if box is changing
    const currentItem = await db.select().from(items).where(eq(items.id, id)).limit(1)

    if (!currentItem.length) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const oldBoxId = currentItem[0].boxId

    // Update item
    const updatedItem = await db
      .update(items)
      .set({ name, description, quantity, boxId })
      .where(eq(items.id, id))
      .returning()

    // If box changed, update item counts
    if (boxId && boxId !== oldBoxId) {
      // Decrease old box count
      await db
        .update(boxes)
        .set({ itemCount: sql`${boxes.itemCount} - 1` })
        .where(eq(boxes.id, oldBoxId))

      // Increase new box count
      await db
        .update(boxes)
        .set({ itemCount: sql`${boxes.itemCount} + 1` })
        .where(eq(boxes.id, boxId))
    }

    return NextResponse.json(updatedItem[0])
  } catch (error) {
    console.error("Error updating item:", error)
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await authenticateRequest(request)
  if ("response" in authResult) {
    return authResult.response
  }

  try {
    const { id } = await params

    // Get item to find its box
    const item = await db.select().from(items).where(eq(items.id, id)).limit(1)

    if (!item.length) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Delete item
    await db.delete(items).where(eq(items.id, id))

    // Update box item count
    await db
      .update(boxes)
      .set({ itemCount: sql`${boxes.itemCount} - 1` })
      .where(eq(boxes.id, item[0].boxId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting item:", error)
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
  }
}
