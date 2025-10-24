"use client"

import { useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query"
import { ArrowLeft, LoaderIcon } from "lucide-react"

import { InventoryItem } from "@/components/inventory-item"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { LogoutButton } from "@/components/auth/logout-button"
import { ProtectedClient } from "@/components/auth/protected-client"
import { deleteItem, fetchPaginatedItems, type PaginatedItemsResponse } from "@/lib/api"
import { toast } from "sonner"

const ITEMS_PER_PAGE = 20

export default function AllItemsPage() {
  return (
    <ProtectedClient
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          Loading your items…
        </div>
      }
    >
      <AllItemsPageContent />
    </ProtectedClient>
  )
}

function AllItemsPageContent() {
  const queryClient = useQueryClient()
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const {
    data,
    status,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["items", "infinite", ITEMS_PER_PAGE],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => fetchPaginatedItems(ITEMS_PER_PAGE, pageParam as string | undefined),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })

  const items = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data])

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node) {
      return
    }

    if (!hasNextPage) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { rootMargin: "200px" },
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<InfiniteData<PaginatedItemsResponse, string | undefined>>(
        ["items", "infinite", ITEMS_PER_PAGE],
        (oldData) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              items: page.items.filter((item) => item.id !== id),
            })),
          }
        },
      )
      void queryClient.invalidateQueries({ queryKey: ["items"], exact: false })
      void queryClient.invalidateQueries({ queryKey: ["boxes"], exact: false })
      toast.success("Item deleted")
    },
    onError: (err) => {
      console.error("Error deleting item:", err)
      toast.error("Failed to delete item")
    },
  })

  const handleDeleteItem = (id: string) => {
    deleteItemMutation.mutate(id)
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-lg font-semibold">All Items</h1>
          </div>
          <LogoutButton variant="ghost" size="sm" />
        </div>
      </header>

      <main className="mx-auto container px-4 py-6">
        {status === "pending" ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Spinner className="h-6 w-6" />
          </div>
        ) : status === "error" ? (
          <EmptyState
            title="Failed to load items"
            description={error instanceof Error ? error.message : "Something went wrong loading your items."}
            action={
              <Button onClick={() => refetch()} className="gap-2">
                <LoaderIcon className="h-4 w-4" />
                Try again
              </Button>
            }
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="No items yet"
            description="Add items to your boxes to see them listed here."
            action={
              <Button asChild className="gap-2">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                  Back to dashboard
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <InventoryItem key={item.id} item={item} onDelete={handleDeleteItem} />
              ))}
            </div>

            <div ref={loadMoreRef} aria-hidden className="h-1" />

            {isFetchingNextPage && (
              <div className="flex justify-center">
                <Spinner className="h-5 w-5" />
              </div>
            )}

            {hasNextPage && !isFetchingNextPage && (
              <div className="flex justify-center">
                <Button onClick={() => fetchNextPage()} variant="outline">
                  Load more
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
