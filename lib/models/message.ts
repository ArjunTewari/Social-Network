import type { ObjectId } from "mongodb"

export interface Message {
  _id?: ObjectId | string
  conversationId: ObjectId | string
  sender: ObjectId | string
  content: string
  timestamp: Date
  status: "sent" | "delivered" | "read"
  mediaUrl?: string
}

export interface MessageWithUser extends Message {
  senderDetails: {
    _id: string
    username: string
    profilePicture: string
  }
}

