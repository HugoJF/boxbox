"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Save, Trash2, RefreshCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  boxesQueryOptions,
  deleteItem as deleteItemApi,
  itemQueryOptions,
  updateItem as updateItemApi,
  analyzeItem,
  type AnalyzeItemProfile,
  type AnalyzeItemResponse,
} from "@/lib/api"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"

const ITEM_PLACEHOLDER_IMAGE = "/item-placeholder.svg"

export default function EditItemPage() {
  const params = useParams()
  const router = useRouter()
  const itemId = params.id as string

  const queryClient = useQueryClient()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [selectedBoxId, setSelectedBoxId] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [imageErrored, setImageErrored] = useState(false)
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(false)

  const itemQuery = itemQueryOptions(itemId)
  const {
    data: item,
    isPending: itemPending,
    isError: itemError,
    error: itemErrorObj,
  } = useQuery(itemQuery)

  const {
    data: boxes = [],
    isPending: boxesPending,
    isError: boxesError,
    error: boxesErrorObj,
  } = useQuery(boxesQueryOptions)

  const SUGGESTION_PROFILES: AnalyzeItemProfile[] = ["fast", "balanced", "high"]
  const imageForAnalysis = item?.image?.trim() ? item.image : null
  const suggestionsActive = suggestionsEnabled && Boolean(imageForAnalysis)

  const fastSuggestionQuery = useQuery<AnalyzeItemResponse>({
    queryKey: ["item-suggestion", itemId, "fast", imageForAnalysis],
    queryFn: () => analyzeItem(imageForAnalysis!, "fast"),
    enabled: suggestionsActive,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const balancedSuggestionQuery = useQuery<AnalyzeItemResponse>({
    queryKey: ["item-suggestion", itemId, "balanced", imageForAnalysis],
    queryFn: () => analyzeItem(imageForAnalysis!, "balanced"),
    enabled: suggestionsActive,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const highSuggestionQuery = useQuery<AnalyzeItemResponse>({
    queryKey: ["item-suggestion", itemId, "high", imageForAnalysis],
    queryFn: () => analyzeItem(imageForAnalysis!, "high"),
    enabled: suggestionsActive,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const suggestionQueries: Record<AnalyzeItemProfile, UseQueryResult<AnalyzeItemResponse, unknown>> = {
    fast: fastSuggestionQuery,
    balanced: balancedSuggestionQuery,
    high: highSuggestionQuery,
  }

  const isAnySuggestionFetching =
    fastSuggestionQuery.isFetching || balancedSuggestionQuery.isFetching || highSuggestionQuery.isFetching

  useEffect(() => {
    if (item) {
      setName(item.name)
      setDescription(item.description)
      setQuantity(item.quantity)
      setSelectedBoxId(item.boxId)
      setImageErrored(false)
    }
  }, [item])

  useEffect(() => {
    if (itemError) {
      if ((itemErrorObj as Error)?.message.includes("404") || (itemErrorObj as Error)?.message === "ITEM_NOT_FOUND") {
        router.push("/")
      } else {
        toast.error("Failed to load item")
      }
    }
  }, [itemError, itemErrorObj, router])

  useEffect(() => {
    if (boxesError) {
      console.error("[v0] Error fetching boxes:", boxesErrorObj)
      toast.error("Failed to load boxes")
    }
  }, [boxesError, boxesErrorObj])

  const updateItemMutation = useMutation({
    mutationFn: () =>
      updateItemApi(itemId, {
        name,
        description,
        quantity,
        boxId: selectedBoxId,
      }),
    onSuccess: async (updatedItem) => {
      toast.success("Item updated successfully")

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["item", itemId], exact: false }),
        queryClient.invalidateQueries({ queryKey: ["box", item?.boxId ?? updatedItem.boxId], exact: false }),
        queryClient.invalidateQueries({ queryKey: ["box", updatedItem.boxId], exact: false }),
        queryClient.invalidateQueries({ queryKey: ["items"], exact: false }),
        queryClient.invalidateQueries({ queryKey: ["boxes"], exact: false }),
      ])

      router.push(`/box/${updatedItem.boxId}`)
    },
    onError: (error) => {
      console.error("[v0] Error updating item:", error)
      toast.error("Failed to update item")
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: () => deleteItemApi(itemId),
    onSuccess: async () => {
      toast.success("Item deleted successfully")
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["boxes"], exact: false }),
        queryClient.invalidateQueries({ queryKey: ["items"], exact: false }),
        queryClient.invalidateQueries({ queryKey: ["box", item?.boxId ?? selectedBoxId], exact: false }),
      ])

      router.push(`/box/${item?.boxId ?? selectedBoxId}`)
    },
    onError: (error) => {
      console.error("[v0] Error deleting item:", error)
      toast.error("Failed to delete item")
    },
  })

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Item name is required")
      return
    }
    updateItemMutation.mutate()
  }

  const handleDelete = () => {
    deleteItemMutation.mutate()
  }

  const formatProfileLabel = (profile: AnalyzeItemProfile) => profile.charAt(0).toUpperCase() + profile.slice(1)

  const handleEnableSuggestions = () => {
    if (!imageForAnalysis) {
      toast.error("No image available for AI suggestions.")
      return
    }
    setSuggestionsEnabled(true)
  }

  const handleRefreshSuggestions = async () => {
    if (!imageForAnalysis) {
      toast.error("No image available for AI suggestions.")
      return
    }

    try {
      await Promise.all(
        SUGGESTION_PROFILES.map(async (profile) => {
          const query = suggestionQueries[profile]
          if (query) {
            await query.refetch({ throwOnError: false })
          }
        }),
      )
      toast.success("Suggestions refreshed")
    } catch (err) {
      console.error("[v0] Error refreshing suggestions:", err)
      toast.error("Failed to refresh suggestions")
    }
  }

  const applySuggestion = (suggestion: AnalyzeItemResponse, profile: AnalyzeItemProfile) => {
    if (suggestion.name) {
      setName(suggestion.name)
    }
    if (typeof suggestion.quantity === "number" && Number.isFinite(suggestion.quantity) && suggestion.quantity > 0) {
      setQuantity(Math.max(1, Math.round(suggestion.quantity)))
    }
    if (typeof suggestion.description === "string") {
      setDescription(suggestion.description)
    }
    toast.success(`${formatProfileLabel(profile)} suggestion applied`)
    handleSave();
  }

  if (itemPending || !item) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading item…</div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" onClick={() => router.push(`/box/${item.boxId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Edit Item</h1>
          </div>
          <Button size="icon" variant="ghost" onClick={() => setShowDeleteDialog(true)} disabled={deleteItemMutation.isPending}>
            <Trash2 className="h-5 w-5 text-destructive" />
          </Button>
        </div>
      </header>

      <main className="mx-auto container px-4 py-6 max-w-2xl">
        <div className="mb-6">
          <div className="relative h-48 w-full overflow-hidden rounded-lg bg-muted">
            <img
              src={
                imageErrored || !item.image || item.image.trim().length === 0 ? ITEM_PLACEHOLDER_IMAGE : item.image
              }
              alt={item.name}
              className="h-full w-full object-cover"
              onError={() => setImageErrored(true)}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter item name"
              className="h-12 text-base"
              disabled={updateItemMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              className="min-h-24 text-base resize-none"
              disabled={updateItemMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
              className="h-12 text-base"
              disabled={updateItemMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="box">Box</Label>
            <Select value={selectedBoxId} onValueChange={setSelectedBoxId} disabled={boxesPending || boxesError}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Select a box" />
              </SelectTrigger>
              <SelectContent>
                {boxes.map((box) => (
                  <SelectItem key={box.id} value={box.id}>
                    {box.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">AI Suggestions</h2>
                <p className="text-xs text-muted-foreground">
                  Compare alternative model passes and apply the values you prefer.
                </p>
              </div>
              {suggestionsEnabled ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleRefreshSuggestions}
                  disabled={isAnySuggestionFetching}
                >
                  {isAnySuggestionFetching ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <>
                      <RefreshCcw className="h-4 w-4" />
                      Refresh
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnableSuggestions}
                  disabled={!imageForAnalysis}
                >
                  Load suggestions
                </Button>
              )}
            </div>

            {suggestionsEnabled ? (
              imageForAnalysis ? (
                <div className="grid gap-3">
                  {SUGGESTION_PROFILES.map((profile) => {
                    const query = suggestionQueries[profile]
                    const isLoading = query.status === "pending"
                    const isError = query.status === "error"
                    const isSuccess = query.status === "success"
                    const isFetching = query.isFetching && query.status !== "pending"
                    const data = query.data
                    const errorMessage =
                      query.error instanceof Error ? query.error.message : isError ? "Suggestion failed." : null

                    return (
                      <div key={profile} className="rounded-md border border-border bg-muted/30 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{formatProfileLabel(profile)} profile</p>
                            <p className="text-xs text-muted-foreground">
                              {profile === "fast"
                                ? "Quick pass focused on speed."
                                : profile === "high"
                                  ? "Detailed reasoning for higher accuracy."
                                  : "Balanced trade-off between speed and detail."}
                            </p>
                          </div>
                          {(isLoading || isFetching) && <Spinner className="h-4 w-4" />}
                        </div>

                        <div className="mt-3 space-y-1 text-sm">
                          {isSuccess && data ? (
                            <>
                              <p className="font-medium">{data.name ?? "Unknown"}</p>
                              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                Qty: {data.quantity ?? 1}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {(data.description && data.description.trim().length > 0
                                  ? data.description.trim()
                                  : "No description provided.") || "No description provided."}
                              </p>
                            </>
                          ) : isError ? (
                            <p className="text-sm text-destructive">{errorMessage ?? "Suggestion failed."}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground">Generating suggestion…</p>
                          )}
                        </div>

                        <div className="mt-3 flex justify-end gap-2">
                          {isError && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => query.refetch()}
                              disabled={query.isFetching}
                            >
                              Retry
                            </Button>
                          )}
                          {data && (
                            <Button
                              size="sm"
                              onClick={() => applySuggestion(data, profile)}
                              disabled={query.isFetching || updateItemMutation.isPending}
                            >
                              Apply suggestion
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Item image required to generate suggestions.</p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                Load AI suggestions to compare results from fast, balanced, and high profiles.
              </p>
            )}
          </div>

          <Button
            size="lg"
            onClick={handleSave}
            disabled={updateItemMutation.isPending || boxesPending}
            className="w-full gap-2"
          >
            <Save className="h-5 w-5" />
            {updateItemMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </main>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{item.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteItemMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              disabled={deleteItemMutation.isPending}
            >
              {deleteItemMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
