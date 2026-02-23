"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { MapPin, CalendarDays, Send } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function OfflineMeetsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { data: usersData } = useSWR(user ? "/api/users" : null, fetcher)
  const { data: notificationsData, mutate } = useSWR(user ? "/api/notifications" : null, fetcher, { refreshInterval: 5000 })

  const [form, setForm] = useState({
    partnerId: "",
    topic: "",
    location: "",
    proposedTime: "",
    note: "",
  })
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState("")

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const users = (usersData?.users || []).filter((u: { id: string }) => u.id !== user.id)
  const offlineRequests = (notificationsData?.notifications || []).filter((n: { type: string }) => n.type === "offline_meet_request")

  const sendRequest = async () => {
    if (!form.partnerId || !form.topic.trim()) return
    setSending(true)
    setStatus("")
    try {
      const res = await fetch("/api/offline-meets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus(data?.error || "Unable to send offline request")
        return
      }
      setForm({ partnerId: "", topic: "", location: "", proposedTime: "", note: "" })
      setStatus("Offline meet request sent.")
      mutate()
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-2">
      <Card className="border border-border">
        <CardHeader>
          <CardTitle>Request Offline Meet</CardTitle>
          <CardDescription>Separate from session scheduling. Send direct offline meetup request.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Partner</Label>
            <Select value={form.partnerId} onValueChange={(v) => setForm((p) => ({ ...p, partnerId: v }))}>
              <SelectTrigger><SelectValue placeholder="Select partner" /></SelectTrigger>
              <SelectContent>
                {users.map((u: { id: string; name: string; city: string }) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} - {u.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Topic</Label>
            <Input value={form.topic} onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))} placeholder="What do you want to learn/discuss?" />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} placeholder="Cafe, library, coworking..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Proposed Time</Label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" value={form.proposedTime} onChange={(e) => setForm((p) => ({ ...p, proposedTime: e.target.value }))} placeholder="e.g., Sun 5 PM" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} placeholder="Extra details..." />
          </div>
          {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
          <Button onClick={sendRequest} disabled={sending || !form.partnerId || !form.topic.trim()} className="gap-2">
            <Send className="h-4 w-4" /> {sending ? "Sending..." : "Send Request"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardHeader>
          <CardTitle>Offline Meet Notifications</CardTitle>
          <CardDescription>Requests you received appear here and in the notification bell.</CardDescription>
        </CardHeader>
        <CardContent>
          {offlineRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No offline meet requests yet.</p>
          ) : (
            <div className="space-y-2">
              {offlineRequests.map((n: { id: string; title: string; body: string; createdAt: string }) => (
                <div key={n.id} className="rounded-lg border border-border bg-card p-3">
                  <p className="text-sm font-semibold text-foreground">{n.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
