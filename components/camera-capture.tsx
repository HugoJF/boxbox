"use client"

import {ChangeEvent, useEffect, useRef, useState} from "react"
import {Camera, ImagePlus, X} from "lucide-react"
import {Button} from "@/components/ui/button"
import {CameraDeviceSelector} from "@/components/camera-device-selector"
import {useItemCaptureFlow} from "@/hooks/use-item-capture-flow"

interface CameraCaptureProps {
  onCapture: (imageData: string) => void
  onCancel: () => void
  boxId?: string
}

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
      } else {
        reject(new Error("Unsupported file result"))
      }
    }
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read file"))
    reader.readAsDataURL(file)
  })

export function CameraCapture({onCapture, onCancel, boxId}: CameraCaptureProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const hasLaunchedCameraRef = useRef(false)
  const [showSelectPhoto, setShowSelectPhoto] = useState(false)
  const {processImage, isProcessing, error, resetError, setErrorMessage} = useItemCaptureFlow({
    boxId,
    onCapture,
    onCancel,
  })

  useEffect(() => {
    if (!hasLaunchedCameraRef.current) {
      hasLaunchedCameraRef.current = true
      cameraInputRef.current?.click()
    }
  }, [])

  const handleCancel = () => {
    resetError()
    onCancel()
  }

  const handleFileSelection = async (file: File | null) => {
    if (!file) {
      setShowSelectPhoto(true)
      return
    }

    try {
      const imageData = await readFileAsDataUrl(file)
      setShowSelectPhoto(false)
      resetError()
      await processImage(imageData)
    } catch (err) {
      console.error("Error reading file:", err)
      setShowSelectPhoto(false)
      setErrorMessage("Unable to read the selected image. Please try a different photo.")
    }
  }

  const handleCameraChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    void handleFileSelection(file)
    event.target.value = ""
  }

  if (showSelectPhoto) {
    return (
      <CameraDeviceSelector
        onSelectFile={(file) => void handleFileSelection(file)}
        onCancel={handleCancel}
        onUseCamera={() => {
          resetError()
          setShowSelectPhoto(false)
          cameraInputRef.current?.click()
        }}
      />
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="text-center px-6">
          <p className="text-white text-lg mb-4">{error}</p>
          <Button
            onClick={handleCancel}
            variant="outline"
          >
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="relative h-full w-full">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleCameraChange}
        />
        <div className="flex h-full w-full flex-col items-center justify-between">
          <div className="flex w-full justify-between p-4">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCancel}
              className="h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <X className="h-6 w-6"/>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
              disabled={isProcessing}
              onClick={() => {
                if (!isProcessing) {
                  resetError()
                  setShowSelectPhoto(true)
                }
              }}
            >
              <ImagePlus className="h-6 w-6"/>
            </Button>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center text-white">
            <Camera className="h-12 w-12 text-white/70"/>
            <div className="space-y-2">
              <p className="text-lg font-semibold">Use your camera</p>
              <p className="text-sm text-white/60">We&apos;ll open your device camera so you can snap a photo of the
                item.</p>
            </div>
            <Button
              onClick={() => cameraInputRef.current?.click()}
              className="h-12 rounded-full px-8"
              disabled={isProcessing}
            >
              Open camera
            </Button>
          </div>
          <div className="pb-10 text-center text-sm text-white/50">
            Prefer uploading from your gallery?{" "}
            <button
              type="button"
              onClick={() => {
                if (!isProcessing) {
                  resetError()
                  setShowSelectPhoto(true)
                }
              }}
              disabled={isProcessing}
              className="underline underline-offset-4"
            >
              Select a photo instead
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
