import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { auth } from "@/lib/auth"
import { z } from "zod"

// GET posts
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()

    const posts = await db
      .collection("posts")
      .aggregate([
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $lookup: {
            from: "likes",
            let: { postId: "$_id" },
            pipeline: [
              { 
                $match: { 
                  $expr: { 
                    $eq: ["$postId", { $toObjectId: "$$postId" }] 
                  } 
                } 
              },
            ],
            as: "likes",
          },
        },
        {
          $lookup: {
            from: "comments",
            let: { postId: "$_id" },
            pipeline: [
              { 
                $match: { 
                  $expr: { 
                    $eq: ["$postId", { $toObjectId: "$$postId" }] 
                  } 
                } 
              },
            ],
            as: "comments",
          },
        },
        {
          $addFields: {
            likesCount: { $size: "$likes" },
            commentsCount: { $size: "$comments" },
            isLiked: {
              $in: [new ObjectId(session.user.id), "$likes.userId"],
            },
          },
        },
        {
          $project: {
            _id: 1,
            content: 1,
            image: 1,
            createdAt: 1,
            likesCount: 1,
            commentsCount: 1,
            isLiked: 1,
            user: {
              _id: 1,
              name: 1,
              username: 1,
              image: 1,
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ])
      .toArray()

    return NextResponse.json(posts)
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    )
  }
}

const createPostSchema = z.object({
  image: z.string().url(),
  caption: z.string().max(2200).optional(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const json = await req.json()
    const body = createPostSchema.parse(json)

    const client = await clientPromise
    const db = client.db()

    // Create post
    const result = await db.collection("posts").insertOne({
      userId: new ObjectId(session.user.id),
      image: body.image,
      caption: body.caption,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Increment user's post count
    await db.collection("users").updateOne(
      { _id: new ObjectId(session.user.id) },
      { $inc: { postsCount: 1 } }
    )

    // Create activity
    await db.collection("activities").insertOne({
      userId: new ObjectId(session.user.id),
      type: "post",
      postId: result.insertedId,
      message: "created a new post",
      createdAt: new Date(),
    })

    return NextResponse.json({
      _id: result.insertedId,
      ...body,
    })
  } catch (error) {
    console.error("Error creating post:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    )
  }
} 