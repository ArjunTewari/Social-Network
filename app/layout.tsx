import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/layout/navbar"
import { Providers } from "@/components/providers"
import { auth } from "@/lib/auth"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Photogram - Share your moments",
  description: "A social media platform for sharing photos and connecting with friends",
  generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers session={session}>
          <Navbar />
          <main className="min-h-screen bg-background">{children}</main>
        </Providers>
      </body>
    </html>
  )
}



import './globals.css'