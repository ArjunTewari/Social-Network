"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ArrowLeft, Info, ImageIcon, Send, Check, CheckCheck } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import type { MessageWithUser } from "@/lib/models/message"
import { useSession } from "next-auth/react"

type ConversationData = {
  _id: string
  user: {
    _id: string
    username: string
    profilePicture: string
    isOnline: boolean
    lastActive?: Date
  }
  messages: MessageWithUser[]
}

export default function ConversationPage({ params }: { params: { id: string } }) {
  const [conversation, setConversation] = useState<ConversationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [messageText, setMessageText] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/messages/conversations/${params.id}`)

        if (!response.ok) {
          if (response.status === 404) {
            router.push("/messages")
            return
          }
          throw new Error("Failed to fetch conversation")
        }

        const data = await response.json()
        setConversation(data)

        // Mark messages as read
        await fetch(`/api/messages/conversations/${params.id}/read`, {
          method: "POST",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load conversation. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchConversation()

    // Set up polling for new messages
    const intervalId = setInterval(fetchConversation, 5000) // Poll every 5 seconds

    return () => clearInterval(intervalId)
  }, [params.id, router, toast])

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [conversation?.messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!messageText.trim() || !conversation) return

    setSending(true)

    try {
      const response = await fetch(`/api/messages/conversations/${params.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: messageText }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const newMessage = await response.json()

      setConversation((prev) => {
        if (!prev) return prev

        return {
          ...prev,
          messages: [...prev.messages, newMessage],
        }
      })

      setMessageText("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Check className="h-3 w-3" />
      case "delivered":
        return <CheckCheck className="h-3 w-3" />
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" size="icon" className="mr-2 md:hidden" onClick={() => router.push("/messages")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {loading ? (
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
        ) : conversation ? (
          <Link href={`/profile/${conversation.user._id}`} className="flex items-center gap-3 flex-1">
            <div className="relative">
              <Avatar>
                <AvatarImage src={conversation.user.profilePicture} alt={conversation.user.username} />
                <AvatarFallback>{conversation.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              {conversation.user.isOnline && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>
              )}
            </div>
            <div>
              <p className="font-medium">{conversation.user.username}</p>
              <p className="text-xs text-muted-foreground">
                {conversation.user.isOnline
                  ? "Active now"
                  : conversation.user.lastActive
                    ? `Active ${formatDistanceToNow(new Date(conversation.user.lastActive), { addSuffix: true })}`
                    : "Offline"}
              </p>
            </div>
          </Link>
        ) : null}

        <Button variant="ghost" size="icon">
          <Info className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[70%] ${i % 2 === 0 ? "bg-accent" : "bg-primary text-primary-foreground"} rounded-2xl p-3`}
              >
                <Skeleton className={`h-4 w-${20 + i * 10}`} />
              </div>
            </div>
          ))
        ) : conversation?.messages.length ? (
          conversation.messages.map((message) => (
            <div
              key={message._id}
              className={`flex ${message.sender === session?.user.id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl p-3 ${
                  message.sender === session?.user.id ? "bg-primary text-primary-foreground" : "bg-accent"
                }`}
              >
                <p>{message.content}</p>
                <div className="flex justify-end items-center gap-1 mt-1">
                  <span className="text-xs opacity-70">
                    {formatDistanceToNow(new Date(message.timestamp), { addSuffix: false })}
                  </span>
                  {message.sender === session?.user.id && (
                    <span className="text-xs opacity-70">{getMessageStatusIcon(message.status)}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No messages yet</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" className="shrink-0">
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Input
            placeholder="Message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="flex-1"
            disabled={loading || sending}
          />
          <Button type="submit" size="icon" disabled={!messageText.trim() || loading || sending} className="shrink-0">
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}

