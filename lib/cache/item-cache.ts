import type {QueryClient} from "@tanstack/react-query"
import type {Box, Item} from "@/lib/db/schema"

type BoxWithItems = Box & {items?: Item[]}

const removeItemById = (items: Item[] | undefined, itemId: string) => {
  if (!Array.isArray(items)) return []
  return items.filter((item) => item.id !== itemId)
}

export const insertOptimisticItem = (queryClient: QueryClient, item: Item, boxId: string) => {
  queryClient.setQueryData<Item[]>(["items"], (prev) =>
    prev ? [item, ...removeItemById(prev, item.id)] : [item],
  )

  queryClient.setQueryData<BoxWithItems | undefined>(["box", boxId], (prev) => {
    if (!prev) return prev

    const items = [item, ...removeItemById(prev.items, item.id)]

    return {
      ...prev,
      itemCount: typeof prev.itemCount === "number" ? prev.itemCount + 1 : prev.itemCount,
      items,
    }
  })

  queryClient.setQueryData<Box[] | undefined>(["boxes"], (prev) => {
    if (!Array.isArray(prev)) return prev

    return prev.map((box) =>
      box.id === boxId && typeof box.itemCount === "number"
        ? {...box, itemCount: box.itemCount + 1}
        : box,
    )
  })
}

export const upsertCachedItem = (queryClient: QueryClient, item: Item, boxId?: string) => {
  queryClient.setQueryData<Item[]>(["items"], (prev) => {
    if (!Array.isArray(prev)) {
      return prev
    }
    const exists = prev.some((existing) => existing.id === item.id)
    return exists
      ? prev.map((existing) => (existing.id === item.id ? item : existing))
      : [item, ...prev]
  })

  if (!boxId) return

  queryClient.setQueryData<BoxWithItems | undefined>(["box", boxId], (prev) => {
    if (!prev) return prev

    const currentItems = Array.isArray(prev.items) ? prev.items : []
    const exists = currentItems.some((existing) => existing.id === item.id)
    const items = exists
      ? currentItems.map((existing) => (existing.id === item.id ? item : existing))
      : [item, ...currentItems]

    return {
      ...prev,
      items,
    }
  })
}
