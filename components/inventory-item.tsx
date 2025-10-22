"use client"

import { MoreVertical } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Item } from "@/lib/db/schema"
import { useRouter } from "next/navigation"

interface InventoryItemProps {
  item: Item
  onDelete: (id: string) => void
}

export function InventoryItem({ item, onDelete }: InventoryItemProps) {
  const router = useRouter()

  return (
    <Card className="overflow-hidden active:scale-[0.98] transition-transform">
      <div className="flex gap-4 p-4">
        <button onClick={() => router.push(`/item/${item.id}`)} className="flex gap-4 flex-1 min-w-0 text-left">
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
            <img src={item.image || "/placeholder.svg"} alt={item.name} className="h-full w-full object-cover" />
          </div>

          <div className="flex flex-1 flex-col justify-center min-w-0">
            <h3 className="font-semibold text-lg leading-tight">{item.name}</h3>
            <p className="text-sm text-muted-foreground mt-1.5">{item.category}</p>
            <p className="text-sm text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
          </div>
        </button>

        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-12 w-12">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push(`/item/${item.id}`)}>Edit Item</DropdownMenuItem>
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
