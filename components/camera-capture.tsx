"use client"

import { useState, useRef, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import { Camera, X, RotateCcw, Check, SwitchCamera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { CameraDeviceSelector } from "@/components/camera-device-selector"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { analyzeItem, createItem } from "@/lib/api"

interface CameraCaptureProps {
  onCapture: (imageData: string) => void
  onCancel: () => void
  boxId?: string
}

export function CameraCapture({ onCapture, onCancel, boxId }: CameraCaptureProps) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [showDeviceSelector, setShowDeviceSelector] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)
  const activeDeviceIdRef = useRef<string | null>(null)

  const analyzeItemMutation = useMutation({
    mutationFn: (image: string) => analyzeItem(image),
    retry: false,
  })

  const createItemMutation = useMutation({
    mutationFn: createItem,
    retry: false,
  })

  const stopActiveStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setStream(null)
  }

  useEffect(() => {
    const savedDeviceId = typeof window !== "undefined" ? localStorage.getItem("preferred-camera-device") : null
    if (savedDeviceId) {
      setSelectedDeviceId(savedDeviceId)
    }

    void (async () => {
      const started = await startCamera(savedDeviceId)
      if (started) {
        await enumerateDevices()
      }
    })()

    return () => {
      stopActiveStream()
    }
  }, [])

  const enumerateDevices = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      console.error("[v0] Media devices API unavailable")
      setError("Camera is not available in this environment.")
      return []
    }

    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = allDevices.filter((device) => device.kind === "videoinput")
      setDevices(videoDevices)

      if (!selectedDeviceId && videoDevices.length === 1) {
        setSelectedDeviceId(videoDevices[0].deviceId)
      } else if (!videoDevices.length) {
        setError("No camera devices detected.")
      }
      return videoDevices
    } catch (err) {
      console.error("[v0] Error enumerating devices:", err)
      setError("Unable to access camera devices.")
      return []
    }
  }

  const startCamera = async (deviceId?: string | null): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Camera is not available in this environment.")
      return false
    }

    try {
      stopActiveStream()

      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: "environment" } },
        audio: false,
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)
      streamRef.current = mediaStream
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setError(null)

      const [videoTrack] = mediaStream.getVideoTracks()
      const resolvedDeviceId = videoTrack?.getSettings().deviceId ?? deviceId ?? null
      activeDeviceIdRef.current = resolvedDeviceId
      if (resolvedDeviceId && resolvedDeviceId !== selectedDeviceId) {
        setSelectedDeviceId(resolvedDeviceId)
        if (typeof window !== "undefined") {
          localStorage.setItem("preferred-camera-device", resolvedDeviceId)
        }
      }

      if (!devices.length) {
        void enumerateDevices()
      }

      return true
    } catch (err) {
      console.error("[v0] Camera access error:", err)
      if (deviceId) {
        console.warn("[v0] Falling back to default camera")
        return startCamera(null)
      }
      setError("Unable to access camera. Please check permissions.")
      return false
    }
  }

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDeviceId(deviceId)
    if (typeof window !== "undefined") {
      localStorage.setItem("preferred-camera-device", deviceId)
    }
    setShowDeviceSelector(false)

    void (async () => {
      const started = await startCamera(deviceId)
      if (started) {
        await enumerateDevices()
      }
    })()
  }

  const handleSwitchCamera = () => {
    stopActiveStream()
    setShowDeviceSelector(true)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.drawImage(video, 0, 0)
      const imageData = canvas.toDataURL("image/jpeg", 0.8)
      setCapturedImage(imageData)

      stopActiveStream()
    }
  }

  const retake = () => {
    setCapturedImage(null)
    if (selectedDeviceId) {
      void (async () => {
        const restarted = await startCamera(selectedDeviceId)
        if (restarted) {
          await enumerateDevices()
        }
      })()
    } else {
      void (async () => {
        const restarted = await startCamera(null)
        if (restarted) {
          await enumerateDevices()
        }
      })()
    }
  }

  const confirm = async () => {
    if (!capturedImage || !boxId) return

    setIsProcessing(true)
    try {
      const analysis = await analyzeItemMutation.mutateAsync(capturedImage)

      await createItemMutation.mutateAsync({
        boxId,
        name: analysis?.name || "Unknown Item",
        category: analysis?.category || "Uncategorized",
        description: analysis?.description || "",
        quantity: analysis?.quantity || 1,
        image: capturedImage,
      })
      toast.success("Item added successfully")
      onCapture(capturedImage)
    } catch (error) {
      console.error("[v0] Error processing item:", error)

      // Create item without AI data and redirect to edit page
      try {
        const newItem = await createItemMutation.mutateAsync({
          boxId,
          name: "New Item",
          category: "Uncategorized",
          description: "",
          quantity: 1,
          image: capturedImage,
        })
        toast.error("AI analysis failed. Please edit item details manually.")
        router.push(`/item/${newItem.id}`)
      } catch (createError) {
        console.error("[v0] Error creating item:", createError)
        toast.error("Failed to add item")
        onCancel()
      }
    } finally {
      setIsProcessing(false)
    }
  }

  if (showDeviceSelector) {
    return <CameraDeviceSelector devices={devices} onSelectDevice={handleDeviceSelect} onCancel={onCancel} />
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
        {!capturedImage ? (
          <>
            <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex flex-col">
              <div className="flex justify-between p-4">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onCancel}
                  className="h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
                >
                  <X className="h-6 w-6" />
                </Button>
                {devices.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleSwitchCamera}
                    className="h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
                  >
                    <SwitchCamera className="h-6 w-6" />
                  </Button>
                )}
              </div>
              <div className="flex-1" />
              <div className="flex justify-center pb-8">
                <Button
                  size="icon"
                  onClick={capturePhoto}
                  className="h-20 w-20 rounded-full bg-white hover:bg-gray-200"
                >
                  <Camera className="h-8 w-8 text-black" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <img src={capturedImage || "/placeholder.svg"} alt="Captured" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex flex-col">
              <div className="flex-1" />
              <div className="flex justify-center gap-4 pb-8">
                <Button
                  size="icon"
                  onClick={retake}
                  disabled={isProcessing}
                  className="h-16 w-16 rounded-full bg-white/90 hover:bg-white"
                >
                  <RotateCcw className="h-6 w-6 text-black" />
                </Button>
                <Button
                  size="icon"
                  onClick={confirm}
                  disabled={isProcessing}
                  className="h-20 w-20 rounded-full bg-primary hover:bg-primary/90"
                >
                  {isProcessing ? <Spinner className="h-8 w-8" /> : <Check className="h-8 w-8" />}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
