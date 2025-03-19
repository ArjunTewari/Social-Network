import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { status } = await req.json()

    const client = await clientPromise
    const db = client.db()

    await db.collection("users").updateOne(
      { _id: new ObjectId(session.user.id) },
      {
        $set: {
          lastActive: new Date(),
          online: status,
        },
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating online status:", error)
    return NextResponse.json(
      { error: "Failed to update online status" },
      { status: 500 }
    )
  }
}

