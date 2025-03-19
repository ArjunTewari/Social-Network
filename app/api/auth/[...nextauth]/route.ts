import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials")
        }

        const client = await clientPromise
        const users = client.db().collection("users")
        const user = await users.findOne({ email: credentials.email })

        if (!user || !user.password) {
          throw new Error("Invalid credentials")
        }

        const isValid = await compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error("Invalid credentials")
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          username: user.username,
          image: user.image || `https://api.dicebear.com/7.x/avatars/svg?seed=${user.username}`,
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
      }
      return session
    }
  }
})

export { handler as GET, handler as POST } 