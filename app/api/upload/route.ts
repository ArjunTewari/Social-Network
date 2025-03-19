import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import crypto from "crypto"

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.AWS_BUCKET_NAME!
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "File size too large. Maximum size is 5MB" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: "Invalid file type. Only JPEG, PNG, and WebP are allowed" },
        { status: 400 }
      )
    }

    // Generate a unique filename
    const fileExtension = file.type.split("/")[1]
    const randomBytes = crypto.randomBytes(16).toString("hex")
    const key = `uploads/${session.user.id}/${randomBytes}.${fileExtension}`

    // Get the file buffer
    const buffer = await file.arrayBuffer()

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: Buffer.from(buffer),
      ContentType: file.type,
      ACL: "public-read",
    })

    await s3.send(command)

    // Generate the public URL
    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`

    return NextResponse.json({ url })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { message: "Failed to upload file" },
      { status: 500 }
    )
  }
}

// Generate a presigned URL for client-side uploads
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const fileType = searchParams.get("fileType")
    const fileName = searchParams.get("fileName")

    if (!fileType || !fileName) {
      return NextResponse.json(
        { message: "File type and name are required" },
        { status: 400 }
      )
    }

    if (!ACCEPTED_TYPES.includes(fileType)) {
      return NextResponse.json(
        { message: "Invalid file type" },
        { status: 400 }
      )
    }

    const key = `uploads/${session.user.id}/${crypto.randomBytes(16).toString("hex")}-${fileName}`

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      ACL: "public-read",
    })

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 }) // URL expires in 60 seconds

    return NextResponse.json({
      url: signedUrl,
      key,
    })
  } catch (error) {
    console.error("Error generating signed URL:", error)
    return NextResponse.json(
      { message: "Failed to generate upload URL" },
      { status: 500 }
    )
  }
} 