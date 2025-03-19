"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

type Post = {
  id: string
  image: string
  user: {
    id: string
    username: string
  }
}

export default function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // In a real app, this would be an API call to your backend
        // const response = await fetch('/api/posts/explore')
        // const data = await response.json()

        // For demo purposes, we'll use mock data
        setTimeout(() => {
          const mockPosts = Array.from({ length: 12 }, (_, i) => ({
            id: `post${i + 1}`,
            image: `/placeholder.svg?height=${300 + (i % 3) * 50}&width=${300 + (i % 3) * 50}`,
            user: {
              id: `user${(i % 3) + 1}`,
              username: ["johndoe", "janedoe", "alexsmith"][i % 3],
            },
          }))

          setPosts(mockPosts)
          setLoading(false)
        }, 1500)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load posts. Please try again later.",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    fetchPosts()
  }, [toast])

  const filteredPosts = searchQuery
    ? posts.filter((post) => post.user.username.toLowerCase().includes(searchQuery.toLowerCase()))
    : posts

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users or hashtags"
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      ) : filteredPosts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
          {filteredPosts.map((post) => (
            <Link key={post.id} href={`/post/${post.id}`} className="relative aspect-square group">
              <Image src={post.image || "/placeholder.svg"} alt="" fill className="object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="text-white text-sm font-medium">@{post.user.username}</div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No results found</p>
        </div>
      )}
    </div>
  )
}

