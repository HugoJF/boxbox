"use client"

import { useState, useEffect } from "react"
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
import type { Box } from "@/lib/db/schema"
import { toast } from "sonner"

export default function EditItemPage() {
  const params = useParams()
  const router = useRouter()
  const itemId = params.id as string

  const [item, setItem] = useState<Item | null>(null)
  const [boxes, setBoxes] = useState<Box[]>([])
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [selectedBoxId, setSelectedBoxId] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch item
        const itemRes = await fetch(`/api/items/${itemId}`)
        if (!itemRes.ok) {
          router.push("/")
          return
        }
        const itemData = await itemRes.json()
        setItem(itemData)
        setName(itemData.name)
        setCategory(itemData.category)
        setDescription(itemData.description)
        setQuantity(itemData.quantity)
        setSelectedBoxId(itemData.boxId)

        // Fetch all boxes
        const boxesRes = await fetch("/api/boxes")
        const boxesData = await boxesRes.json()
        setBoxes(boxesData)
      } catch (error) {
        console.error("[v0] Error fetching data:", error)
        toast.error("Failed to load item")
      }
    }

    fetchData()
  }, [itemId, router])

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Item name is required")
      return
    }

    setIsLoading(true)
    try {
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

      if (!res.ok) throw new Error("Failed to update item")

      toast.success("Item updated successfully")
      router.push(`/box/${selectedBoxId}`)
    } catch (error) {
      console.error("[v0] Error updating item:", error)
      toast.error("Failed to update item")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete item")

      toast.success("Item deleted successfully")
      router.push(`/box/${item?.boxId}`)
    } catch (error) {
      console.error("[v0] Error deleting item:", error)
      toast.error("Failed to delete item")
    } finally {
      setIsLoading(false)
    }
  }

  if (!item) {
    return null
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
          <Button size="icon" variant="ghost" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-5 w-5 text-destructive" />
          </Button>
        </div>
      </header>

      <main className="container px-4 py-6 max-w-2xl">
        <div className="mb-6">
          <div className="relative h-48 w-full overflow-hidden rounded-lg bg-muted">
            <img src={item.image || "/placeholder.svg"} alt={item.name} className="h-full w-full object-cover" />
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="box">Box</Label>
            <Select value={selectedBoxId} onValueChange={setSelectedBoxId}>
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

          <Button size="lg" onClick={handleSave} disabled={isLoading} className="w-full gap-2">
            <Save className="h-5 w-5" />
            Save Changes
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
