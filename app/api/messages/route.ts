import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { auth } from "@/lib/auth"
import type { Message } from "@/lib/models/message"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conversationId, content, mediaUrl } = await request.json()

    if (!conversationId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    // Check if conversation exists and user is a participant
    const conversation = await db.collection("conversations").findOne({
      _id: new ObjectId(conversationId),
      "participants.userId": new ObjectId(session.user.id),
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Create new message
    const message: Message = {
      conversationId: new ObjectId(conversationId),
      sender: new ObjectId(session.user.id),
      content,
      timestamp: new Date(),
      status: "sent",
      ...(mediaUrl && { mediaUrl }),
    }

    const result = await db.collection("messages").insertOne(message)

    // Update conversation with last message
    await db.collection("conversations").updateOne(
      { _id: new ObjectId(conversationId) },
      {
        $set: {
          lastMessage: {
            content,
            sender: new ObjectId(session.user.id),
            timestamp: new Date(),
          },
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({
      _id: result.insertedId,
      ...message,
    })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}

