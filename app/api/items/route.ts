import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { boxes, items } from "@/lib/db/schema"
import { and, desc, eq, like, lt, or, sql } from "drizzle-orm"

import { authenticateRequest } from "@/lib/auth/server"

const ITEM_PLACEHOLDER_IMAGE = "/item-placeholder.svg"

export async function GET(request: Request) {
  const authResult = await authenticateRequest(request)
  if ("response" in authResult) {
    return authResult.response
  }

  try {
    const { searchParams } = new URL(request.url)
    const boxId = searchParams.get("boxId")
    const search = searchParams.get("search")
    const limitParam = searchParams.get("limit")
    const cursorParam = searchParams.get("cursor")

    const conditions = []

    if (boxId) {
      conditions.push(eq(items.boxId, boxId))
    }

    if (search && search.trim().length > 0) {
      const pattern = `%${search.trim()}%`
      conditions.push(or(like(items.name, pattern), like(items.description, pattern)))
    }

    if (cursorParam) {
      const [createdAtCursor, idCursor] = cursorParam.split("__")
      if (!createdAtCursor || !idCursor) {
        return NextResponse.json({ error: "Invalid cursor" }, { status: 400 })
      }
      conditions.push(
        or(
          lt(items.createdAt, createdAtCursor),
          and(eq(items.createdAt, createdAtCursor), lt(items.id, idCursor)),
        ),
      )
    }

    let itemQuery = db.select().from(items)

    if (conditions.length === 1) {
      itemQuery = itemQuery.where(conditions[0]!)
    } else if (conditions.length > 1) {
      itemQuery = itemQuery.where(and(...conditions))
    }

    const isPaginatedRequest = Boolean(limitParam || cursorParam)
    const limit = isPaginatedRequest
      ? (() => {
          const parsed = Number.parseInt(limitParam ?? "", 10)
          const fallback = 20
          const candidate = Number.isNaN(parsed) ? fallback : parsed
          return Math.min(Math.max(candidate, 1), 50)
        })()
      : undefined

    if (limit) {
      itemQuery = itemQuery.orderBy(desc(items.createdAt), desc(items.id)).limit(limit + 1)
    } else {
      itemQuery = itemQuery.orderBy(desc(items.createdAt))
    }

    const rows = await itemQuery

    if (!limit) {
      return NextResponse.json(rows)
    }

    let nextCursor: string | null = null
    let itemsForResponse = rows
    if (rows.length > limit) {
      const nextItem = rows[limit]
      itemsForResponse = rows.slice(0, limit)
      nextCursor = `${nextItem.createdAt}__${nextItem.id}`
    }

    return NextResponse.json({
      items: itemsForResponse,
      nextCursor,
    })
  } catch (error) {
    console.error("Error fetching items:", error)
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authResult = await authenticateRequest(request)
  if ("response" in authResult) {
    return authResult.response
  }

  try {
    const body = await request.json()
    const { boxId, name, description, quantity, image } = body

    const imageValue = typeof image === "string" && image.trim().length > 0 ? image : ITEM_PLACEHOLDER_IMAGE

    const newItem = await db
      .insert(items)
      .values({
        id: crypto.randomUUID(),
        boxId,
        name,
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
    console.error("Error creating item:", error)
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 })
  }
}
