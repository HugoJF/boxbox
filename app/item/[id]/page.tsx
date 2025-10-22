"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Save, Trash2 } from "lucide-react"

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
import type { Item } from "@/lib/db/schema"
import { boxesQueryOptions, itemQueryOptions } from "@/lib/api"
import { toast } from "sonner"

const ITEM_PLACEHOLDER_IMAGE = "/item-placeholder.svg"

export default function EditItemPage() {
  const params = useParams()
  const router = useRouter()
  const itemId = params.id as string

  const queryClient = useQueryClient()

  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [selectedBoxId, setSelectedBoxId] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [imageErrored, setImageErrored] = useState(false)

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

  useEffect(() => {
    if (item) {
      setName(item.name)
      setCategory(item.category)
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
    mutationFn: async () => {
      const res = await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          description,
          quantity,
          boxId: selectedBoxId,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to update item")
      }

      return (await res.json()) as Item
    },
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
    mutationFn: async () => {
      const res = await fetch(`/api/items/${itemId}`, { method: "DELETE" })

      if (!res.ok) {
        throw new Error("Failed to delete item")
      }
    },
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

  if (itemPending || !item) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading item…</div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
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

      <main className="container px-4 py-6 max-w-2xl">
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
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Enter category"
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
