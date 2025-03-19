"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Heart, MessageCircle, Share } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

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

interface PostProps {
  post: Post
}

export function Post({ post }: PostProps) {
  const [isLiked, setIsLiked] = useState(post.liked)
  const [likesCount, setLikesCount] = useState(post.likes)
  const { toast } = useToast()

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/posts/${post._id}/like`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to like post")
      }

      setIsLiked(!isLiked)
      setLikesCount(isLiked ? likesCount - 1 : likesCount + 1)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to like post. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <article className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-4">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={post.user.image} alt={post.user.name} />
            <AvatarFallback>{post.user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <Link
              href={`/profile/${post.user.username}`}
              className="font-semibold hover:underline"
            >
              {post.user.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <p className="mt-4">{post.content}</p>
        {post.image && (
          <img
            src={post.image}
            alt="Post"
            className="mt-4 rounded-lg border object-cover"
            style={{ width: "100%", aspectRatio: "4/3" }}
          />
        )}
        <div className="mt-4 flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLike}
            className={isLiked ? "text-red-500" : ""}
          >
            <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
            <span className="ml-2">{likesCount}</span>
          </Button>
          <Button variant="ghost" size="icon">
            <MessageCircle className="h-5 w-5" />
            <span className="ml-2">{post.comments}</span>
          </Button>
          <Button variant="ghost" size="icon">
            <Share className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </article>
  )
}

