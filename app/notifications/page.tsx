"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Home, Search, Bell, PlusSquare, User, MessageSquare } from "lucide-react"

interface Notification {
  _id: string
  type: string
  read: boolean
  createdAt: string
  actor: {
    _id: string
    name: string
    username: string
    image: string
  }
  post?: {
    _id: string
    image: string
  }
}

function NotificationSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b p-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const response = await fetch("/api/notifications")
        if (!response.ok) throw new Error("Failed to fetch notifications")
        const data = await response.json()
        setNotifications(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load notifications",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [toast])

  if (!session) {
    return null
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
            <Button variant="default" size="lg" className="w-full justify-start gap-2">
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
        <h1 className="mb-6 text-2xl font-bold">Notifications</h1>
        <div className="divide-y rounded-lg border">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <NotificationSkeleton key={i} />
            ))
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={`flex items-start gap-4 p-4 ${
                  !notification.read ? "bg-muted/50" : ""
                }`}
              >
                <Avatar>
                  <AvatarImage src={notification.actor.image} alt={notification.actor.name} />
                  <AvatarFallback>{notification.actor.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm">
                    <Link
                      href={`/profile/${notification.actor._id}`}
                      className="font-semibold hover:underline"
                    >
                      {notification.actor.name}
                    </Link>{" "}
                    {notification.type === "follow"
                      ? "started following you"
                      : notification.type === "like"
                      ? "liked your post"
                      : "commented on your post"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {notification.post && (
                  <Link
                    href={`/posts/${notification.post._id}`}
                    className="shrink-0"
                  >
                    <img
                      src={notification.post.image}
                      alt="Post"
                      className="h-14 w-14 rounded-md object-cover"
                    />
                  </Link>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No notifications yet
            </div>
          )}
        </div>
      </main>

      {/* Right sidebar - could be used for suggestions, trending topics, etc. */}
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 lg:block">
        <div className="flex h-full flex-col gap-4 py-6 pl-4">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-4 font-semibold">Suggested for you</h2>
            <p className="text-sm text-muted-foreground">No suggestions available</p>
          </div>
        </div>
      </aside>
    </div>
  )
}

