import { queryOptions } from "@tanstack/react-query"

import type { Box, Item } from "@/lib/db/schema"

const JSON_HEADERS = { "Content-Type": "application/json" } as const

const fetchOk = async (path: string, init?: RequestInit) => {
  const response = await fetch(path, init)
  if (!response.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} failed with status ${response.status}`)
  }
  return response
}

const fetchJson = async <T>(path: string, init?: RequestInit) => {
  const response = await fetchOk(path, init)
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

const fetchVoid = async (path: string, init?: RequestInit) => {
  await fetchOk(path, init)
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

export interface CreateBoxPayload {
  name: string
  description: string
  color: string
}

export interface UpdateBoxPayload {
  name: string
  description: string
  color: string
}

export const createBox = (payload: CreateBoxPayload) =>
  fetchJson<Box>("/api/boxes", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  })

export const updateBox = (boxId: string, payload: UpdateBoxPayload) =>
  fetchJson<Box>(`/api/boxes/${boxId}`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  })

export const deleteBox = async (boxId: string) => {
  await fetchVoid(`/api/boxes/${boxId}`, { method: "DELETE" })
}

export interface AnalyzeItemResponse {
  name?: string
  category?: string
  description?: string
  quantity?: number
}

export interface CreateItemPayload {
  boxId: string
  name: string
  category: string
  description: string
  quantity: number
  image: string
}

export interface UpdateItemPayload {
  name: string
  category: string
  description: string
  quantity: number
  boxId: string
}

export const analyzeItem = (image: string) =>
  fetchJson<AnalyzeItemResponse>("/api/analyze-item", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ image }),
  })

export const createItem = (payload: CreateItemPayload) =>
  fetchJson<Item>("/api/items", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  })

export const updateItem = (itemId: string, payload: UpdateItemPayload) =>
  fetchJson<Item>(`/api/items/${itemId}`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  })

export const deleteItem = async (itemId: string) => {
  await fetchVoid(`/api/items/${itemId}`, { method: "DELETE" })
}
