"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Camera, Plus, Search, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CameraCapture } from "@/components/camera-capture"
import { InventoryItem } from "@/components/inventory-item"
import { EmptyState } from "@/components/empty-state"
import { EditBoxDialog } from "@/components/edit-box-dialog"
import type { Box, Item } from "@/lib/db/schema"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

export default function BoxDetailPage() {
  const params = useParams()
  const router = useRouter()
  const boxId = params.id as string

  const [box, setBox] = useState<Box | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [showCamera, setShowCamera] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchBoxData()
  }, [boxId])

  const fetchBoxData = async () => {
    try {
      const boxRes = await fetch(`/api/boxes/${boxId}`)
      if (!boxRes.ok) {
        router.push("/")
        return
      }
      const boxData = await boxRes.json()
      setBox(boxData)

      const itemsRes = await fetch(`/api/items?boxId=${boxId}`)
      const itemsData = await itemsRes.json()
      setItems(itemsData)
    } catch (error) {
      console.error("[v0] Error fetching box data:", error)
      toast.error("Failed to load box")
    }
  }

  const handlePhotoCapture = async () => {
    setShowCamera(false)
    await fetchBoxData()
  }

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete item")

      setItems(items.filter((item) => item.id !== id))
      toast.success("Item deleted")
    } catch (error) {
      console.error("[v0] Error deleting item:", error)
      toast.error("Failed to delete item")
    }
  }

  const handleEditBox = async (name: string, description: string, color: string) => {
    try {
      const res = await fetch(`/api/boxes/${boxId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, color }),
      })
      if (!res.ok) throw new Error("Failed to update box")

      const updatedBox = await res.json()
      setBox(updatedBox)
      setShowEditDialog(false)
      toast.success("Box updated")
    } catch (error) {
      console.error("[v0] Error updating box:", error)
      toast.error("Failed to update box")
    }
  }

  const handleDeleteBox = async () => {
    try {
      const res = await fetch(`/api/boxes/${boxId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete box")

      toast.success("Box deleted")
      router.push("/")
    } catch (error) {
      console.error("[v0] Error deleting box:", error)
      toast.error("Failed to delete box")
    }
  }

  const handleShowQR = () => {
    router.push(`/qr/${boxId}`)
  }

  if (!box) {
    return null
  }

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (showCamera) {
    return <CameraCapture onCapture={handlePhotoCapture} onCancel={() => setShowCamera(false)} boxId={boxId} />
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" onClick={() => router.push("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className={`p-2 rounded-lg ${box.color}`}>
              <div className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">{box.name}</h1>
              <p className="text-xs text-muted-foreground">{items.length} items</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-12 w-12">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleShowQR}>Show QR Code</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowEditDialog(true)}>Edit Box</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                Delete Box
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="container px-4 py-6">
        <div className="mb-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
          <Button size="lg" onClick={() => setShowCamera(true)} className="gap-2">
            <Camera className="h-5 w-5" />
            Add
          </Button>
        </div>

        {filteredItems.length === 0 ? (
          <EmptyState
            icon={searchQuery ? Search : Camera}
            title={searchQuery ? "No items found" : "No items yet"}
            description={
              searchQuery ? "Try adjusting your search terms" : "Start by adding your first item with the camera"
            }
            action={
              !searchQuery && (
                <Button size="lg" onClick={() => setShowCamera(true)} className="gap-2">
                  <Plus className="h-5 w-5" />
                  Add First Item
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-4">
            {filteredItems.map((item) => (
              <InventoryItem key={item.id} item={item} onDelete={handleDeleteItem} />
            ))}
          </div>
        )}
      </main>

      <EditBoxDialog open={showEditDialog} onOpenChange={setShowEditDialog} box={box} onEditBox={handleEditBox} />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Box?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{box.name}" and all {items.length} items inside. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBox} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
