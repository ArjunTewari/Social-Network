import { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  name: string
  email: string
  username: string
  password: string // This will be hashed
  image?: string
  createdAt: Date
  updatedAt: Date
}

export interface UserWithoutPassword extends Omit<User, 'password'> {
  _id: ObjectId
}

