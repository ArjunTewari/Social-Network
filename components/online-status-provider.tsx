"use client"

import type React from "react"
import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSession } from "next-auth/react"

export function OnlineStatusProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [isOnline, setIsOnline] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const lastUpdateRef = useRef<number>(Date.now())

  const setOnlineStatus = useCallback(async (status: boolean) => {
    if (!session?.user?.id) return;
    
    // Prevent too frequent updates (minimum 5 seconds between updates)
    const now = Date.now()
    if (now - lastUpdateRef.current < 5000) return;
    lastUpdateRef.current = now;

    try {
      const response = await fetch("/api/users/online", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        console.warn("Failed to update online status:", await response.text())
      }
    } catch (error) {
      console.warn("Error updating online status:", error)
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (!session || status !== "authenticated") return;

    // Set initial online status
    setIsOnline(true)
    const initialUpdate = setOnlineStatus(true)

    // Handle visibility change
    const handleVisibilityChange = () => {
      const newStatus = document.visibilityState === "visible"
      setIsOnline(newStatus)
      setOnlineStatus(newStatus)
    }

    // Handle page unload
    const handleBeforeUnload = () => {
      setOnlineStatus(false)
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("beforeunload", handleBeforeUnload)

    // Periodic update (every 30 seconds if the page is visible)
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        setOnlineStatus(true)
      }
    }, 30000)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      clearInterval(intervalId)
      setOnlineStatus(false)
    }
  }, [session, status, setOnlineStatus])

  return children
}

