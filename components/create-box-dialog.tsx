"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface CreateBoxDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateBox: (name: string, description: string, color: string) => void
}

const COLORS = [
  { name: "Blue", value: "bg-blue-100 text-blue-700" },
  { name: "Green", value: "bg-green-100 text-green-700" },
  { name: "Purple", value: "bg-purple-100 text-purple-700" },
  { name: "Orange", value: "bg-orange-100 text-orange-700" },
  { name: "Pink", value: "bg-pink-100 text-pink-700" },
  { name: "Yellow", value: "bg-yellow-100 text-yellow-700" },
]

export function CreateBoxDialog({ open, onOpenChange, onCreateBox }: CreateBoxDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onCreateBox(name.trim(), description.trim(), selectedColor)
      setName("")
      setDescription("")
      setSelectedColor(COLORS[0].value)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Box</DialogTitle>
          <DialogDescription>Add a new storage box to organize your inventory items.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Box Name</Label>
            <Input
              id="name"
              placeholder="e.g., Kitchen Supplies"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What's stored in this box?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-6 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`h-10 rounded-lg ${color.value} ${
                    selectedColor === color.value ? "ring-2 ring-offset-2 ring-primary" : ""
                  }`}
                  aria-label={color.name}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Box</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
