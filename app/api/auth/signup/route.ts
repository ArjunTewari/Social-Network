import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { z } from "zod"
import clientPromise from "@/lib/mongodb"

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const body = signUpSchema.parse(json)

    const client = await clientPromise
    const db = client.db()
    const users = db.collection("users")

    // Check if email already exists
    const existingUserByEmail = await users.findOne({ email: body.email })
    if (existingUserByEmail) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingUserByUsername = await users.findOne({ username: body.username })
    if (existingUserByUsername) {
      return NextResponse.json(
        { message: "Username already exists" },
        { status: 400 }
      )
    }

    // Hash the password
    const hashedPassword = await hash(body.password, 12)

    // Generate a unique username if not provided
    const finalUsername = body.username || generateUniqueUsername(body.name)

    // Create the user with initialized stats and profile
    const result = await users.insertOne({
      name: body.name,
      email: body.email,
      username: finalUsername,
      password: hashedPassword,
      image: `https://api.dicebear.com/7.x/avatars/svg?seed=${finalUsername}`,
      bio: `Hi, I'm ${body.name}! 👋`,
      website: "",
      location: "",
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
      posts: [],
      followers: [],
      following: [],
      savedPosts: [],
      notifications: {
        likes: true,
        comments: true,
        follows: true,
        messages: true
      },
      privacy: {
        isPrivate: false,
        showActivity: true
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Create initial activity
    await db.collection("activities").insertOne({
      userId: result.insertedId,
      type: "join",
      message: "joined the platform",
      createdAt: new Date()
    })

    return NextResponse.json(
      {
        message: "User created successfully",
        userId: result.insertedId,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Error creating user:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

function generateUniqueUsername(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 15)
  return `${base}${Math.floor(Math.random() * 1000)}`
} 