"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Camera, Plus, Search, MoreVertical } from "lucide-react"

import { CameraCapture } from "@/components/camera-capture"
import { EmptyState } from "@/components/empty-state"
import { InventoryItem } from "@/components/inventory-item"
import { EditBoxDialog } from "@/components/edit-box-dialog"
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
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { LogoutButton } from "@/components/auth/logout-button"
import { ProtectedClient } from "@/components/auth/protected-client"
import type { Box, Item } from "@/lib/db/schema"
import {
  boxQueryOptions,
  deleteBox as deleteBoxApi,
  deleteItem as deleteItemApi,
  updateBox as updateBoxApi,
} from "@/lib/api"
import { toast } from "sonner"

type BoxWithItems = Box & { items: Item[] }

export default function BoxDetailPage() {
  return (
    <ProtectedClient
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          Loading box…
        </div>
      }
    >
      <BoxDetailPageContent />
    </ProtectedClient>
  )
}

function BoxDetailPageContent() {
  const params = useParams()
  const router = useRouter()
  const boxId = params.id as string

  const queryClient = useQueryClient()

  const [showCamera, setShowCamera] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const baseBoxQuery = boxQueryOptions(boxId)

  const { data: boxData, isPending, isError } = useQuery({
    ...baseBoxQuery,
    queryFn: async () => {
      try {
        const result = await baseBoxQuery.queryFn?.()
        if (!result) return undefined
        const base = result as Box & { items?: Item[] }
        const items = Array.isArray(base.items) ? base.items : []
        return { ...base, items } as BoxWithItems
      } catch (error) {
        if ((error as Error).message.includes("404")) {
          router.push("/")
        }
        throw error
      }
    },
  })

  useEffect(() => {
    if (isError) {
      toast.error("Failed to load box")
    }
  }, [isError])

  const items = boxData?.items ?? []

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteItemApi(id)
      return id
    },
    onSuccess: (id) => {
      queryClient.setQueryData<BoxWithItems | undefined>(["box", boxId], (previous) => {
        if (!previous) return previous
        return {
          ...previous,
          items: previous.items.filter((item) => item.id !== id),
          itemCount: Math.max(0, previous.itemCount - 1),
        }
      })
      void queryClient.invalidateQueries({ queryKey: ["boxes"], exact: false })
      toast.success("Item deleted")
    },
    onError: (error) => {
      console.error("Error deleting item:", error)
      toast.error("Failed to delete item")
    },
  })

  const editBoxMutation = useMutation({
    mutationFn: ({ name, description, color }: { name: string; description: string; color: string }) =>
      updateBoxApi(boxId, { name, description, color }),
    onSuccess: (updatedBox) => {
      queryClient.setQueryData<BoxWithItems | undefined>(["box", boxId], (previous) => {
        if (!previous) {
          return { ...updatedBox, items: [] }
        }
        return { ...previous, ...updatedBox }
      })
      void queryClient.invalidateQueries({ queryKey: ["boxes"], exact: false })
      setShowEditDialog(false)
      toast.success("Box updated")
    },
    onError: (error) => {
      console.error("Error updating box:", error)
      toast.error("Failed to update box")
    },
  })

  const handlePhotoCapture = async (_imageData?: string) => {
    setShowCamera(false)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["box", boxId], exact: false }),
      queryClient.invalidateQueries({ queryKey: ["boxes"], exact: false }),
    ])
  }

  const handleDeleteItem = (id: string) => {
    deleteItemMutation.mutate(id)
  }

  const handleEditBox = (name: string, description: string, color: string) => {
    editBoxMutation.mutate({ name, description, color })
  }

  const deleteBoxMutation = useMutation({
    mutationFn: () => deleteBoxApi(boxId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["boxes"], exact: false })
      toast.success("Box deleted")
      router.push("/")
    },
    onError: (error) => {
      console.error("Error deleting box:", error)
      toast.error("Failed to delete box")
    },
  })

  const handleDeleteBox = () => {
    deleteBoxMutation.mutate()
  }

  const handleShowQR = () => {
    router.push(`/qr/${boxId}`)
  }

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const query = searchQuery.toLowerCase()
        return (
          item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
        )
      }),
    [items, searchQuery],
  )

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading box…</div>
    )
  }

  if (!boxData) {
    return null
  }

  if (showCamera) {
    return <CameraCapture onCapture={handlePhotoCapture} onCancel={() => setShowCamera(false)} boxId={boxId} />
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" onClick={() => router.push("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className={`p-2 rounded-lg ${boxData.color}`}>
              <div className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">{boxData.name}</h1>
              <p className="text-xs text-muted-foreground">{items.length} items</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LogoutButton variant="ghost" size="sm" />
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
        </div>
      </header>

      <main className="mx-auto container px-4 py-6">
        <div className="mb-6 flex items-center gap-2">
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
          <Button size="lg" onClick={() => setShowCamera(true)} className="h-12 gap-2">
            <Camera className="h-5 w-5" />
            Add item
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

      <EditBoxDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        box={boxData}
        onEditBox={handleEditBox}
        isSubmitting={editBoxMutation.isPending}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Box?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{boxData.name}" and all {items.length} items inside. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBox}
              className="bg-destructive text-destructive-foreground"
              disabled={deleteBoxMutation.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
