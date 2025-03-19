import { type NextRequest, NextResponse } from "next/server"
import { initializeDatabase } from "@/lib/db-utils"

// This route is used to initialize the database collections and indexes
// It should be called once when setting up the application
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()
    return NextResponse.json({ success: true, message: "Database initialized successfully" })
  } catch (error) {
    console.error("Error initializing database:", error)
    return NextResponse.json({ error: "Failed to initialize database" }, { status: 500 })
  }
}

