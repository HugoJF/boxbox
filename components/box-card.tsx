import { BoxIcon, Package } from "lucide-react"
import { Card } from "@/components/ui/card"
import type { Box } from "@/lib/db/schema"

interface BoxCardProps {
  box: Box
}

export function BoxCard({ box }: BoxCardProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${box.color}`}>
          <BoxIcon className="h-6 w-6" />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{box.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{box.description || 'No description'}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>
              {box.itemCount} {box.itemCount === 1 ? "item" : "items"}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
