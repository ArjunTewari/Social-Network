import { MongoClient } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// Create indexes for better query performance
export async function createIndexes() {
  try {
    const client = await clientPromise
    const db = client.db()

    // Users collection indexes
    await db.collection("users").createIndexes([
      { key: { email: 1 }, unique: true },
      { key: { username: 1 }, unique: true },
      { key: { following: 1 } },
      { key: { followers: 1 } },
      { key: { createdAt: -1 } }
    ])

    // Posts collection indexes
    await db.collection("posts").createIndexes([
      { key: { userId: 1 } },
      { key: { createdAt: -1 } }
    ])

    // Activities collection indexes
    await db.collection("activities").createIndexes([
      { key: { userId: 1 } },
      { key: { targetUserId: 1 } },
      { key: { type: 1 } },
      { key: { createdAt: -1 } }
    ])

    // Notifications collection indexes
    await db.collection("notifications").createIndexes([
      { key: { userId: 1 } },
      { key: { actorId: 1 } },
      { key: { type: 1 } },
      { key: { read: 1 } },
      { key: { createdAt: -1 } }
    ])

    console.log("Successfully created indexes")
  } catch (error) {
    console.error("Error creating indexes:", error)
    throw error
  }
}

// Export a module-scoped MongoClient promise
export default clientPromise

