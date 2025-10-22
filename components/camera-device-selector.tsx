"use client"

import { Camera, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface CameraDeviceSelectorProps {
  devices: MediaDeviceInfo[]
  onSelectDevice: (deviceId: string) => void
  onCancel: () => void
}

export function CameraDeviceSelector({ devices, onSelectDevice, onCancel }: CameraDeviceSelectorProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-white">Select Camera</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={onCancel}
            className="h-10 w-10 rounded-full text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="space-y-3">
          {devices.map((device, index) => (
            <Card
              key={device.deviceId}
              className="p-4 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => onSelectDevice(device.deviceId)}
            >
              <div className="flex items-center gap-3">
                <Camera className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{device.label || `Camera ${index + 1}`}</p>
                  <p className="text-sm text-muted-foreground">{device.deviceId.slice(0, 20)}...</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
