import axios from "axios"
import { queryOptions } from "@tanstack/react-query"

import type { Box, Item } from "@/lib/db/schema"

const api = axios.create({
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.response.use((response) => response.data)



export const boxesQueryOptions = queryOptions({
  queryKey: ["boxes"],
  queryFn: () => api.get<Box[]>("/api/boxes"),
})

export const boxesSearchQueryOptions = (search: string) =>
  queryOptions({
    queryKey: ["boxes", "search", search],
    enabled: search.trim().length > 0,
    queryFn: () => api.get<Box[]>("/api/boxes", { params: { search: search.trim() || undefined } }),
  })

export const itemsQueryOptions = queryOptions({
  queryKey: ["items"],
  queryFn: () => api.get<Item[]>("/api/items"),
})

export const itemsSearchQueryOptions = (search: string) =>
  queryOptions({
    queryKey: ["items", "search", search],
    enabled: search.trim().length > 0,
    queryFn: () => api.get<Item[]>("/api/items", { params: { search: search.trim() || undefined } }),
  })

export const boxQueryOptions = (boxId: string) =>
  queryOptions({
    queryKey: ["box", boxId],
    enabled: Boolean(boxId),
    retry: false,
    queryFn: () => api.get<Box & { items?: Item[] }>(`/api/boxes/${boxId}`),
  })

export const itemQueryOptions = (itemId: string) =>
  queryOptions({
    queryKey: ["item", itemId],
    enabled: Boolean(itemId),
    retry: false,
    queryFn: () => api.get<Item>(`/api/items/${itemId}`),
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
  api.post<Box>("/api/boxes", payload)

export const updateBox = (boxId: string, payload: UpdateBoxPayload) =>
  api.patch<Box>(`/api/boxes/${boxId}`, payload)

export const deleteBox = async (boxId: string) => {
  await api.delete(`/api/boxes/${boxId}`)
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
  api.post<AnalyzeItemResponse>("/api/analyze-item", { image })

export const createItem = (payload: CreateItemPayload) =>
  api.post<Item>("/api/items", payload)

export const updateItem = (itemId: string, payload: UpdateItemPayload) =>
  api.patch<Item>(`/api/items/${itemId}`, payload)

export const deleteItem = async (itemId: string) => {
  await api.delete(`/api/items/${itemId}`)
}