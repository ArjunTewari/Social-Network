"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Sidebar } from "@/components/Sidebar"
import { ImagePlus, Loader2 } from "lucide-react"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

const createPostSchema = z.object({
  caption: z.string().max(2200, "Caption must be less than 2200 characters"),
  image: z
    .custom<FileList>()
    .refine((files) => files?.length === 1, "Image is required")
    .transform(files => files[0])
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      `Max file size is 5MB`
    )
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported"
    ),
})

type CreatePostForm = z.infer<typeof createPostSchema>

export default function CreatePostPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreatePostForm>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      caption: "",
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        form.setError("image", {
          message: "Max file size is 5MB",
        })
        return
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        form.setError("image", {
          message: "Only .jpg, .jpeg, .png and .webp formats are supported",
        })
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data: CreatePostForm) => {
    if (!session) return

    try {
      setIsSubmitting(true)

      // First, upload the image
      const formData = new FormData()
      formData.append("file", data.image)
      
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image")
      }

      const { url } = await uploadResponse.json()

      // Then create the post
      const createResponse = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: url,
          caption: data.caption,
        }),
      })

      if (!createResponse.ok) {
        throw new Error("Failed to create post")
      }

      const post = await createResponse.json()

      toast({
        title: "Success",
        description: "Your post has been created",
      })

      router.push(`/posts/${post._id}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session) {
    router.push("/sign-in")
    return null
  }

  return (
    <div className="container flex gap-6">
      <Sidebar />
      
      <main className="flex-1 py-6">
        <Card>
          <CardContent className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Create Post</h1>
              <p className="text-sm text-muted-foreground">
                Share a photo with your followers
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormControl>
                        <div className="grid w-full place-items-center gap-4">
                          {imagePreview ? (
                            <div className="relative aspect-square w-full max-w-lg overflow-hidden rounded-lg">
                              <Image
                                src={imagePreview}
                                alt="Preview"
                                fill
                                className="object-cover"
                              />
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="absolute right-2 top-2"
                                onClick={() => {
                                  setImagePreview(null)
                                  onChange(undefined)
                                }}
                              >
                                Change Photo
                              </Button>
                            </div>
                          ) : (
                            <label
                              htmlFor="image-upload"
                              className="flex aspect-square w-full max-w-lg cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/25 p-6 text-center hover:bg-muted/25"
                            >
                              <ImagePlus className="h-8 w-8" />
                              <p className="text-sm font-medium">
                                Click to upload an image
                              </p>
                              <p className="text-xs text-muted-foreground">
                                JPG, JPEG, PNG, WEBP up to 5MB
                              </p>
                              <Input
                                id="image-upload"
                                type="file"
                                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                                className="hidden"
                                onChange={(e) => {
                                  handleImageChange(e)
                                  onChange(e.target.files)
                                }}
                                {...field}
                              />
                            </label>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="caption"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Write a caption..."
                          className="min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isSubmitting ? "Creating Post..." : "Create Post"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 