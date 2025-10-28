"use client"

import {useState} from "react"
import {Loader2, MoreVertical} from "lucide-react"
import {Card} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu"
import type {Item} from "@/lib/db/schema"
import {useRouter} from "next/navigation"
import {ANALYZING_ITEM_PLACEHOLDER_DESCRIPTION, ANALYZING_ITEM_PLACEHOLDER_NAME,} from "@/lib/constants"

interface InventoryItemProps {
  item: Item
  onDelete: (id: string) => void
}

const ITEM_PLACEHOLDER_IMAGE = "/item-placeholder.svg"

export function InventoryItem({item, onDelete}: InventoryItemProps) {
  const router = useRouter()
  const [imageErrored, setImageErrored] = useState(false)

  const hasValidImage = typeof item.image === "string" && item.image.trim().length > 0 && !imageErrored
  const imageSrc = hasValidImage ? item.image : ITEM_PLACEHOLDER_IMAGE
  const isAnalyzing =
    item.name === ANALYZING_ITEM_PLACEHOLDER_NAME &&
    item.description === ANALYZING_ITEM_PLACEHOLDER_DESCRIPTION

  return (
    <Card className="overflow-hidden transition-transform active:scale-[0.98]">
      <div className="flex gap-4 p-4">
        <button
          type="button"
          onClick={() => {
            if (!isAnalyzing) {
              router.push(`/item/${item.id}`)
            }
          }}
          className={`flex min-w-0 flex-1 gap-4 text-left ${isAnalyzing ? "cursor-default opacity-70" : ""}`}
          disabled={isAnalyzing}
        >
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
            <img
              src={imageSrc}
              alt={item.name}
              className="h-full w-full object-cover"
              onError={() => setImageErrored(true)}
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <h3 className="text-lg font-semibold leading-tight">
              {isAnalyzing ? (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin"/>
                  Analyzing photo...
                </span>
              ) : (
                item.name
              )}
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isAnalyzing ? "We'll fill in these details shortly." : `Qty: ${item.quantity}`}
            </p>
          </div>
        </button>

        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-12 w-12" disabled={isAnalyzing}>
                <MoreVertical className="h-5 w-5"/>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => router.push(`/item/${item.id}`)}
                disabled={isAnalyzing}
              >
                Edit Item
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-destructive">
                Delete Item
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  )
}
