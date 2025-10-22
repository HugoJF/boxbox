import axios, { type AxiosResponse } from "axios"
import { queryOptions } from "@tanstack/react-query"

import type { Box, Item } from "@/lib/db/schema"

const api = axios.create({
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
  },
})

// Type-safe wrapper that extracts data
const apiGet = <T>(url: string, config?: Parameters<typeof api.get>[1]) =>
  api.get<T>(url, config).then((res: AxiosResponse<T>) => res.data)

const apiPost = <T>(url: string, data?: any, config?: Parameters<typeof api.post>[2]) =>
  api.post<T>(url, data, config).then((res: AxiosResponse<T>) => res.data)

const apiPatch = <T>(url: string, data?: any, config?: Parameters<typeof api.patch>[2]) =>
  api.patch<T>(url, data, config).then((res: AxiosResponse<T>) => res.data)

const apiDelete = (url: string, config?: Parameters<typeof api.delete>[1]) =>
  api.delete(url, config).then(() => undefined)



export const boxesQueryOptions = queryOptions({
  queryKey: ["boxes"],
  queryFn: () => apiGet<Box[]>("/api/boxes"),
})

export const boxesSearchQueryOptions = (search: string) =>
  queryOptions({
    queryKey: ["boxes", "search", search],
    enabled: search.trim().length > 0,
    queryFn: () => apiGet<Box[]>("/api/boxes", { params: { search: search.trim() || undefined } }),
  })

export const itemsQueryOptions = queryOptions({
  queryKey: ["items"],
  queryFn: () => apiGet<Item[]>("/api/items"),
})

export const itemsSearchQueryOptions = (search: string) =>
  queryOptions({
    queryKey: ["items", "search", search],
    enabled: search.trim().length > 0,
    queryFn: () => apiGet<Item[]>("/api/items", { params: { search: search.trim() || undefined } }),
  })

export const boxQueryOptions = (boxId: string) =>
  queryOptions({
    queryKey: ["box", boxId],
    enabled: Boolean(boxId),
    retry: false,
    queryFn: () => apiGet<Box & { items?: Item[] }>(`/api/boxes/${boxId}`),
  })

export const itemQueryOptions = (itemId: string) =>
  queryOptions({
    queryKey: ["item", itemId],
    enabled: Boolean(itemId),
    retry: false,
    queryFn: () => apiGet<Item>(`/api/items/${itemId}`),
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
  apiPost<Box>("/api/boxes", payload)

export const updateBox = (boxId: string, payload: UpdateBoxPayload) =>
  apiPatch<Box>(`/api/boxes/${boxId}`, payload)

export const deleteBox = async (boxId: string) => {
  await apiDelete(`/api/boxes/${boxId}`)
}

export interface AnalyzeItemResponse {
  name?: string
  category?: string
  description?: string
  quantity?: number
}

export type AnalyzeItemProfile = "fast" | "balanced" | "high"

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

export const analyzeItem = (image: string, profile: AnalyzeItemProfile = "balanced") =>
  apiPost<AnalyzeItemResponse>("/api/analyze-item", { image, profile })

export const createItem = (payload: CreateItemPayload) =>
  apiPost<Item>("/api/items", payload)

export const updateItem = (itemId: string, payload: UpdateItemPayload) =>
  apiPatch<Item>(`/api/items/${itemId}`, payload)

export const deleteItem = async (itemId: string) => {
  await apiDelete(`/api/items/${itemId}`)
}
