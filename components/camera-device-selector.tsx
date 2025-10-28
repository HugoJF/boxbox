"use client"

import {ChangeEvent, DragEvent, KeyboardEvent, useRef} from "react"
import {ImagePlus, X} from "lucide-react"
import {Button} from "@/components/ui/button"

interface CameraDeviceSelectorProps {
  onSelectFile: (file: File) => void
  onCancel: () => void
  onUseCamera: () => void
}

export function CameraDeviceSelector({onSelectFile, onCancel, onUseCamera}: CameraDeviceSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onSelectFile(file)
    }
    event.target.value = ""
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) {
      onSelectFile(file)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      fileInputRef.current?.click()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">
      <div className="w-full max-w-md space-y-6 text-white">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Select a photo</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onUseCamera}
              className="h-10 rounded-full border border-white/20 bg-white/10 px-4 text-white hover:bg-white/20"
            >
              Use camera
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onCancel}
              className="h-10 w-10 rounded-full text-white hover:bg-white/10"
            >
              <X className="h-5 w-5"/>
            </Button>
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={handleKeyDown}
          onDrop={handleDrop}
          onDragOver={(event) => event.preventDefault()}
          className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 px-6 py-16 text-center transition hover:border-white/40 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          <ImagePlus className="h-12 w-12 text-white/70"/>
          <div className="space-y-2">
            <p className="text-lg font-medium">Drop a photo here</p>
            <p className="text-sm text-white/60">or click to open your gallery</p>
          </div>
        </div>

        <p className="text-sm text-white/50">We accept JPG, PNG, and HEIC images. Large photos may take a moment to process.</p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}
