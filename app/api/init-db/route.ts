import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    console.log("Initializing database tables...")

    // Create boxes table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS boxes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT NOT NULL DEFAULT '#3b82f6',
        item_count INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      )
    `)

    // Create items table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        box_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        image_url TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (box_id) REFERENCES boxes(id) ON DELETE CASCADE
      )
    `)

    // Create indexes
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_items_box_id ON items(box_id)
    `)

    await db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_boxes_created_at ON boxes(created_at)
    `)

    await db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at)
    `)

    console.log("Database tables initialized successfully")

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
    })
  } catch (error) {
    console.error("Error initializing database:", error)
    return NextResponse.json({ error: "Failed to initialize database", details: String(error) }, { status: 500 })
  }
}
