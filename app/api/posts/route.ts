import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { auth } from "@/lib/auth"

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
              { $match: { $expr: { $eq: ["$postId", "$$postId"] } } },
            ],
            as: "likes",
          },
        },
        {
          $lookup: {
            from: "comments",
            let: { postId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$postId", "$$postId"] } } },
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

// Create post
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content, image } = await req.json()

    if (!content && !image) {
      return NextResponse.json(
        { error: "Content or image is required" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db()

    // Create post
    const result = await db.collection("posts").insertOne({
      userId: new ObjectId(session.user.id),
      content,
      image,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Increment user's post count
    await db.collection("users").updateOne(
      { _id: new ObjectId(session.user.id) },
      { $inc: { postsCount: 1 } }
    )

    // Fetch the created post with user details
    const [post] = await db
      .collection("posts")
      .aggregate([
        { $match: { _id: result.insertedId } },
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
          $project: {
            _id: 1,
            content: 1,
            image: 1,
            createdAt: 1,
            likesCount: 0,
            commentsCount: 0,
            isLiked: false,
            user: {
              _id: 1,
              name: 1,
              username: 1,
              image: 1,
            },
          },
        },
      ])
      .toArray()

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    )
  }
} 