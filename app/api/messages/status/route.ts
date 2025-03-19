import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { auth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messageId, status } = await request.json()

    if (!messageId || !status || !["delivered", "read"].includes(status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    // Update message status
    await db.collection("messages").updateOne({ _id: new ObjectId(messageId) }, { $set: { status } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating message status:", error)
    return NextResponse.json({ error: "Failed to update message status" }, { status: 500 })
  }
}

