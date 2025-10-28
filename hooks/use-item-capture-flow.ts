"use client"

import {useCallback, useState} from "react"
import {useMutation, useQueryClient} from "@tanstack/react-query"
import {useRouter} from "next/navigation"
import {toast} from "sonner"
import {
  analyzeItem,
  boxQueryOptions,
  boxesQueryOptions,
  createItem,
  itemsQueryOptions,
  updateItem,
} from "@/lib/api"
import type {UpdateItemPayload} from "@/lib/api"
import {
  ANALYZING_ITEM_PLACEHOLDER_DESCRIPTION,
  ANALYZING_ITEM_PLACEHOLDER_NAME,
} from "@/lib/constants"
import type {Item} from "@/lib/db/schema"
import {insertOptimisticItem, upsertCachedItem} from "@/lib/cache/item-cache"

interface UseItemCaptureFlowOptions {
  boxId?: string
  onCapture: (imageData: string) => void
  onCancel: () => void
}

type UpdateItemVariables = {itemId: string; payload: UpdateItemPayload}

export function useItemCaptureFlow({boxId, onCapture, onCancel}: UseItemCaptureFlowOptions) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const analyzeFastMutation = useMutation({
    mutationFn: (image: string) => analyzeItem(image, "fast"),
    retry: false,
  })

  const createItemMutation = useMutation({
    mutationFn: createItem,
    retry: false,
  })

  const updateItemMutation = useMutation({
    mutationFn: ({itemId, payload}: UpdateItemVariables) => updateItem(itemId, payload),
    retry: false,
  })

  const processImage = useCallback(
    async (imageData: string) => {
      if (isProcessing) return

      if (!boxId) {
        toast.error("Unable to add item: no box selected.")
        onCancel()
        return
      }

      setIsProcessing(true)
      const uploadToastId = toast.loading("Uploading photo…")

      try {
        const newItem = await createItemMutation.mutateAsync({
          boxId,
          name: ANALYZING_ITEM_PLACEHOLDER_NAME,
          description: ANALYZING_ITEM_PLACEHOLDER_DESCRIPTION,
          quantity: 1,
          image: imageData,
        })

        const optimisticItem: Item = {
          ...newItem,
          name: ANALYZING_ITEM_PLACEHOLDER_NAME,
          description: ANALYZING_ITEM_PLACEHOLDER_DESCRIPTION,
          quantity: 1,
          image: imageData,
        }

        onCapture(imageData)
        router.push(`/box/${boxId}`)
        insertOptimisticItem(queryClient, optimisticItem, boxId)

        toast.success("Photo saved. Analyzing item…", {id: uploadToastId})

        const analysisToastId = toast.loading("Analyzing item details…")

        void (async () => {
          try {
            const analysis = await analyzeFastMutation.mutateAsync(imageData)

            const updatedName = analysis?.name?.trim() ? analysis.name : "New Item"
            const updatedDescription = analysis?.description ?? ""
            const updatedQuantity =
              typeof analysis?.quantity === "number" && analysis.quantity > 0
                ? analysis.quantity
                : 1

            const updatedItem = await updateItemMutation.mutateAsync({
              itemId: newItem.id,
              payload: {
                boxId,
                name: updatedName,
                description: updatedDescription,
                quantity: updatedQuantity,
              },
            })

            upsertCachedItem(queryClient, updatedItem, boxId)
            toast.success("Item analysis complete.", {id: analysisToastId})
          } catch (analysisError) {
            console.error("Error processing item with fast analysis:", analysisError)
            toast.error("Fast AI analysis failed. Please edit item details manually.", {
              id: analysisToastId,
            })

            try {
              const fallbackItem = await updateItemMutation.mutateAsync({
                itemId: newItem.id,
                payload: {
                  boxId,
                  name: "New Item",
                  description: "",
                  quantity: 1,
                },
              })
              upsertCachedItem(queryClient, fallbackItem, boxId)
            } catch (updateError) {
              console.error("Error updating fallback item state:", updateError)
            }
          } finally {
            void queryClient.invalidateQueries(itemsQueryOptions)
            void queryClient.invalidateQueries(boxesQueryOptions)
            void queryClient.invalidateQueries(boxQueryOptions(boxId))
          }
        })()
      } catch (error) {
        console.error("Error saving photo:", error)
        toast.error("Failed to add item. Please try again.", {id: uploadToastId})
        setError("Unable to save the photo. Please try again.")
        onCancel()
      } finally {
        setIsProcessing(false)
      }
    },
    [
      analyzeFastMutation,
      boxId,
      createItemMutation,
      isProcessing,
      onCancel,
      onCapture,
      queryClient,
      router,
      updateItemMutation,
    ],
  )

  const resetError = useCallback(() => setError(null), [])
  const setErrorMessage = useCallback((message: string) => setError(message), [])

  return {
    error,
    isProcessing,
    processImage,
    resetError,
    setErrorMessage,
  }
}
