"use client"

import {useEffect, useRef, useState} from "react"
import {useMutation} from "@tanstack/react-query"
import {Camera, Check, RotateCcw, SwitchCamera, X} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Spinner} from "@/components/ui/spinner"
import {CameraDeviceSelector} from "@/components/camera-device-selector"
import {useRouter} from "next/navigation"
import {toast} from "sonner"
import {analyzeItem, createItem} from "@/lib/api"
import {useLocalStorage} from "@/lib/hooks/use-local-storage";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void
  onCancel: () => void
  boxId?: string
}

export function CameraCapture({onCapture, onCancel, boxId}: CameraCaptureProps) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [showDeviceSelector, setShowDeviceSelector] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)
  const activeDeviceIdRef = useRef<string | null>(null)
  const [preferredDeviceId, setPreferredDeviceId] = useLocalStorage('preferred-device')

  const analyzeFastMutation = useMutation({
    mutationFn: (image: string) => analyzeItem(image, "fast"),
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
  }

  useEffect(() => {
    void (async () => {
      const started = await startCamera(preferredDeviceId)
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
      console.error("Media devices API unavailable")
      setError("Camera is not available in this environment.")
      return []
    }

    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = allDevices.filter((device) => device.kind === "videoinput")
      setDevices(videoDevices)

      if (!videoDevices.length) {
        setError("No camera devices detected.")
      }
      return videoDevices
    } catch (err) {
      console.error("Error enumerating devices:", err)
      setError("Unable to access camera devices.")
      return []
    }
  }

  const startCamera = async (deviceId: string | null): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Camera is not available in this environment.")
      return false
    }

    try {
      stopActiveStream()

      const sizeConstraints = {
        width: {min: 1024, ideal: 1920, max: 1920},
        height: {min: 576, ideal: 1080, max: 1080},
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId ? {...sizeConstraints, deviceId: {exact: deviceId}} : {
          ...sizeConstraints,
          facingMode: {ideal: "environment"}
        },
        audio: false,
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = mediaStream
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setError(null)

      const [videoTrack] = mediaStream.getVideoTracks()
      const resolvedDeviceId = videoTrack?.getSettings().deviceId ?? deviceId ?? null
      activeDeviceIdRef.current = resolvedDeviceId
      if (resolvedDeviceId) {
        setPreferredDeviceId(resolvedDeviceId)
      }

      if (!devices.length) {
        void enumerateDevices()
      }

      return true
    } catch (err) {
      console.error("Camera access error:", err)
      if (deviceId) {
        console.warn("Falling back to default camera")
        return startCamera(null)
      }
      setError("Unable to access camera. Please check permissions.")
      return false
    }
  }

  const handleDeviceSelect = (deviceId: string) => {
    setPreferredDeviceId(deviceId)
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
    if (preferredDeviceId) {
      void (async () => {
        const restarted = await startCamera(preferredDeviceId)
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
    if (!capturedImage || !boxId || isProcessing) return

    setIsProcessing(true)
    try {
      const analysis = await analyzeFastMutation.mutateAsync(capturedImage)

      await createItemMutation.mutateAsync({
        boxId,
        name: analysis?.name || "Unknown Item",
        description: analysis?.description || "",
        quantity: analysis?.quantity ?? 1,
        image: capturedImage,
      })

      onCapture(capturedImage)
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
          image: capturedImage,
        })
        toast.error("Fast AI analysis failed. Please edit item details manually.")
        onCapture(capturedImage)
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

  if (showDeviceSelector) {
    return <CameraDeviceSelector devices={devices} onSelectDevice={handleDeviceSelect} onCancel={onCancel}/>
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
            <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover"/>
            <div className="absolute inset-0 flex flex-col">
              <div className="flex justify-between p-4">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onCancel}
                  className="h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
                >
                  <X className="h-6 w-6"/>
                </Button>
                {devices.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleSwitchCamera}
                    className="h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
                  >
                    <SwitchCamera className="h-6 w-6"/>
                  </Button>
                )}
              </div>
              <div className="flex-1"/>
              <div className="flex justify-center pb-8">
                <Button
                  size="icon"
                  onClick={capturePhoto}
                  className="h-20 w-20 rounded-full bg-white hover:bg-gray-200"
                >
                  <Camera className="h-8 w-8 text-black"/>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <img src={capturedImage || "/placeholder.svg"} alt="Captured"
                 className="h-full w-full object-cover"/>
            <div className="absolute inset-0 flex flex-col">
              <div className="flex-1"/>
              <div className="flex justify-center gap-4 pb-8">
                <Button
                  size="icon"
                  onClick={retake}
                  disabled={isProcessing}
                  className="h-16 w-16 rounded-full bg-white/90 hover:bg-white"
                >
                  <RotateCcw className="h-6 w-6 text-black"/>
                </Button>
                <Button
                  size="icon"
                  onClick={confirm}
                  disabled={isProcessing || !boxId}
                  className="h-20 w-20 rounded-full bg-primary hover:bg-primary/90"
                >
                  {isProcessing ? <Spinner className="h-8 w-8"/> : <Check className="h-8 w-8"/>}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden"/>
    </div>
  )
}
