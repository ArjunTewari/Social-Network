import type { ObjectId } from "mongodb"

export interface Participant {
  userId: ObjectId | string
  lastRead?: Date
}

export interface Conversation {
  _id?: ObjectId | string
  participants: Participant[]
  lastMessage?: {
    content: string
    sender: ObjectId | string
    timestamp: Date
  }
  createdAt: Date
  updatedAt: Date
}

export interface ConversationWithUser {
  _id: string
  user: {
    _id: string
    username: string
    profilePicture: string
    isOnline: boolean
    lastActive?: Date
  }
  lastMessage?: {
    content: string
    sender: string
    timestamp: Date
    read: boolean
  }
  unreadCount: number
}

