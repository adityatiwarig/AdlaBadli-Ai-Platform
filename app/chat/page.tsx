"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useRef, useCallback, Suspense, useMemo } from "react"
import useSWR, { mutate } from "swr"
import { io, type Socket } from "socket.io-client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Bot,
  Compass,
  ExternalLink,
  Lightbulb,
  ListChecks,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Timer,
  Trash2,
  TrendingUp,
  Users,
  Video,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface ChatPartner {
  user: {
    id: string
    name: string
    city: string
    teachSkills: string[]
  }
  lastMessage?: {
    message: string
    timestamp: string
    senderId: string
  }
}

interface Message {
  id: string
  senderId: string
  receiverId: string
  message: string
  timestamp: string
  sessionId?: string
}

interface SessionLite {
  id: string
  status: "scheduled" | "active" | "completed" | "cancelled"
  isDeletedForUser?: boolean
  meetingRoomId?: string
  meetingProvider?: string
  meetingUrl?: string
  summary?: string
  summaryUpdatedAt?: string
  skill: string
  teacherId: string
  learnerId: string
  teacher?: { id: string; name: string }
  learner?: { id: string; name: string }
  startTime?: string
  createdAt?: string
}

type AgentType = "coach" | "icebreaker" | "scheduler" | "progress" | "diagnose" | "drills"
type ChatMode = "normal" | "session"

const AGENTS: Array<{ id: AgentType; label: string; hint: string; icon: typeof Lightbulb }> = [
  { id: "coach", label: "Coach", hint: "Next concrete actions", icon: Lightbulb },
  { id: "icebreaker", label: "Starter", hint: "Copy-paste prompts", icon: MessageSquare },
  { id: "scheduler", label: "Planner", hint: "Structured session flow", icon: Compass },
  { id: "progress", label: "Progress", hint: "Gap + priorities", icon: TrendingUp },
  { id: "diagnose", label: "Diagnose", hint: "Root-cause blocker fix", icon: Sparkles },
  { id: "drills", label: "Drills", hint: "Targeted practice tasks", icon: ListChecks },
]

const SESSION_STATUS_PRIORITY: Record<SessionLite["status"], number> = {
  active: 0,
  scheduled: 1,
  completed: 2,
  cancelled: 3,
}

function ChatContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const partnerIdFromUrl = searchParams.get("partner")

  const [activePartnerId, setActivePartnerId] = useState<string | null>(partnerIdFromUrl)
  const activePartnerRef = useRef<string | null>(partnerIdFromUrl)
  const [chatMode, setChatMode] = useState<ChatMode>("normal")
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [messageQuery, setMessageQuery] = useState("")
  const [agentFocus, setAgentFocus] = useState("")
  const [showSessionPanel, setShowSessionPanel] = useState(false)
  const [showVideoPanel, setShowVideoPanel] = useState(false)
  const [agentLoading, setAgentLoading] = useState<AgentType | null>(null)
  const [agentResult, setAgentResult] = useState<{ title: string; content: string } | null>(null)
  const [lastAgentUsed, setLastAgentUsed] = useState<AgentType | null>(null)
  const [copiedAgent, setCopiedAgent] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: partnerData } = useSWR(user ? "/api/messages" : null, fetcher, { refreshInterval: 3000 })
  const { data: activePartnerInfo } = useSWR(activePartnerId ? `/api/users/${activePartnerId}` : null, fetcher)
  const { data: sessionsData } = useSWR(user ? "/api/sessions" : null, fetcher, { refreshInterval: 5000 })

  const messagesUrl = useMemo(() => {
    if (!user || !activePartnerId) return null
    if (chatMode === "session") {
      if (!activeSessionId) return null
      return `/api/messages?partnerId=${activePartnerId}&scope=session&sessionId=${activeSessionId}`
    }
    return `/api/messages?partnerId=${activePartnerId}&scope=normal`
  }, [user, activePartnerId, chatMode, activeSessionId])

  const { data: msgData } = useSWR(messagesUrl, fetcher, { refreshInterval: 2000 })

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [msgData?.messages, activePartnerId, chatMode, activeSessionId])

  useEffect(() => {
    activePartnerRef.current = activePartnerId
  }, [activePartnerId])

  useEffect(() => {
    if (!user || socketRef.current) return
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4001"
    const socket = io(socketUrl, { transports: ["websocket"] })
    socketRef.current = socket
    socket.emit("join", user.id)
    socket.on("chat:receive", (payload: { senderId?: string; receiverId?: string }) => {
      const currentPartnerId = activePartnerRef.current
      if (payload && currentPartnerId && (payload.senderId === currentPartnerId || payload.receiverId === currentPartnerId)) {
        mutate(`/api/messages?partnerId=${currentPartnerId}&scope=normal`)
      }
      if (activeSessionId && currentPartnerId) {
        mutate(`/api/messages?partnerId=${currentPartnerId}&scope=session&sessionId=${activeSessionId}`)
      }
      mutate("/api/messages")
      mutate("/api/sessions")
    })
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user, activeSessionId])

  const partners: ChatPartner[] = partnerData?.partners || []
  const messages: Message[] = msgData?.messages || []
  const partnerInfo = activePartnerInfo?.user
  const sessions: SessionLite[] = sessionsData?.sessions || []

  const partnerSessions = useMemo(() => {
    if (!activePartnerId || !user) return []
    return sessions
      .filter((s) => {
        const partnerInSession = [s.teacherId, s.learnerId].includes(activePartnerId)
        const userInSession = [s.teacherId, s.learnerId].includes(user.id)
        return partnerInSession && userInSession && s.status !== "cancelled" && !s.isDeletedForUser
      })
      .sort((a, b) => {
        const aPriority = SESSION_STATUS_PRIORITY[a.status] ?? 99
        const bPriority = SESSION_STATUS_PRIORITY[b.status] ?? 99
        if (aPriority !== bPriority) return aPriority - bPriority
        const aT = new Date(a.summaryUpdatedAt || 0).getTime()
        const bT = new Date(b.summaryUpdatedAt || 0).getTime()
        if (aT !== bT) return bT - aT
        const aStart = new Date(a.startTime || a.createdAt || 0).getTime()
        const bStart = new Date(b.startTime || b.createdAt || 0).getTime()
        return bStart - aStart
      })
  }, [sessions, activePartnerId, user])

  const preferredSessionId = useMemo(() => {
    if (partnerSessions.length === 0) return null
    return partnerSessions[0].id
  }, [partnerSessions])

  useEffect(() => {
    if (!activeSessionId && preferredSessionId) {
      setActiveSessionId(preferredSessionId)
    }
  }, [activeSessionId, preferredSessionId])

  useEffect(() => {
    if (!preferredSessionId) return
    if (activeSessionId && !partnerSessions.some((s) => s.id === activeSessionId)) {
      setActiveSessionId(preferredSessionId)
      return
    }
    const selectedSession = partnerSessions.find((s) => s.id === activeSessionId)
    if (selectedSession?.status !== "active" && partnerSessions[0].status === "active") {
      setActiveSessionId(partnerSessions[0].id)
    }
  }, [activeSessionId, partnerSessions, preferredSessionId])

  const activeSession = useMemo(
    () => partnerSessions.find((s) => s.id === activeSessionId) || null,
    [partnerSessions, activeSessionId]
  )
  const isWritableSessionChat = chatMode === "session" && !!activeSession && ["active", "scheduled"].includes(activeSession.status)
  const hasLiveSession = partnerSessions.some((s) => s.status === "active")

  useEffect(() => {
    if (chatMode !== "session" || activeSession?.status !== "active") {
      setShowVideoPanel(false)
    }
  }, [chatMode, activeSession?.status])

  const filteredMessages = useMemo(() => {
    if (!messageQuery.trim()) return messages
    const q = messageQuery.trim().toLowerCase()
    return messages.filter((m) => m.message.toLowerCase().includes(q))
  }, [messages, messageQuery])

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !activePartnerId || sending) return
    if (chatMode === "session" && !activeSessionId) return
    if (chatMode === "session" && !isWritableSessionChat) return

    setSending(true)
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: activePartnerId,
          message: newMessage.trim(),
          sessionId: chatMode === "session" ? activeSessionId : undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) return

      setNewMessage("")
      if (chatMode === "session" && activeSessionId) {
        mutate(`/api/messages?partnerId=${activePartnerId}&scope=session&sessionId=${activeSessionId}`)
      } else {
        mutate(`/api/messages?partnerId=${activePartnerId}&scope=normal`)
      }
      mutate("/api/messages")
      mutate("/api/sessions")
      socketRef.current?.emit("chat:send", { toUserId: activePartnerId, message: data?.message })
    } finally {
      setSending(false)
    }
  }, [newMessage, activePartnerId, sending, chatMode, activeSessionId, isWritableSessionChat])

  const clearNormalChat = useCallback(async () => {
    if (!activePartnerId || chatMode !== "normal") return
    setClearing(true)
    try {
      await fetch(`/api/messages?partnerId=${activePartnerId}&scope=normal`, { method: "DELETE" })
      mutate(`/api/messages?partnerId=${activePartnerId}&scope=normal`)
      mutate("/api/messages")
    } finally {
      setClearing(false)
    }
  }, [activePartnerId, chatMode])

  const runAgent = useCallback(async (agent: AgentType) => {
    if (!activePartnerId || !activeSessionId || agentLoading || chatMode !== "session") return
    setAgentLoading(agent)
    setCopiedAgent(false)
    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId: activePartnerId,
          agent,
          sessionId: activeSessionId,
          focus: agentFocus.trim(),
        }),
      })
      const data = await response.json()
      if (response.ok && data?.result) {
        setAgentResult(data.result)
        setLastAgentUsed(agent)
        mutate("/api/sessions")
      } else {
        setAgentResult({ title: "AI Helper", content: data?.error || "Unable to generate response." })
      }
    } finally {
      setAgentLoading(null)
    }
  }, [activePartnerId, activeSessionId, agentLoading, chatMode, agentFocus])

  const copyAgentResult = useCallback(async () => {
    if (!agentResult?.content) return
    try {
      await navigator.clipboard.writeText(`${agentResult.title}\n\n${agentResult.content}`)
      setCopiedAgent(true)
      setTimeout(() => setCopiedAgent(false), 1400)
    } catch {
      setCopiedAgent(false)
    }
  }, [agentResult])

  if (loading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="page-shell max-w-[96rem] px-3 md:px-4">
      <div className="mb-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Chat Center
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">Normal and session chat stay separate, with live-session auto-focus.</p>
      </div>

      <div className="grid h-[calc(100dvh-132px)] min-h-[520px] gap-3 md:h-[calc(100dvh-120px)] md:min-h-[720px] md:grid-cols-[340px_1fr]">
        <Card className={`section-card flex min-h-0 flex-col overflow-hidden ${activePartnerId ? "hidden md:flex" : "flex"}`}>
          <div className="border-b border-border p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Users className="h-4 w-4" />
              Normal Conversations
            </div>
          </div>
          <div className="app-scroll min-h-0 flex-1 overflow-y-auto p-2">
            {partners.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No normal chats yet.</p>
              </div>
            ) : (
              partners.map((p) => (
                <button
                  key={p.user.id}
                  onClick={() => {
                    setActivePartnerId(p.user.id)
                    setActiveSessionId(null)
                    setAgentResult(null)
                    setMessageQuery("")
                  }}
                  className={`mb-1.5 flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                    activePartnerId === p.user.id
                      ? "border-primary/30 bg-primary/12 shadow-sm shadow-primary/10 ring-1 ring-primary/30"
                      : "border-transparent hover:border-border hover:bg-muted/60"
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {p.user.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{p.user.name}</p>
                    {p.lastMessage ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {p.lastMessage.senderId === user.id ? "You: " : ""}
                        {p.lastMessage.message}
                      </p>
                    ) : null}
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        <Card className={`section-card flex min-h-0 flex-col overflow-hidden ${!activePartnerId ? "hidden md:flex" : "flex"}`}>
          {activePartnerId && partnerInfo ? (
            <>
              <div className="border-b border-border p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
                  <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setActivePartnerId(null)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {partnerInfo.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{partnerInfo.name}</p>
                    <p className="text-xs text-muted-foreground">{partnerInfo.city} - {partnerInfo.teachSkills?.slice(0, 2).join(", ")}</p>
                  </div>
                  {chatMode === "session" && activeSession?.meetingUrl ? (
                    <a href={activeSession.meetingUrl} target="_blank" rel="noreferrer" className="w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="w-full gap-1.5 sm:w-auto">
                        <Video className="h-3.5 w-3.5" />
                        Join Video
                      </Button>
                    </a>
                  ) : null}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 sm:w-auto"
                    onClick={() => router.push(`/sessions?create=true&partner=${activePartnerId}&skill=${partnerInfo.teachSkills?.[0] || ""}`)}
                  >
                    <Timer className="h-3.5 w-3.5" />
                    Schedule
                  </Button>
                </div>

                <div className="rounded-lg border border-border p-2">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={chatMode === "normal" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setChatMode("normal")}
                    >
                      Normal Chat
                    </Button>
                    <Button
                      size="sm"
                      variant={chatMode === "session" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setChatMode("session")}
                    >
                      Session Chat
                    </Button>
                  </div>
                  {chatMode === "session" && (
                    <div className="mt-2 grid gap-2 md:grid-cols-[220px_1fr]">
                      <Select value={activeSessionId || ""} onValueChange={(v) => setActiveSessionId(v)}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select session" />
                        </SelectTrigger>
                        <SelectContent>
                          {partnerSessions.length === 0 ? (
                            <SelectItem value="no-session" disabled>No sessions found</SelectItem>
                          ) : (
                            partnerSessions.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.skill} - {s.status === "active" ? "Live" : s.status}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <div className="rounded-md bg-muted/50 px-2.5 py-1.5 text-[11px] text-muted-foreground">
                        {hasLiveSession
                          ? "Live session detected. This thread auto-switches to the active session."
                          : "Session chat history is permanent for revision and cannot be cleared."}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {chatMode === "session" && activeSession ? (
                <div className="border-b border-border bg-muted/25 p-2.5">
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <p className="truncate text-xs text-muted-foreground">
                        {activeSession.summary || "Session summary will appear here as chat continues."}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-xs"
                      onClick={() => setShowSessionPanel((v) => !v)}
                    >
                      {showSessionPanel ? "Hide Tools" : "Show Tools"}
                    </Button>
                    {activeSession.status === "active" ? (
                      <Button
                        size="sm"
                        variant={showVideoPanel ? "default" : "outline"}
                        className="h-7 gap-1 px-2.5 text-xs"
                        onClick={() => setShowVideoPanel((v) => !v)}
                      >
                        <Video className="h-3.5 w-3.5" />
                        {showVideoPanel ? "Hide Video" : "Video + Chat"}
                      </Button>
                    ) : null}
                  </div>
                  {showVideoPanel && activeSession.meetingUrl ? (
                    <div className="mt-2 rounded-lg border border-border bg-card p-2">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-[11px] text-muted-foreground">
                          Meeting ID: <span className="font-medium text-foreground">{activeSession.meetingRoomId || "-"}</span>
                        </div>
                        <a href={activeSession.meetingUrl} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs">
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open in New Tab
                          </Button>
                        </a>
                      </div>
                      <iframe
                        src={activeSession.meetingUrl}
                        title={`Session meeting ${activeSession.id}`}
                        allow="camera; microphone; fullscreen; display-capture"
                        className="h-64 w-full rounded-md border border-border"
                      />
                    </div>
                  ) : null}
                  {showSessionPanel && (
                    <div className="mt-2 grid gap-2 lg:grid-cols-[1.25fr_1fr]">
                      <div className="rounded-lg border border-border bg-card p-3">
                        <p className="text-xs text-foreground">{activeSession.summary || "Summary appears after session chat starts."}</p>
                        {activeSession.summaryUpdatedAt ? <p className="mt-1 text-[11px] text-muted-foreground">Updated: {new Date(activeSession.summaryUpdatedAt).toLocaleString()}</p> : null}
                      </div>
                      <div className="rounded-lg border border-border bg-card p-3">
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <Bot className="h-3.5 w-3.5" />
                          Session AI Agents
                        </div>
                        <Input
                          value={agentFocus}
                          onChange={(e) => setAgentFocus(e.target.value)}
                          placeholder="Optional focus (e.g., loops confusion)"
                          className="mb-2 h-8 text-xs"
                        />
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          {["recap quickly", "fix my mistakes", "give practice tasks", "make next 30-min plan"].map((preset) => (
                            <Button
                              key={preset}
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="h-6 px-2 text-[10px]"
                              onClick={() => setAgentFocus(preset)}
                            >
                              {preset}
                            </Button>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {AGENTS.map((agent) => {
                            const Icon = agent.icon
                            return (
                              <Button
                                key={agent.id}
                                size="sm"
                                variant="outline"
                                className="h-auto items-start justify-start gap-1.5 px-2 py-2 text-left"
                                onClick={() => runAgent(agent.id)}
                                disabled={!!agentLoading}
                              >
                                <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span className="block">
                                  <span className="block text-[11px] font-semibold">{agentLoading === agent.id ? "Loading..." : agent.label}</span>
                                  <span className="block text-[10px] text-muted-foreground">{agent.hint}</span>
                                </span>
                              </Button>
                            )
                          })}
                        </div>
                        {agentResult ? (
                          <div className="mt-2 rounded-md bg-muted/60 p-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-foreground">{agentResult.title}</p>
                              <div className="flex items-center gap-1.5">
                                {lastAgentUsed ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-[10px]"
                                    onClick={() => runAgent(lastAgentUsed)}
                                    disabled={!!agentLoading}
                                  >
                                    Re-run
                                  </Button>
                                ) : null}
                                <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={copyAgentResult}>
                                  {copiedAgent ? "Copied" : "Copy"}
                                </Button>
                              </div>
                            </div>
                            <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">{agentResult.content}</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-b border-border p-2.5">
                  <div className="flex flex-col items-stretch gap-2 rounded-lg bg-muted/35 p-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">Normal chat is independent from sessions. You can clear only this normal thread.</p>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={clearNormalChat} disabled={clearing || messages.length === 0}>
                      {clearing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      Clear Normal Chat
                    </Button>
                  </div>
                </div>
              )}

              <div className="border-b border-border p-2.5">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input value={messageQuery} onChange={(e) => setMessageQuery(e.target.value)} placeholder={`Search ${chatMode} messages...`} className="h-8" />
                  <span className="hidden rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground sm:inline-flex">
                    {filteredMessages.length}/{messages.length}
                  </span>
                </div>
              </div>

              <div className="app-scroll min-h-[260px] flex-1 overflow-y-auto bg-muted/20 p-3 pb-24 md:min-h-[320px] md:p-4 md:pb-24">
                {filteredMessages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <Lightbulb className="mb-3 h-12 w-12 text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground">
                      {messages.length === 0
                        ? chatMode === "session"
                          ? "No messages in this session chat yet."
                          : "No normal messages yet."
                        : "No messages match your search."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.senderId === user.id ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[92%] rounded-2xl px-3 py-2.5 text-sm shadow-sm transition sm:max-w-[85%] sm:px-4 ${
                            msg.senderId === user.id
                              ? "bg-primary text-primary-foreground shadow-primary/20"
                              : "border border-border/70 bg-card/95 text-foreground"
                          }`}
                        >
                          <p>{msg.message}</p>
                          <p className={`mt-1 text-[10px] ${msg.senderId === user.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 z-10 shrink-0 border-t border-border bg-card/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
                {chatMode === "session" && activeSession && !["active", "scheduled"].includes(activeSession.status) ? (
                  <div className="mb-2 rounded-md border border-border bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground">
                    Session ended. Chat is view-only now.
                  </div>
                ) : null}
                {chatMode === "session" && activeSession?.status === "scheduled" ? (
                  <div className="mb-2 rounded-md border border-primary/25 bg-primary/10 px-2.5 py-1.5 text-xs text-foreground">
                    Session is scheduled. Sending first message will start the session chat.
                  </div>
                ) : null}
                <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="flex gap-2">
                  <Input
                    placeholder={chatMode === "session" ? "Type session message..." : "Type normal message..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={chatMode === "session" && !isWritableSessionChat}
                    className="flex-1"
                  />
                  <Button type="submit" size="sm" disabled={!newMessage.trim() || sending || (chatMode === "session" && (!activeSessionId || !isWritableSessionChat))}>
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send message</span>
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <ListChecks className="mb-4 h-16 w-16 text-muted-foreground/20" />
              <h3 className="text-lg font-semibold text-foreground">Select a conversation</h3>
              <p className="mt-1 text-sm text-muted-foreground">Choose a partner to open normal or session chat.</p>
              <Button variant="outline" className="mt-4 gap-2" onClick={() => router.push("/explore")}>
                <Users className="h-4 w-4" />
                Find Matches
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  )
}
