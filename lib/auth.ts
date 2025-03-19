// This is a simplified mock auth implementation
// In a real app, you would use NextAuth.js or a similar library

export type User = {
  id: string
  name: string
  email: string
  username: string
  image?: string
}

export type Session = {
  user: User
  expires: string
}

// Mock function to simulate authentication
export async function auth(): Promise<Session | null> {
  // In a real app, this would check cookies, JWT tokens, etc.
  // For demo purposes, we'll return a mock session

  // Use a fixed timestamp for SSR to prevent hydration mismatch
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7); // Add 7 days

  // Uncomment to simulate a logged-in user
  return {
    user: {
      id: "user1",
      name: "John Doe",
      email: "john@example.com",
      username: "johndoe",
      image: "/placeholder.svg?height=40&width=40",
    },
    expires: expiryDate.toISOString(), // 1 week
  }

  // Return null for logged-out state
  // return null
}

