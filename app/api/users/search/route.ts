import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchQuery = request.nextUrl.searchParams.get("q")

    if (!searchQuery) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    // Search for users by username or name
    const users = await db
      .collection("users")
      .find({
        $and: [
          { _id: { $ne: new ObjectId(session.user.id) } }, // Exclude current user
          {
            $or: [
              { username: { $regex: searchQuery, $options: "i" } },
              { name: { $regex: searchQuery, $options: "i" } },
            ],
          },
        ],
      })
      .limit(10)
      .toArray()

    // Check if current user is following each user
    const currentUser = await db.collection("users").findOne({
      _id: new ObjectId(session.user.id),
    })

    const usersWithFollowStatus = users.map((user) => {
      const isFollowing = currentUser?.following?.some((id: ObjectId) => id.toString() === user._id.toString()) || false

      return {
        id: user._id.toString(),
        username: user.username,
        name: user.name,
        profilePicture: user.profilePicture || "/placeholder.svg?height=40&width=40",
        isFollowing,
      }
    })

    return NextResponse.json(usersWithFollowStatus)
  } catch (error) {
    console.error("Error searching users:", error)
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 })
  }
}

