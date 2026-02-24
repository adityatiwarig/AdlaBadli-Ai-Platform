"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import useSWR, { mutate } from "swr"
import {
  ArrowLeftRight,
  Bell,
  LayoutDashboard,
  LogOut,
  MapPin,
  Moon,
  MessageSquare,
  Search,
  Sun,
  Timer,
  Trash2,
  User,
  Menu,
  X,
} from "lucide-react"
import { useState } from "react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function Navbar() {
  const { user, loading, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data: notificationData } = useSWR(user ? "/api/notifications" : null, fetcher, { refreshInterval: 5000 })

  const notifications = notificationData?.notifications || []

  const deleteNotification = async (id: string) => {
    await fetch(`/api/notifications?id=${id}`, { method: "DELETE" })
    mutate("/api/notifications")
  }

  const clearNotifications = async () => {
    await fetch("/api/notifications?all=true", { method: "DELETE" })
    mutate("/api/notifications")
  }

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  if (loading) return null

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-card/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
        <Link href={user ? "/dashboard" : "/"} className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary sm:h-9 sm:w-9">
            <ArrowLeftRight className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="truncate text-base font-bold text-foreground sm:text-lg">
            AdlaBadli<span className="text-primary"> AI</span>
          </span>
        </Link>

        {user ? (
          <>
            <nav className="hidden items-center gap-1 md:flex">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/explore">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Search className="h-4 w-4" />
                  Explore
                </Button>
              </Link>
              <Link href="/chat">
                <Button variant="ghost" size="sm" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </Button>
              </Link>
              <Link href="/sessions">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Timer className="h-4 w-4" />
                  Sessions
                </Button>
              </Link>
              <Link href="/offline-meets">
                <Button variant="ghost" size="sm" className="gap-2">
                  <MapPin className="h-4 w-4" />
                  Offline
                </Button>
              </Link>
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="gap-2"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? "Light" : "Dark"}
              </Button>
              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                <Timer className="h-3.5 w-3.5" />
                {user.credits} credits
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-4 w-4" />
                    {notifications.length > 0 ? (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                        {notifications.length > 9 ? "9+" : notifications.length}
                      </span>
                    ) : null}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <p className="text-sm font-medium">Notifications</p>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearNotifications} disabled={notifications.length === 0}>
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Clear
                    </Button>
                  </div>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="px-2 py-3 text-xs text-muted-foreground">No notifications</div>
                  ) : (
                    notifications.map((n: { id: string; title: string; body: string; type: string; relatedSessionId?: string; relatedUserId?: string; createdAt: string }) => (
                      <div key={n.id} className="px-2 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            className="flex-1 text-left"
                            onClick={() => {
                              if (n.relatedSessionId) router.push("/sessions")
                              else if (n.relatedUserId) router.push(`/chat?partner=${n.relatedUserId}`)
                            }}
                          >
                            <p className="text-xs font-semibold text-foreground">{n.title}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                            <p className="mt-1 text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
                          </button>
                          <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs" onClick={() => deleteNotification(n.id)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    {user.name.split(" ")[0]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => router.push("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {mobileOpen && (
              <div className="absolute left-0 top-full max-h-[calc(100dvh-56px)] w-full overflow-y-auto border-b border-border bg-card p-4 shadow-lg md:hidden">
                <nav className="flex flex-col gap-2">
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </Button>
                  </Link>
                  <Link href="/explore" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Search className="h-4 w-4" /> Explore
                    </Button>
                  </Link>
                  <Link href="/chat" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <MessageSquare className="h-4 w-4" /> Chat
                    </Button>
                  </Link>
                  <Link href="/sessions" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Timer className="h-4 w-4" /> Sessions
                    </Button>
                  </Link>
                  <Link href="/profile" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <User className="h-4 w-4" /> Profile
                    </Button>
                  </Link>
                  <Link href="/offline-meets" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <MapPin className="h-4 w-4" /> Offline Meets
                    </Button>
                  </Link>
                  <div className="my-2 border-t border-border" />
                  <div className="flex items-center justify-between px-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                      {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                      Theme
                    </Button>
                    <span className="text-sm text-muted-foreground">{user.credits} credits</span>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                  </div>
                </nav>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="interactive-button px-3 sm:px-4">Login</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="interactive-button px-3 sm:px-4">Get Started</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
