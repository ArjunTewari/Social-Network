"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSession } from "next-auth/react"

export function OnlineStatusProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [isOnline, setIsOnline] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!session || status !== "authenticated") {
      return // Don't track online status for unauthenticated users
    }

    const setOnlineStatus = async (status: boolean) => {
      try {
        const response = await fetch("/api/users/online", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        })

        if (!response.ok) {
          throw new Error("Failed to update online status")
        }
      } catch (error) {
        // Silently handle the error - don't break the app for online status failures
        console.warn("Error updating online status:", error)
      }
    }

    // Set initial online status
    setIsOnline(true)
    setOnlineStatus(true)

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

    // Periodic update (every minute)
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        setOnlineStatus(true)
      }
    }, 60000)

    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      clearInterval(intervalId)
      if (session) {
        setOnlineStatus(false)
      }
    }
  }, [session, status])

  return <>{children}</>
}

