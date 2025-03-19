"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Bell, MessageSquare, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/")
  }

  const isAuthPage = pathname === "/login" || pathname === "/signup"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link className="flex items-center space-x-2" href="/">
            <span className="text-xl font-bold">Photogram</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {session ? (
            <>
              <Link href="/search">
                <Button variant="ghost" size="icon">
                  <Search className="h-5 w-5" />
                  <span className="sr-only">Search</span>
                </Button>
              </Link>
              <Link href="/messages">
                <Button variant="ghost" size="icon">
                  <MessageSquare className="h-5 w-5" />
                  <span className="sr-only">Messages</span>
                </Button>
              </Link>
              <Link href="/notifications">
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                  <span className="sr-only">Notifications</span>
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                      <AvatarFallback>{session.user.name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${session.user.username}`}>Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={handleSignOut}
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            !isAuthPage && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign up</Link>
                </Button>
              </div>
            )
          )}
        </div>
      </div>
    </header>
  )
}

