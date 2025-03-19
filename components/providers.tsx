"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { OnlineStatusProvider } from "@/components/online-status-provider"
import { SessionProvider } from "next-auth/react"
import { Toaster } from "@/components/ui/toaster"
import type { Session } from "next-auth"

interface ProvidersProps {
  children: React.ReactNode
  session: Session | null
}

export function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <OnlineStatusProvider>
          {children}
          <Toaster />
        </OnlineStatusProvider>
      </ThemeProvider>
    </SessionProvider>
  )
} 