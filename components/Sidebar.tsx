import { useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Bell, PlusSquare, User, MessageSquare, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session) return null

  const links = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/explore", icon: Search, label: "Explore" },
    { href: "/messages", icon: MessageSquare, label: "Messages" },
    { href: "/notifications", icon: Bell, label: "Notifications" },
    { href: "/create", icon: PlusSquare, label: "Create" },
    { href: `/profile/${session.user.id}`, icon: User, label: "Profile" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ]

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 border-r lg:block">
      <div className="flex h-full flex-col gap-2 py-6 pr-4">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <Button
              variant={pathname === link.href ? "default" : "ghost"}
              size="lg"
              className="w-full justify-start gap-2"
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </Button>
          </Link>
        ))}
      </div>
    </aside>
  )
} 