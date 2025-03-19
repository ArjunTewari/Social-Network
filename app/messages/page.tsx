"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { NewMessageDialog } from "@/components/messages/new-message-dialog"
import type { ConversationWithUser } from "@/lib/models/conversation"
import { useSession } from "next-auth/react"

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const { data: session } = useSession()

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/messages/conversations")

        if (!response.ok) {
          throw new Error("Failed to fetch conversations")
        }

        const data = await response.json()
        setConversations(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load conversations. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()

    // Set up polling for new messages
    const intervalId = setInterval(fetchConversations, 10000) // Poll every 10 seconds

    return () => clearInterval(intervalId)
  }, [toast])

  const filteredConversations = searchQuery
    ? conversations.filter((conversation) =>
        conversation.user.username.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : conversations

  return (
    <div className="container max-w-2xl py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <NewMessageDialog />
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search messages"
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-3 w-3/4" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <Link
              key={conversation._id}
              href={`/messages/${conversation._id}`}
              className={`flex items-center gap-4 p-4 rounded-lg border hover:bg-accent transition-colors ${
                conversation.unreadCount > 0 ? "bg-accent/50" : ""
              }`}
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={conversation.user.profilePicture} alt={conversation.user.username} />
                  <AvatarFallback>{conversation.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                {conversation.user.isOnline && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <p className="font-medium truncate">{conversation.user.username}</p>
                  {conversation.lastMessage && (
                    <p className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(conversation.lastMessage.timestamp), { addSuffix: true })}
                    </p>
                  )}
                </div>
                <div className="flex justify-between items-baseline">
                  {conversation.lastMessage && (
                    <p
                      className={`text-sm truncate ${conversation.unreadCount > 0 ? "font-medium" : "text-muted-foreground"}`}
                    >
                      {conversation.lastMessage.sender === session?.user.id ? "You: " : ""}
                      {conversation.lastMessage.content}
                    </p>
                  )}
                  {conversation.unreadCount > 0 && (
                    <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No conversations found</p>
            <NewMessageDialog>
              <Button>Start a new conversation</Button>
            </NewMessageDialog>
          </div>
        )}
      </div>
    </div>
  )
}

