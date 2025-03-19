import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { ObjectId, ClientSession } from "mongodb"
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
    const authSession = await auth()
    if (!authSession?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const targetUserId = new ObjectId(params.id)
    const currentUserId = new ObjectId(authSession.user.id)

    // Prevent following yourself
    if (targetUserId.equals(currentUserId)) {
      return NextResponse.json(
        { message: "Cannot follow yourself" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db()

    // Use a transaction to ensure data consistency
    const mongoSession: ClientSession = client.startSession()
    
    try {
      let result: { following: boolean }

      await mongoSession.withTransaction(async () => {
        const users = db.collection<User>("users")

        // Check if target user exists
        const targetUser = await users.findOne(
          { _id: targetUserId },
          { session: mongoSession }
        )
        if (!targetUser) {
          throw new Error("User not found")
        }

        // Check if already following using an index
        const isFollowing = await users.findOne(
          {
            _id: currentUserId,
            following: targetUserId,
          },
          { 
            projection: { _id: 1 },
            session: mongoSession
          }
        )

        if (isFollowing) {
          // Unfollow - use a single atomic operation
          await users.updateOne(
            { _id: currentUserId },
            { 
              $pull: { following: targetUserId },
              $inc: { followingCount: -1 }
            },
            { session: mongoSession }
          )

          await users.updateOne(
            { _id: targetUserId },
            { 
              $pull: { followers: currentUserId },
              $inc: { followersCount: -1 }
            },
            { session: mongoSession }
          )

          // Create activity
          await db.collection("activities").insertOne({
            userId: currentUserId,
            targetUserId: targetUserId,
            type: "unfollow",
            message: "unfollowed",
            createdAt: new Date(),
          }, { session: mongoSession })

          result = { following: false }
        } else {
          // Follow - use a single atomic operation
          await users.updateOne(
            { _id: currentUserId },
            { 
              $addToSet: { following: targetUserId },
              $inc: { followingCount: 1 }
            },
            { session: mongoSession }
          )

          await users.updateOne(
            { _id: targetUserId },
            { 
              $addToSet: { followers: currentUserId },
              $inc: { followersCount: 1 }
            },
            { session: mongoSession }
          )

          // Create activity and notification in parallel
          await Promise.all([
            db.collection("activities").insertOne({
              userId: currentUserId,
              targetUserId: targetUserId,
              type: "follow",
              message: "started following",
              createdAt: new Date(),
            }, { session: mongoSession }),
            db.collection("notifications").insertOne({
              userId: targetUserId,
              actorId: currentUserId,
              type: "follow",
              read: false,
              createdAt: new Date(),
            }, { session: mongoSession })
          ])

          result = { following: true }
        }
      })

      await mongoSession.commitTransaction()
      return NextResponse.json(result!)
    } catch (error) {
      await mongoSession.abortTransaction()
      throw error
    } finally {
      await mongoSession.endSession()
    }
  } catch (error) {
    console.error("Error following/unfollowing user:", error)
    
    if (error instanceof Error && error.message === "User not found") {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
} 