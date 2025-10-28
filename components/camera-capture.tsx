"use client"

import {ChangeEvent, useEffect, useRef, useState} from "react"
import {useMutation} from "@tanstack/react-query"
import {Camera, ImagePlus, X} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Spinner} from "@/components/ui/spinner"
import {CameraDeviceSelector} from "@/components/camera-device-selector"
import {useRouter} from "next/navigation"
import {toast} from "sonner"
import {analyzeItem, createItem} from "@/lib/api"

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
  const router = useRouter()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const hasLaunchedCameraRef = useRef(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSelectPhoto, setShowSelectPhoto] = useState(false)

  const analyzeFastMutation = useMutation({
    mutationFn: (image: string) => analyzeItem(image, "fast"),
    retry: false,
  })

  const createItemMutation = useMutation({
    mutationFn: createItem,
    retry: false,
  })

  useEffect(() => {
    if (!hasLaunchedCameraRef.current) {
      hasLaunchedCameraRef.current = true
      cameraInputRef.current?.click()
    }
  }, [])

  const processImage = async (imageData: string) => {
    if (isProcessing) return

    if (!boxId) {
      toast.error("Unable to add item: no box selected.")
      onCancel()
      return
    }

    setIsProcessing(true)
    try {
      const analysis = await analyzeFastMutation.mutateAsync(imageData)

      await createItemMutation.mutateAsync({
        boxId,
        name: analysis?.name || "Unknown Item",
        description: analysis?.description || "",
        quantity: analysis?.quantity ?? 1,
        image: imageData,
      })

      onCapture(imageData)
      toast.success("Item added successfully")
      router.push(`/box/${boxId}`)
    } catch (error) {
      console.error("Error processing item with fast analysis:", error)

      try {
        const newItem = await createItemMutation.mutateAsync({
          boxId,
          name: "New Item",
          description: "",
          quantity: 1,
          image: imageData,
        })
        toast.error("Fast AI analysis failed. Please edit item details manually.")
        onCapture(imageData)
        router.push(`/item/${newItem.id}`)
      } catch (createError) {
        console.error("Error creating item after analysis failure:", createError)
        toast.error("Failed to add item")
        onCancel()
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileSelection = async (file: File | null) => {
    if (!file) {
      setShowSelectPhoto(true)
      return
    }

    try {
      const imageData = await readFileAsDataUrl(file)
      setShowSelectPhoto(false)
      setError(null)
      await processImage(imageData)
    } catch (err) {
      console.error("Error reading file:", err)
      setError("Unable to read the selected image. Please try a different photo.")
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
        onCancel={onCancel}
        onUseCamera={() => {
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
          <Button onClick={onCancel} variant="outline">
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
              onClick={onCancel}
              className="h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <X className="h-6 w-6"/>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowSelectPhoto(true)}
              className="h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <ImagePlus className="h-6 w-6"/>
            </Button>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center text-white">
            <Camera className="h-12 w-12 text-white/70"/>
            <div className="space-y-2">
              <p className="text-lg font-semibold">Use your camera</p>
              <p className="text-sm text-white/60">We&apos;ll open your device camera so you can snap a photo of the item.</p>
            </div>
            <Button onClick={() => cameraInputRef.current?.click()} className="h-12 rounded-full px-8">
              Open camera
            </Button>
          </div>
          <div className="pb-10 text-center text-sm text-white/50">
            Prefer uploading from your gallery?{" "}
            <button
              type="button"
              onClick={() => setShowSelectPhoto(true)}
              className="underline underline-offset-4"
            >
              Select a photo instead
            </button>
          </div>
        </div>
        {isProcessing ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 px-6 text-center text-white">
            <Spinner className="h-12 w-12"/>
            <p className="text-base font-medium">Processing photo…</p>
            <p className="text-sm text-white/60">Hang tight while we add the item to your box.</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
