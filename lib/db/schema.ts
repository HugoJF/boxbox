import { sql } from "drizzle-orm"
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core"

import { accounts, sessions, users, verifications } from "./better-auth-schema"

export const boxes = sqliteTable("boxes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  color: text("color").notNull().default("bg-blue-500"),
  itemCount: integer("item_count").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const items = sqliteTable("items", {
  id: text("id").primaryKey(),
  boxId: text("box_id")
    .notNull()
    .references(() => boxes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  quantity: integer("quantity").notNull().default(1),
  image: text("image").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
})

export type Box = typeof boxes.$inferSelect
export type NewBox = typeof boxes.$inferInsert
export type Item = typeof items.$inferSelect
export type NewItem = typeof items.$inferInsert

export { accounts, sessions, users, verifications }
