import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { auth } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    const client = await clientPromise
    const db = client.db()

    // Try to find user by ID first, if it fails try username
    let query = {}
    try {
      query = { _id: new ObjectId(params.id) }
    } catch {
      // If ID is invalid, try username
      query = { username: params.id }
    }

    // Fetch user with their posts and follow counts
    const [user] = await db
      .collection("users")
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: "posts",
            let: { userId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$userId", "$$userId"] } } },
              { $sort: { createdAt: -1 } },
              {
                $project: {
                  _id: 1,
                  image: 1,
                  caption: 1,
                  createdAt: 1
                }
              }
            ],
            as: "posts"
          }
        },
        {
          $lookup: {
            from: "follows",
            let: { userId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$followedId", "$$userId"] } } }
            ],
            as: "followers"
          }
        },
        {
          $lookup: {
            from: "follows",
            let: { userId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$followerId", "$$userId"] } } }
            ],
            as: "following"
          }
        },
        {
          $addFields: {
            postsCount: { $size: "$posts" },
            followersCount: { $size: "$followers" },
            followingCount: { $size: "$following" },
            isFollowing: {
              $cond: {
                if: { $eq: [session?.user?.id, null] },
                then: false,
                else: {
                  $in: [
                    new ObjectId(session?.user?.id),
                    "$followers.followerId"
                  ]
                }
              }
            }
          }
        },
        {
          $project: {
            _id: 1,
            username: 1,
            name: 1,
            image: 1,
            bio: 1,
            postsCount: 1,
            followersCount: 1,
            followingCount: 1,
            isFollowing: 1,
            posts: 1,
            createdAt: 1
          }
        }
      ])
      .toArray()

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Ensure image exists
    if (!user.image) {
      user.image = `https://api.dicebear.com/7.x/avatars/svg?seed=${user.username}`
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    )
  }
} 