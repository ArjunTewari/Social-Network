import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { auth } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Update last read timestamp for current user
    await db.collection("conversations").updateOne(
      {
        _id: new ObjectId(conversationId),
        "participants.userId": new ObjectId(session.user.id),
      },
      { $set: { "participants.$.lastRead": new Date() } },
    )

    // Update message status to read
    const otherParticipant = conversation.participants.find((p: any) => p.userId.toString() !== session.user.id)

    if (otherParticipant) {
      await db.collection("messages").updateMany(
        {
          conversationId: new ObjectId(conversationId),
          sender: new ObjectId(otherParticipant.userId),
          status: { $ne: "read" },
        },
        { $set: { status: "read" } },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking messages as read:", error)
    return NextResponse.json({ error: "Failed to mark messages as read" }, { status: 500 })
  }
}

