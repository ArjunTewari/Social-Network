import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()

    // Fetch notifications with user details
    const notifications = await db
      .collection("notifications")
      .aggregate([
        {
          $match: {
            userId: new ObjectId(session.user.id),
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $limit: 50,
        },
        {
          $lookup: {
            from: "users",
            localField: "actorId",
            foreignField: "_id",
            as: "actor",
          },
        },
        {
          $unwind: "$actor",
        },
        {
          $project: {
            _id: 1,
            type: 1,
            read: 1,
            createdAt: 1,
            postId: 1,
            actor: {
              _id: 1,
              name: 1,
              username: 1,
              image: 1,
            },
          },
        },
      ])
      .toArray()

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
} 