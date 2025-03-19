"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { Post } from "@/components/post"
import { Skeleton } from "@/components/ui/skeleton"

interface Post {
  _id: string
  content: string
  image: string
  createdAt: string
  likes: number
  comments: number
  liked: boolean
  user: {
    _id: string
    username: string
    name: string
    image: string
  }
}

export function Feed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()
  const { toast } = useToast()

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch("/api/posts")
        if (!response.ok) {
          throw new Error("Failed to fetch posts")
        }
        const data = await response.json()
        setPosts(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load posts. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [toast])

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-4 space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </div>
              <Skeleton className="h-[300px] w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold">No posts yet</h2>
        <p className="text-muted-foreground mt-2">Be the first to share a moment!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <Post key={post._id} post={post} />
      ))}
    </div>
  )
}

