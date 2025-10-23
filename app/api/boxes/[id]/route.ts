import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { boxes, items } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const box = await db.select().from(boxes).where(eq(boxes.id, id)).limit(1)

    if (!box.length) {
      return NextResponse.json({ error: "Box not found" }, { status: 404 })
    }

    const boxItems = await db
      .select()
      .from(items)
      .where(eq(items.boxId, id))
      .orderBy(desc(items.createdAt))

    return NextResponse.json({ ...box[0], items: boxItems })
  } catch (error) {
    console.error("Error fetching box:", error)
    return NextResponse.json({ error: "Failed to fetch box" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, description, color } = body

    const updatedBox = await db.update(boxes).set({ name, description, color }).where(eq(boxes.id, id)).returning()

    if (!updatedBox.length) {
      return NextResponse.json({ error: "Box not found" }, { status: 404 })
    }

    return NextResponse.json(updatedBox[0])
  } catch (error) {
    console.error("Error updating box:", error)
    return NextResponse.json({ error: "Failed to update box" }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    await db.delete(boxes).where(eq(boxes.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting box:", error)
    return NextResponse.json({ error: "Failed to delete box" }, { status: 500 })
  }
}
