"use client"

import { useEffect, useState } from "react"
import { notFound, useParams } from "next/navigation"
import Image from "next/image"
import { useSession } from "next-auth/react"
import useSWR, { Fetcher } from "swr"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Grid, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Sidebar } from "@/components/Sidebar"

interface Post {
  _id: string
  image: string
  caption?: string
}

interface Profile {
  _id: string
  username: string
  name: string
  image: string
  bio?: string
  postsCount: number
  followersCount: number
  followingCount: number
  isFollowing?: boolean
  posts: Post[]
}

const fetcher: Fetcher<Profile, string> = async (url) => {
  const res = await fetch(url)
  if (!res.ok) {
    if (res.status === 404) notFound()
    throw new Error("Failed to fetch profile")
  }
  return res.json()
}

function ProfileSkeleton() {
  return (
    <div className="container flex gap-6">
      <Sidebar />
      <main className="flex-1">
        <div className="py-6">
          <div className="mb-8 flex items-start space-x-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="flex space-x-6">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full" />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function ProfilePage() {
  const params = useParams()
  const userId = params?.id as string
  const { data: session } = useSession()
  const { toast } = useToast()
  const { data: profile, error, mutate } = useSWR<Profile>(
    session && userId ? `/api/users/${userId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  )

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      })
    }
  }, [error, toast])

  const handleFollow = async () => {
    if (!session || !profile) return

    // Optimistic update
    const isFollowing = profile.isFollowing
    const optimisticProfile = {
      ...profile,
      followersCount: isFollowing ? profile.followersCount - 1 : profile.followersCount + 1,
      isFollowing: !isFollowing
    }
    
    try {
      await mutate(optimisticProfile, false) // Update UI immediately
      const response = await fetch(`/api/users/${profile._id}/follow`, {
        method: "POST",
      })
      
      if (!response.ok) {
        throw new Error("Failed to follow user")
      }

      const data = await response.json()
      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: isFollowing ? `You unfollowed ${profile.name}` : `You are now following ${profile.name}`,
      })
      
      // Revalidate the data
      mutate()
    } catch (error) {
      // Revert optimistic update on error
      await mutate() // Revalidate to get the correct state
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      })
    }
  }

  if (error || !profile) {
    return <ProfileSkeleton />
  }

  const isOwnProfile = session?.user?.id === profile._id

  return (
    <div className="container flex gap-6">
      <Sidebar />
      
      <main className="flex-1">
        <div className="py-6">
          <div className="mb-8 flex items-start justify-between">
            <div className="flex items-start space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.image} alt={profile.name} />
                <AvatarFallback>{profile.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="mb-4 flex items-center space-x-4">
                  <h1 className="text-2xl font-bold">{profile.name}</h1>
                  <p className="text-muted-foreground">@{profile.username}</p>
                  {isOwnProfile ? (
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  ) : (
                    <Button 
                      variant={profile.isFollowing ? "outline" : "default"} 
                      size="sm"
                      onClick={handleFollow}
                      className="min-w-[100px] transition-all duration-200"
                    >
                      {profile.isFollowing ? "Following" : "Follow"}
                    </Button>
                  )}
                </div>
                <div className="mb-4 flex space-x-6 text-sm">
                  <span>
                    <strong>{profile.postsCount}</strong> posts
                  </span>
                  <button className="hover:underline">
                    <strong>{profile.followersCount}</strong> followers
                  </button>
                  <button className="hover:underline">
                    <strong>{profile.followingCount}</strong> following
                  </button>
                </div>
                {profile.bio && <p className="text-sm">{profile.bio}</p>}
              </div>
            </div>
          </div>

          <Tabs defaultValue="posts" className="space-y-6">
            <TabsList className="justify-start">
              <TabsTrigger value="posts" className="flex items-center gap-2">
                <Grid className="h-4 w-4" />
                Posts
              </TabsTrigger>
            </TabsList>
            <TabsContent value="posts">
              {profile.posts.length > 0 ? (
                <div className="grid grid-cols-3 gap-1 md:gap-8">
                  {profile.posts.map((post) => (
                    <div
                      key={post._id}
                      className="group relative aspect-square cursor-pointer overflow-hidden rounded-md"
                    >
                      <Image
                        src={post.image}
                        alt={post.caption || "Post image"}
                        fill
                        sizes="(max-width: 768px) 33vw, (max-width: 1200px) 33vw"
                        loading="lazy"
                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground">No posts yet</div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

