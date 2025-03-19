"use client"

import { useSession } from "next-auth/react"
import { Feed } from "@/components/feed"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Home, Search, Bell, PlusSquare, User, MessageSquare } from "lucide-react"

export default function HomePage() {
  const { data: session } = useSession()

  if (!session) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Welcome to Sugar</h1>
          <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
            Share your moments
          </p>
        </div>
        <div className="space-x-4">
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container flex gap-6">
      {/* Sidebar */}
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 border-r lg:block">
        <div className="flex h-full flex-col gap-2 py-6 pr-4">
          <Link href="/">
            <Button variant="ghost" size="lg" className="w-full justify-start gap-2">
              <Home className="h-5 w-5" />
              Home
            </Button>
          </Link>
          <Link href="/explore">
            <Button variant="ghost" size="lg" className="w-full justify-start gap-2">
              <Search className="h-5 w-5" />
              Explore
            </Button>
          </Link>
          <Link href="/messages">
            <Button variant="ghost" size="lg" className="w-full justify-start gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages
            </Button>
          </Link>
          <Link href="/notifications">
            <Button variant="ghost" size="lg" className="w-full justify-start gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </Button>
          </Link>
          <Link href="/create">
            <Button variant="ghost" size="lg" className="w-full justify-start gap-2">
              <PlusSquare className="h-5 w-5" />
              Create
            </Button>
          </Link>
          <Link href={`/profile/${session.user.id}`}>
            <Button variant="ghost" size="lg" className="w-full justify-start gap-2">
              <User className="h-5 w-5" />
              Profile
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 py-6">
        <Feed />
      </main>

      {/* Right sidebar - could be used for suggestions, trending topics, etc. */}
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 lg:block">
        <div className="flex h-full flex-col gap-4 py-6 pl-4">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-4 font-semibold">Suggested for you</h2>
            {/* Add suggested users/content here */}
            <p className="text-sm text-muted-foreground">No suggestions available</p>
          </div>
        </div>
      </aside>
    </div>
  )
}

