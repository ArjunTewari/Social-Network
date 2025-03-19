import { ObjectId } from "mongodb"
import clientPromise from "./mongodb"

// Initialize database collections
export async function initializeDatabase() {
  const client = await clientPromise
  const db = client.db()

  // Create collections if they don't exist
  const collections = await db.listCollections().toArray()
  const collectionNames = collections.map((c) => c.name)

  if (!collectionNames.includes("users")) {
    await db.createCollection("users")
    await db.collection("users").createIndex({ username: 1 }, { unique: true })
    await db.collection("users").createIndex({ email: 1 }, { unique: true })
    await db.collection("users").createIndex({ username: "text", name: "text" })
  }

  if (!collectionNames.includes("conversations")) {
    await db.createCollection("conversations")
    await db.collection("conversations").createIndex({ "participants.userId": 1 })
    await db.collection("conversations").createIndex({ updatedAt: -1 })
  }

  if (!collectionNames.includes("messages")) {
    await db.createCollection("messages")
    await db.collection("messages").createIndex({ conversationId: 1 })
    await db.collection("messages").createIndex({ sender: 1 })
    await db.collection("messages").createIndex({ timestamp: 1 })
  }

  return db
}

// Helper function to convert string IDs to ObjectIds
export function toObjectId(id: string | ObjectId): ObjectId {
  return typeof id === "string" ? new ObjectId(id) : id
}

// Helper function to convert ObjectIds to strings in an object
export function normalizeId<T extends Record<string, any>>(doc: T): T {
  if (!doc) return doc

  const result = { ...doc } as any

  if (result._id) {
    result._id = result._id.toString()
  }

  return result
}

// Helper function to convert ObjectIds to strings in an array of objects
export function normalizeIds<T extends Record<string, any>>(docs: T[]): T[] {
  return docs.map(normalizeId)
}

