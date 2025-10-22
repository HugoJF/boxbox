import { BoxIcon, Package } from "lucide-react"
import { Card } from "@/components/ui/card"
import type { Box } from "@/lib/types"

interface BoxCardProps {
  box: Box
}

export function BoxCard({ box }: BoxCardProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${box.color}`}>
          <BoxIcon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg mb-1 truncate">{box.name}</h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{box.description}</p>
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
