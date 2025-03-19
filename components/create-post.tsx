"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { ImagePlus, X, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  content: z.string().max(2200, { message: "Caption must be at most 2200 characters" }),
})

export function CreatePost() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setSelectedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!selectedImage) {
      toast({
        title: "No image selected",
        description: "Please select an image to post.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // In a real app, this would be an API call to your backend
      // const formData = new FormData()
      // formData.append('content', values.content)
      // formData.append('image', imageFile)
      // await fetch('/api/posts', {
      //   method: 'POST',
      //   body: formData,
      // })

      // For demo purposes, we'll simulate a successful post creation
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Post created",
        description: "Your post has been published successfully.",
      })

      setOpen(false)
      form.reset()
      setSelectedImage(null)
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <ImagePlus className="h-5 w-5" />
          <span className="sr-only">Create post</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create new post</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {selectedImage ? (
              <div className="relative">
                <Image
                  src={selectedImage || "/placeholder.svg"}
                  alt="Selected image"
                  width={400}
                  height={400}
                  className="rounded-md max-h-[300px] w-auto mx-auto object-contain"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-60 border-2 border-dashed rounded-md">
                <div className="text-center">
                  <ImagePlus className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="mt-4 flex flex-col items-center">
                    <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                      Select image
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    <p className="mt-2 text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              </div>
            )}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea placeholder="Write a caption..." className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading || !selectedImage}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Share"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

