import { createIndexes } from "@/lib/mongodb"

async function main() {
  try {
    console.log("Creating indexes...")
    await createIndexes()
    console.log("Indexes created successfully")
    process.exit(0)
  } catch (error) {
    console.error("Error creating indexes:", error)
    process.exit(1)
  }
}

main() 