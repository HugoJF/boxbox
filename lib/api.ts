import { queryOptions } from "@tanstack/react-query"

import type { Box, Item } from "@/lib/db/schema"

const fetchJson = async <T>(path: string, init?: RequestInit) => {
  const response = await fetch(path, init)
  if (!response.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} failed with status ${response.status}`)
  }
  return (await response.json()) as T
}

const withSearch = (base: string, search: string) => {
  const params = new URLSearchParams()
  if (search.trim().length > 0) {
    params.set("search", search.trim())
  }
  const query = params.toString()
  return query ? `${base}?${query}` : base
}

export const boxesQueryOptions = queryOptions({
  queryKey: ["boxes"],
  queryFn: () => fetchJson<Box[]>("/api/boxes", { cache: "no-store" }),
})

export const boxesSearchQueryOptions = (search: string) =>
  queryOptions({
    queryKey: ["boxes", "search", search],
    enabled: search.trim().length > 0,
    queryFn: () => fetchJson<Box[]>(withSearch("/api/boxes", search), { cache: "no-store" }),
  })

export const itemsQueryOptions = queryOptions({
  queryKey: ["items"],
  queryFn: () => fetchJson<Item[]>("/api/items", { cache: "no-store" }),
})

export const itemsSearchQueryOptions = (search: string) =>
  queryOptions({
    queryKey: ["items", "search", search],
    enabled: search.trim().length > 0,
    queryFn: () => fetchJson<Item[]>(withSearch("/api/items", search), { cache: "no-store" }),
  })

export const boxQueryOptions = (boxId: string) =>
  queryOptions({
    queryKey: ["box", boxId],
    enabled: Boolean(boxId),
    retry: false,
    queryFn: () => fetchJson<Box & { items?: Item[] }>(`/api/boxes/${boxId}`, { cache: "no-store" }),
  })

export const itemQueryOptions = (itemId: string) =>
  queryOptions({
    queryKey: ["item", itemId],
    enabled: Boolean(itemId),
    retry: false,
    queryFn: () => fetchJson<Item>(`/api/items/${itemId}`),
  })
