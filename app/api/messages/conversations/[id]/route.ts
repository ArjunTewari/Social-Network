import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { auth } from "@/lib/auth"
import type { MessageWithUser } from "@/lib/models/message"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conversationId = params.id

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

    // Get the other participant
    const otherParticipant = conversation.participants.find((p: any) => p.userId.toString() !== session.user.id)

    if (!otherParticipant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 })
    }

    // Get user details
    const user = await db.collection("users").findOne({
      _id: new ObjectId(otherParticipant.userId),
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get messages
    const messages = await db
      .collection("messages")
      .find({ conversationId: new ObjectId(conversationId) })
      .sort({ timestamp: 1 })
      .toArray()

    // Update last read timestamp for current user
    await db.collection("conversations").updateOne(
      {
        _id: new ObjectId(conversationId),
        "participants.userId": new ObjectId(session.user.id),
      },
      { $set: { "participants.$.lastRead": new Date() } },
    )

    // Get user details for each message
    const messagesWithUsers: MessageWithUser[] = await Promise.all(
      messages.map(async (message) => {
        const sender = message.sender.toString() === session.user.id ? session.user : user

        return {
          ...message,
          _id: message._id.toString(),
          conversationId: message.conversationId.toString(),
          sender: message.sender.toString(),
          senderDetails: {
            _id: sender._id || sender.id,
            username: sender.username,
            profilePicture: sender.profilePicture || sender.image || "/placeholder.svg?height=40&width=40",
          },
        }
      }),
    )

    return NextResponse.json({
      _id: conversation._id.toString(),
      user: {
        _id: user._id.toString(),
        username: user.username,
        profilePicture: user.profilePicture || "/placeholder.svg?height=40&width=40",
        isOnline: user.isOnline || false,
        lastActive: user.lastActive,
      },
      messages: messagesWithUsers,
    })
  } catch (error) {
    console.error("Error fetching conversation:", error)
    return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conversationId = params.id
    const { content, mediaUrl } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
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
    const message = {
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

    // Get current user details
    const messageWithUser: MessageWithUser = {
      ...message,
      _id: result.insertedId.toString(),
      conversationId: conversationId,
      sender: session.user.id,
      senderDetails: {
        _id: session.user.id,
        username: session.user.username,
        profilePicture: session.user.image || "/placeholder.svg?height=40&width=40",
      },
    }

    return NextResponse.json(messageWithUser)
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}

