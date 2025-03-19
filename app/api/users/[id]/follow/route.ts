import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

interface User {
  _id: ObjectId
  following: ObjectId[]
  followers: ObjectId[]
  followingCount: number
  followersCount: number
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const client = await clientPromise
    const db = client.db()
    const users = db.collection<User>("users")

    const targetUserId = new ObjectId(params.id)
    const currentUserId = new ObjectId(session.user.id)

    // Check if target user exists
    const targetUser = await users.findOne({ _id: targetUserId })
    if (!targetUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      )
    }

    // Check if already following
    const isFollowing = await users.findOne({
      _id: currentUserId,
      following: targetUserId,
    })

    if (isFollowing) {
      // Unfollow
      await users.updateOne(
        { _id: currentUserId },
        { 
          $pull: { "following": targetUserId },
          $inc: { followingCount: -1 }
        }
      )
      await users.updateOne(
        { _id: targetUserId },
        { 
          $pull: { "followers": currentUserId },
          $inc: { followersCount: -1 }
        }
      )

      // Create activity
      await db.collection("activities").insertOne({
        userId: currentUserId,
        targetUserId: targetUserId,
        type: "unfollow",
        message: "unfollowed",
        createdAt: new Date(),
      })

      return NextResponse.json({ following: false })
    } else {
      // Follow
      await users.updateOne(
        { _id: currentUserId },
        { 
          $addToSet: { "following": targetUserId },
          $inc: { followingCount: 1 }
        }
      )
      await users.updateOne(
        { _id: targetUserId },
        { 
          $addToSet: { "followers": currentUserId },
          $inc: { followersCount: 1 }
        }
      )

      // Create activity and notification
      await Promise.all([
        db.collection("activities").insertOne({
          userId: currentUserId,
          targetUserId: targetUserId,
          type: "follow",
          message: "started following",
          createdAt: new Date(),
        }),
        db.collection("notifications").insertOne({
          userId: targetUserId,
          actorId: currentUserId,
          type: "follow",
          read: false,
          createdAt: new Date(),
        }),
      ])

      return NextResponse.json({ following: true })
    }
  } catch (error) {
    console.error("Error following/unfollowing user:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
} 