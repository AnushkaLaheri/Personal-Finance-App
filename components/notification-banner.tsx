"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type NotificationBannerProps = {
  children: React.ReactNode
  onDismiss: () => void
  className?: string
}

export function NotificationBanner({ children, onDismiss, className }: NotificationBannerProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(onDismiss, 300) // Wait for animation to complete
  }

  return (
    <Alert
      className={cn(
        "transition-all duration-300 ease-in-out border-l-4 border-primary",
        isVisible ? "opacity-100 transform translate-y-0" : "opacity-0 transform -translate-y-4",
        className,
      )}
    >
      <AlertDescription className="flex items-center justify-between">
        <span>{children}</span>
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleDismiss}>
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
