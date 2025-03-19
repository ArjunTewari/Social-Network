"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Edit, Search, User, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

type UserSuggestion = {
  id: string
  username: string
  name: string
  profilePicture: string
  isFollowing: boolean
}

export function NewMessageDialog({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSearch = async (query: string) => {
    setSearchQuery(query)

    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)

      if (!response.ok) {
        throw new Error("Failed to search users")
      }

      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleStartConversation = async (userId: string) => {
    try {
      const response = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error("Failed to create conversation")
      }

      const data = await response.json()

      router.push(`/messages/${data._id}`)
      setOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Couldn't start conversation. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon">
            <Edit className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => {
                setSearchQuery("")
                setSearchResults([])
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="mt-4 max-h-[300px] overflow-y-auto">
          {isSearching ? (
            <div className="flex justify-center py-4">
              <p className="text-muted-foreground">Searching...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-accent transition-colors text-left"
                  onClick={() => handleStartConversation(user.id)}
                >
                  <Avatar>
                    <AvatarImage src={user.profilePicture} alt={user.username} />
                    <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.name}</p>
                  </div>
                  {user.isFollowing && <span className="ml-auto text-xs text-muted-foreground">Following</span>}
                </button>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="flex flex-col items-center justify-center py-8">
              <User className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground">Search for users to message</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

