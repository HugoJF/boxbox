"use client"

import { useState, useEffect } from "react"
import { BoxIcon, Camera, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CameraCapture } from "@/components/camera-capture"
import { InventoryItem } from "@/components/inventory-item"
import { EmptyState } from "@/components/empty-state"
import { BoxCard } from "@/components/box-card"
import { CreateBoxDialog } from "@/components/create-box-dialog"
import type { Item, Box } from "@/lib/types"
import Link from "next/link"

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([])
  const [boxes, setBoxes] = useState<Box[]>([])
  const [showCamera, setShowCamera] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    const storedItems = localStorage.getItem("inventory-items")
    const storedBoxes = localStorage.getItem("inventory-boxes")
    if (storedItems) {
      setItems(JSON.parse(storedItems))
    }
    if (storedBoxes) {
      setBoxes(JSON.parse(storedBoxes))
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("inventory-items", JSON.stringify(items))
      localStorage.setItem("inventory-boxes", JSON.stringify(boxes))
    }
  }, [items, boxes, isLoading])

  const handlePhotoCapture = async (imageData: string) => {
    setShowCamera(false)

    try {
      const response = await fetch("/api/analyze-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      })

      const data = await response.json()

      const newItem: Item = {
        id: crypto.randomUUID(),
        name: data.name || "Unknown Item",
        category: data.category || "Uncategorized",
        description: data.description || "",
        quantity: data.quantity || 1,
        image: imageData,
        createdAt: new Date().toISOString(),
      }

      setItems((prev) => [newItem, ...prev])
    } catch (error) {
      console.error("[v0] Error analyzing item:", error)
    }
  }

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item)))
  }

  const handleCreateBox = (name: string, description: string, color: string) => {
    const newBox: Box = {
      id: crypto.randomUUID(),
      name,
      description,
      color,
      itemCount: 0,
      items: [],
      createdAt: new Date().toISOString(),
    }
    setBoxes((prev) => [newBox, ...prev])
    setShowCreateDialog(false)
  }

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredBoxes = boxes.filter(
    (box) =>
      box.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      box.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <BoxIcon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Inventory</h1>
          </div>
          <div className="flex gap-4">
            <Button size="lg" onClick={() => setShowCamera(true)} className="gap-2">
              <Camera className="h-5 w-5" />
              Add Item
            </Button>
            <Button size="lg" onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="h-5 w-5" />
              New Box
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search items/boxes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>

        {filteredBoxes.length === 0 && filteredItems.length === 0 ? (
          <EmptyState
            icon={searchQuery ? Search : BoxIcon}
            title={searchQuery ? "No items/boxes found" : "No items/boxes yet"}
            description={
              searchQuery
                ? "Try adjusting your search terms"
                : "Start by creating your first storage box or adding an item with the camera"
            }
            action={
              !searchQuery && (
                <Button size="lg" onClick={() => setShowCreateDialog(true)} className="gap-2">
                  <Plus className="h-5 w-5" />
                  Create First Box
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBoxes.map((box) => (
              <Link key={box.id} href={`/box/${box.id}`}>
                <BoxCard box={box} />
              </Link>
            ))}
            {filteredItems.map((item) => (
              <InventoryItem
                key={item.id}
                item={item}
                onDelete={handleDeleteItem}
                onUpdateQuantity={handleUpdateQuantity}
              />
            ))}
          </div>
        )}
      </main>

      <CreateBoxDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onCreateBox={handleCreateBox} />
      {showCamera && <CameraCapture onCapture={handlePhotoCapture} onCancel={() => setShowCamera(false)} />}
    </div>
  )
}
