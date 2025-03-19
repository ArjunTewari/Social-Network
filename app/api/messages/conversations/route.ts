import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { auth } from "@/lib/auth"
import type { ConversationWithUser } from "@/lib/models/conversation"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()

    // Get all conversations where the user is a participant
    const conversations = await db
      .collection("conversations")
      .find({ "participants.userId": new ObjectId(session.user.id) })
      .sort({ updatedAt: -1 })
      .toArray()

    // Get the other participants' user details
    const conversationsWithUsers: ConversationWithUser[] = await Promise.all(
      conversations.map(async (conversation) => {
        // Find the other participant
        const otherParticipant = conversation.participants.find((p) => p.userId.toString() !== session.user.id)

        if (!otherParticipant) {
          throw new Error("Conversation participant not found")
        }

        // Get user details
        const user = await db.collection("users").findOne({
          _id: new ObjectId(otherParticipant.userId),
        })

        if (!user) {
          throw new Error("User not found")
        }

        // Get unread count
        const currentUserParticipant = conversation.participants.find((p) => p.userId.toString() === session.user.id)

        const lastRead = currentUserParticipant?.lastRead || new Date(0)

        const unreadCount = await db.collection("messages").countDocuments({
          conversationId: conversation._id,
          sender: new ObjectId(otherParticipant.userId),
          timestamp: { $gt: lastRead },
        })

        return {
          _id: conversation._id.toString(),
          user: {
            _id: user._id.toString(),
            username: user.username,
            profilePicture: user.profilePicture || "/placeholder.svg?height=40&width=40",
            isOnline: user.isOnline || false,
            lastActive: user.lastActive,
          },
          lastMessage: conversation.lastMessage
            ? {
                content: conversation.lastMessage.content,
                sender: conversation.lastMessage.sender.toString(),
                timestamp: conversation.lastMessage.timestamp,
                read:
                  lastRead >= conversation.lastMessage.timestamp ||
                  conversation.lastMessage.sender.toString() === session.user.id,
              }
            : undefined,
          unreadCount,
        }
      }),
    )

    return NextResponse.json(conversationsWithUsers)
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    // Check if user exists
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if conversation already exists
    const existingConversation = await db.collection("conversations").findOne({
      participants: {
        $all: [
          { $elemMatch: { userId: new ObjectId(session.user.id) } },
          { $elemMatch: { userId: new ObjectId(userId) } },
        ],
      },
    })

    if (existingConversation) {
      return NextResponse.json({
        _id: existingConversation._id.toString(),
        existing: true,
      })
    }

    // Create new conversation
    const newConversation = {
      participants: [{ userId: new ObjectId(session.user.id) }, { userId: new ObjectId(userId) }],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("conversations").insertOne(newConversation)

    return NextResponse.json({
      _id: result.insertedId.toString(),
      existing: false,
    })
  } catch (error) {
    console.error("Error creating conversation:", error)
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
  }
}

