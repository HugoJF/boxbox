import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { boxes } from "@/lib/db/schema"
import { desc } from "drizzle-orm"

export async function GET() {
  try {
    const allBoxes = await db.select().from(boxes).orderBy(desc(boxes.createdAt))
    return NextResponse.json(allBoxes)
  } catch (error) {
    console.error("[v0] Error fetching boxes:", error)
    return NextResponse.json({ error: "Failed to fetch boxes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, color } = body

    const newBox = await db
      .insert(boxes)
      .values({
        id: crypto.randomUUID(),
        name,
        description: description || "",
        color: color || "bg-blue-500",
        itemCount: 0,
      })
      .returning()

    return NextResponse.json(newBox[0])
  } catch (error) {
    console.error("[v0] Error creating box:", error)
    return NextResponse.json({ error: "Failed to create box" }, { status: 500 })
  }
}
