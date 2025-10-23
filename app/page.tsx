"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { BoxIcon, Camera, ChevronRight, List, Plus, Search } from "lucide-react"

import { BoxCard } from "@/components/box-card"
import { CameraCapture } from "@/components/camera-capture"
import { CreateBoxDialog } from "@/components/create-box-dialog"
import { EmptyState } from "@/components/empty-state"
import { InventoryItem } from "@/components/inventory-item"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  boxesQueryOptions,
  boxesSearchQueryOptions,
  createBox,
  deleteItem as deleteItemApi,
  itemsSearchQueryOptions,
} from "@/lib/api"

export default function InventoryPage() {
  const queryClient = useQueryClient()
  const [showCamera, setShowCamera] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showBoxPicker, setShowBoxPicker] = useState(false)
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null)

  const hasSearch = searchQuery.trim().length > 0

  const {
    data: boxes = [],
    isPending: boxesPending,
    isError: boxesError,
  } = useQuery(boxesQueryOptions)

  const boxesSearchQuery = boxesSearchQueryOptions(searchQuery)
  const {
    data: searchedBoxes = [],
    isPending: boxesSearchPending,
    isError: boxesSearchError,
  } = useQuery(boxesSearchQuery)

  const itemsSearchQuery = itemsSearchQueryOptions(searchQuery)
  const {
    data: searchedItems = [],
    isPending: itemsPending,
    isError: itemsError,
  } = useQuery(itemsSearchQuery)

  const createBoxMutation = useMutation({
    mutationFn: ({ name, description, color }: { name: string; description: string; color: string }) =>
      createBox({ name, description, color }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["boxes"], exact: false })
    },
    onError: (error) => {
      console.error("[v0] Error creating box:", error)
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => deleteItemApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["items"], exact: false })
      void queryClient.invalidateQueries({ queryKey: ["boxes"], exact: false })
    },
    onError: (error) => {
      console.error("[v0] Error deleting item:", error)
    },
  })

  const isLoading = boxesPending || (hasSearch && (boxesSearchPending || itemsPending))
  const hasError = boxesError || (hasSearch && (boxesSearchError || itemsError))

  const displayBoxes = hasSearch ? searchedBoxes : boxes
  const displayItems = hasSearch ? searchedItems : []

  const showGlobalEmptyState = !hasSearch && displayBoxes.length === 0

  const handleCreateBox = async (name: string, description: string, color: string) => {
    try {
      await createBoxMutation.mutateAsync({ name, description, color })
      setShowCreateDialog(false)
    } catch (error) {
      console.error("[v0] Error creating box:", error)
    }
  }

  const handleDeleteItem = (id: string) => {
    deleteItemMutation.mutate(id)
  }

  const handlePhotoCapture = async (_imageData?: string) => {
    setShowCamera(false)
    setSelectedBoxId(null)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["items"], exact: false }),
      queryClient.invalidateQueries({ queryKey: ["boxes"], exact: false }),
    ])
  }

  const handleCancelCamera = () => {
    setShowCamera(false)
    setSelectedBoxId(null)
  }

  const handleAddItemClick = () => {
    if (!boxes.length) {
      setShowCreateDialog(true)
      return
    }

    setSelectedBoxId(null)
    setShowBoxPicker(true)
  }

  const handleBoxPickerOpenChange = (open: boolean) => {
    setShowBoxPicker(open)
    if (!open && !showCamera) {
      setSelectedBoxId(null)
    }
  }

  const handleBoxSelection = (id: string) => {
    setSelectedBoxId(id)
    setShowBoxPicker(false)
    setShowCamera(true)
  }

  const handleCreateBoxFromPicker = () => {
    setShowBoxPicker(false)
    setSelectedBoxId(null)
    setShowCreateDialog(true)
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <BoxIcon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Inventory</h1>
          </div>
          <div className="flex gap-4">
            <Button size="lg" onClick={handleAddItemClick} className="gap-2" disabled={boxesPending}>
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
              placeholder="Search boxes or items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">Loading inventory…</div>
        ) : hasError ? (
          <EmptyState
            icon={BoxIcon}
            title="Something went wrong"
            description="We couldn't load your inventory. Please try again."
          />
        ) : showGlobalEmptyState ? (
          <EmptyState
            icon={BoxIcon}
            title="No boxes yet"
            description="Start by creating your first storage box or adding an item with the camera."
            action={
              <Button size="lg" onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="h-5 w-5" />
                Create First Box
              </Button>
            }
          />
        ) : (
          <div className="space-y-8">
            <section className="space-y-4">
              {hasSearch && (
                <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Boxes</h2>
              )}
              {displayBoxes.length > 0 ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {displayBoxes.map((box) => (
                      <Link key={box.id} href={`/box/${box.id}`}>
                        <BoxCard box={box} />
                      </Link>
                    ))}
                  </div>
                  <div className="flex justify-center pt-4">
                    <Link
                      href="/items"
                      className="text-sm font-medium text-primary hover:text-primary/80"
                    >
                      View all items
                    </Link>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                  {hasSearch ? "No boxes found for this search." : "No boxes available."}
                </div>
              )}
            </section>

            {hasSearch && (
              <>
                <Separator />
                <section className="space-y-4">
                  <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Items</h2>
                  {displayItems.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {displayItems.map((item) => (
                        <InventoryItem key={item.id} item={item} onDelete={handleDeleteItem} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                      No items found for this search.
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        )}
      </main>

      <CreateBoxDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateBox={handleCreateBox}
        isSubmitting={createBoxMutation.isPending}
      />

      <Dialog open={showBoxPicker} onOpenChange={handleBoxPickerOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select a box</DialogTitle>
            <DialogDescription>Choose where you want to store the new item.</DialogDescription>
          </DialogHeader>
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {boxes.map((box) => (
              <Button
                key={box.id}
                variant="outline"
                className="w-full justify-between"
                onClick={() => handleBoxSelection(box.id)}
              >
                <div className="flex items-center gap-3">
                  <span className={`h-8 w-8 rounded-md ${box.color}`} aria-hidden />
                  <div className="text-left">
                    <div className="font-medium leading-tight">{box.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {box.itemCount} {box.itemCount === 1 ? "item" : "items"}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            ))}
            {!boxes.length && (
              <div className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
                Create a box to store your items.
              </div>
            )}
          </div>
          <Button variant="ghost" className="w-full gap-2" onClick={handleCreateBoxFromPicker}>
            <Plus className="h-4 w-4" />
            Create new box
          </Button>
        </DialogContent>
      </Dialog>

      {showCamera && selectedBoxId ? (
        <CameraCapture onCapture={handlePhotoCapture} onCancel={handleCancelCamera} boxId={selectedBoxId} />
      ) : null}
    </div>
  )
}
