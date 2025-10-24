"use client"

import { useState, type ComponentProps } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"

interface LogoutButtonProps {
  variant?: ComponentProps<typeof Button>["variant"]
  size?: ComponentProps<typeof Button>["size"]
  className?: string
}

export function LogoutButton({ variant = "outline", size = "sm", className }: LogoutButtonProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const handleSignOut = async () => {
    setIsPending(true)
    try {
      const result = await authClient.signOut()
      if (result?.error) {
        const message = result.error.message ?? "Failed to sign out"
        toast.error(message)
        return
      }

      toast.success("Signed out")
      router.replace("/login")
      router.refresh()
    } catch (error) {
      console.error("Error signing out:", error)
      toast.error("Failed to sign out")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={handleSignOut} disabled={isPending}>
      {isPending ? "Signing out..." : "Sign out"}
    </Button>
  )
}
