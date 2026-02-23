"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import useSWR, { mutate } from "swr"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertCircle,
  BellRing,
  Bot,
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Star,
  Timer,
  Trash2,
  Video,
  X,
  XCircle,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function SessionTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = new Date(startTime).getTime()
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60

  return (
    <span className="font-mono text-lg font-bold text-primary">
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </span>
  )
}

function formatRemaining(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const mins = Math.floor(totalSec / 60)
  const secs = totalSec % 60
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
}

function SessionsContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const createMode = searchParams.get("create") === "true"
  const partnerIdParam = searchParams.get("partner") || ""
  const skillParam = searchParams.get("skill") || ""

  const [showCreate, setShowCreate] = useState(createMode)
  const [creating, setCreating] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showRating, setShowRating] = useState<string | null>(null)
  const [ratingForm, setRatingForm] = useState({ punctuality: 5, teachingQuality: 5, behavior: 5, comment: "" })
  const [questionDrafts, setQuestionDrafts] = useState<Record<string, string>>({})
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({})
  const [questionLoading, setQuestionLoading] = useState<string | null>(null)
  const [answerLoading, setAnswerLoading] = useState<string | null>(null)
  const [sessionDeleteError, setSessionDeleteError] = useState<string>("")
  const [nowTick, setNowTick] = useState(Date.now())

  const [newSession, setNewSession] = useState({
    partnerId: partnerIdParam,
    skill: skillParam,
    role: "learner",
    mode: "online",
    startTime: new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16),
    plannedDuration: 60,
  })

  const { data } = useSWR(user ? "/api/sessions" : null, fetcher, { refreshInterval: 5000 })
  const { data: usersData } = useSWR(user ? "/api/users" : null, fetcher)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  if (loading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const sessions = data?.sessions || []
  const history = data?.history || []
  const historyCount = data?.historyCount || 0
  const users = usersData?.users || []
  const activeSessions = sessions.filter((s: { status: string }) => s.status === "active")
  const scheduledSessions = sessions.filter((s: { status: string }) => s.status === "scheduled")
  const completedSessions = sessions.filter((s: { status: string; isDeletedForUser?: boolean }) => s.status === "completed" && !s.isDeletedForUser)
  const pendingTeacherQuestions = completedSessions.filter((s: { hasTeacherPendingQuestion?: boolean }) => s.hasTeacherPendingQuestion).length

  const handleCreateSession = async () => {
    setCreating(true)
    try {
      const teacherId = newSession.role === "learner" ? newSession.partnerId : user.id
      const learnerId = newSession.role === "learner" ? user.id : newSession.partnerId

      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          learnerId,
          skill: newSession.skill,
          startTime: newSession.startTime,
          plannedDuration: newSession.plannedDuration,
          mode: newSession.mode,
        }),
      })
      setShowCreate(false)
      mutate("/api/sessions")
    } finally {
      setCreating(false)
    }
  }

  const handleAction = async (sessionId: string, action: string) => {
    setActionLoading(`${sessionId}-${action}`)
    try {
      const res = await fetch("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, action }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSessionDeleteError(data?.error || "Unable to update session")
      } else {
        setSessionDeleteError("")
      }
      mutate("/api/sessions")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteCompletedSession = async (sessionId: string) => {
    setActionLoading(`${sessionId}-delete`)
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSessionDeleteError(data?.error || "Unable to delete completed session")
      } else {
        setSessionDeleteError("")
      }
      mutate("/api/sessions")
    } finally {
      setActionLoading(null)
    }
  }

  const handleRate = async (sessionId: string, ratedUserId: string) => {
    try {
      await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, ratedUserId, ...ratingForm }),
      })
      setShowRating(null)
      setRatingForm({ punctuality: 5, teachingQuality: 5, behavior: 5, comment: "" })
    } catch {
      // keep silent
    }
  }

  const handleAskQuestion = async (sessionId: string) => {
    const question = (questionDrafts[sessionId] || "").trim()
    if (!question) return
    setQuestionLoading(sessionId)
    try {
      const res = await fetch("/api/session-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, question }),
      })
      if (res.ok) {
        setQuestionDrafts((p) => ({ ...p, [sessionId]: "" }))
        mutate("/api/sessions")
      }
    } finally {
      setQuestionLoading(null)
    }
  }

  const handleAnswerQuestion = async (questionId: string, sessionId: string) => {
    const answer = (answerDrafts[sessionId] || "").trim()
    if (!answer) return
    setAnswerLoading(sessionId)
    try {
      const res = await fetch("/api/session-questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, answer }),
      })
      if (res.ok) {
        setAnswerDrafts((p) => ({ ...p, [sessionId]: "" }))
        mutate("/api/sessions")
      }
    } finally {
      setAnswerLoading(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <Play className="h-4 w-4 text-primary" />
      case "scheduled": return <Clock className="h-4 w-4 text-chart-2" />
      case "completed": return <CheckCircle className="h-4 w-4 text-primary" />
      case "cancelled": return <XCircle className="h-4 w-4 text-destructive" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sessions</h1>
          <p className="mt-1 text-muted-foreground">Run sessions, track AI context, and handle post-session Q&A smoothly.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Session
        </Button>
      </div>

      {showCreate && (
        <Card className="mb-6 border-2 border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Schedule New Session</CardTitle>
            <CardDescription>Pick exact date, time, and duration for your next session.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Choose Partner</Label>
              <Select value={newSession.partnerId} onValueChange={(v) => setNewSession((p) => ({ ...p, partnerId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a partner" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u: { id: string; name: string; city: string; trustScore: number }) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} - {u.city} - Trust {u.trustScore}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Skill</Label>
              <Input value={newSession.skill} onChange={(e) => setNewSession((p) => ({ ...p, skill: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Start Date & Time</Label>
              <Input type="datetime-local" value={newSession.startTime} onChange={(e) => setNewSession((p) => ({ ...p, startTime: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Planned Duration (minutes)</Label>
              <Input type="number" min={1} value={newSession.plannedDuration} onChange={(e) => setNewSession((p) => ({ ...p, plannedDuration: Number(e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Your Role</Label>
              <Select value={newSession.role} onValueChange={(v) => setNewSession((p) => ({ ...p, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="learner">Learner (I want to learn)</SelectItem>
                  <SelectItem value="teacher">Teacher (I will teach)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Session Mode</Label>
              <Select value={newSession.mode} onValueChange={(v) => setNewSession((p) => ({ ...p, mode: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline Meet Request</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateSession} disabled={creating || !newSession.partnerId || !newSession.skill || !newSession.startTime}>
                {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Session"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeSessions.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Play className="h-5 w-5 text-primary" />
            Active Sessions
          </h2>
          <div className="space-y-3">
            {activeSessions.map((session: { id: string; skill: string; status: string; startTime: string; meetingRoomId?: string; meetingUrl?: string; teacherId: string; teacher?: { id: string; name: string }; learner?: { id: string; name: string } }) => (
              <Card key={session.id} className="border-2 border-primary/20 shadow-sm">
                <CardContent className="flex flex-col items-center justify-between gap-4 p-5 sm:flex-row">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(session.status)}
                    <div>
                      <p className="font-semibold text-foreground">{session.skill}</p>
                      <p className="text-xs text-muted-foreground">
                        {session.teacherId === user.id ? `Teaching ${session.learner?.name}` : `Learning from ${session.teacher?.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {session.startTime && <SessionTimer startTime={session.startTime} />}
                    <div className="flex gap-2">
                      {session.meetingUrl ? (
                        <a href={session.meetingUrl} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="outline">
                            <Video className="mr-1 h-3.5 w-3.5" /> Join Video
                          </Button>
                        </a>
                      ) : null}
                      <Link href={`/chat?partner=${session.teacherId === user.id ? session.learner?.id : session.teacher?.id}`}>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="mr-1 h-3.5 w-3.5" /> Chat
                        </Button>
                      </Link>
                      <Button size="sm" variant="outline" onClick={() => handleAction(session.id, "end")} disabled={actionLoading === `${session.id}-end`}>
                        <Pause className="mr-1 h-3.5 w-3.5" /> End
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {scheduledSessions.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Clock className="h-5 w-5 text-chart-2" />
            Scheduled ({scheduledSessions.length})
          </h2>
          <div className="space-y-3">
            {scheduledSessions.map((session: { id: string; skill: string; status: string; startTime?: string; plannedDuration?: number; meetingRoomId?: string; meetingUrl?: string; teacherId: string; teacher?: { id: string; name: string }; learner?: { id: string; name: string } }) => (
              <Card key={session.id} className="border border-border shadow-sm">
                <CardContent className="flex flex-col items-center justify-between gap-4 p-5 sm:flex-row">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(session.status)}
                    <div>
                      <p className="font-semibold text-foreground">{session.skill}</p>
                      <p className="text-xs text-muted-foreground">
                        {session.teacherId === user.id ? `Teaching ${session.learner?.name}` : `Learning from ${session.teacher?.name}`}
                      </p>
                      {session.startTime && (
                        <p className="text-xs text-muted-foreground">
                          Scheduled: {new Date(session.startTime).toLocaleDateString()} at {new Date(session.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                      {session.plannedDuration ? <p className="text-xs text-muted-foreground">Planned Duration: {session.plannedDuration} min</p> : null}
                      {session.meetingRoomId ? <p className="text-xs text-muted-foreground">Meeting ID: {session.meetingRoomId}</p> : null}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {session.meetingUrl ? (
                      <a href={session.meetingUrl} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline">
                          <Video className="mr-1 h-3.5 w-3.5" /> Join Video
                        </Button>
                      </a>
                    ) : null}
                    <Link href={`/chat?partner=${session.teacherId === user.id ? session.learner?.id : session.teacher?.id}`}>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="mr-1 h-3.5 w-3.5" /> Chat
                      </Button>
                    </Link>
                    <Button size="sm" onClick={() => handleAction(session.id, "start")} disabled={actionLoading === `${session.id}-start`}>
                      <Play className="mr-1 h-3.5 w-3.5" /> Start
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAction(session.id, "cancel")} disabled={actionLoading === `${session.id}-cancel`} className="text-destructive">
                      <X className="mr-1 h-3.5 w-3.5" /> Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <CheckCircle className="h-5 w-5 text-primary" />
          Completed ({completedSessions.length})
          {pendingTeacherQuestions > 0 && (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-1 text-xs font-medium text-accent-foreground">
              <BellRing className="h-3.5 w-3.5" /> {pendingTeacherQuestions} new question{pendingTeacherQuestions > 1 ? "s" : ""}
            </span>
          )}
        </h2>
        {sessionDeleteError ? (
          <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {sessionDeleteError}
          </div>
        ) : null}

        {completedSessions.length === 0 ? (
          <Card className="border border-border">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <Timer className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No completed sessions yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {completedSessions.map((session: {
              id: string
              skill: string
              status: string
              duration?: number
              creditsTransferred?: number
              summary?: string
              summaryUpdatedAt?: string
              endTime?: string
              createdAt: string
              meetingRoomId?: string
              meetingUrl?: string
              aiInsights?: Array<{ title: string; content: string; createdAt: string }>
              teacherId: string
              learnerId: string
              teacher?: { id: string; name: string }
              learner?: { id: string; name: string }
              followUpQuestion?: { id: string; question: string; answer: string; askedAt: string; answeredAt?: string } | null
              questionWindowEndsAt?: string
              canLearnerAskFollowUp?: boolean
              hasTeacherPendingQuestion?: boolean
              isDeletedForUser?: boolean
              historyHeading?: string
            }) => {
              const remainingMs = session.questionWindowEndsAt ? new Date(session.questionWindowEndsAt).getTime() - nowTick : 0
              const windowOpen = remainingMs > 0
              const followUp = session.followUpQuestion
              return (
                <Card key={session.id} className={`border shadow-sm ${session.hasTeacherPendingQuestion ? "border-accent/60" : "border-border"}`}>
                  <CardContent className="p-5">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(session.status)}
                        <div>
                          <p className="font-semibold text-foreground">{session.skill}</p>
                          <p className="text-xs text-muted-foreground">
                            {session.teacherId === user.id ? `Taught ${session.learner?.name}` : `Learned from ${session.teacher?.name}`}
                          </p>
                          <div className="mt-1 flex gap-3">
                            {session.duration ? <span className="text-xs text-muted-foreground">{session.duration} min</span> : null}
                            {session.creditsTransferred ? <span className="text-xs text-primary">{session.creditsTransferred} credits processed</span> : null}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/chat?partner=${session.teacherId === user.id ? session.learner?.id : session.teacher?.id}`}>
                          <Button size="sm" variant="outline">
                            <MessageSquare className="mr-1 h-3.5 w-3.5" /> Chat
                          </Button>
                        </Link>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowRating(session.id)}>
                        <Star className="h-3.5 w-3.5" />
                        Rate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-destructive"
                        onClick={() => handleDeleteCompletedSession(session.id)}
                        disabled={actionLoading === `${session.id}-delete`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {actionLoading === `${session.id}-delete` ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </div>

                    {session.summary && (
                      <div className="mt-3 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                        <strong className="text-foreground">AI Summary:</strong> {session.summary}
                        {session.summaryUpdatedAt ? <p className="mt-1 text-[11px] text-muted-foreground">Updated: {new Date(session.summaryUpdatedAt).toLocaleString()}</p> : null}
                      </div>
                    )}
                    {session.meetingRoomId ? (
                      <div className="mt-2 rounded-lg border border-border bg-card p-2 text-xs text-muted-foreground">
                        Meeting ID: <span className="font-medium text-foreground">{session.meetingRoomId}</span>
                        {session.meetingUrl ? (
                          <a href={session.meetingUrl} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center text-primary hover:underline">
                            <ExternalLink className="mr-1 h-3 w-3" /> Open Meeting
                          </a>
                        ) : null}
                      </div>
                    ) : null}

                    {session.aiInsights && session.aiInsights.length > 0 && (
                      <div className="mt-3 rounded-lg border border-border bg-card p-3">
                        <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <Bot className="h-3.5 w-3.5" />
                          Agent Insights
                        </p>
                        <div className="space-y-2">
                          {session.aiInsights.slice(-2).reverse().map((insight, index) => (
                            <div key={`${session.id}-insight-${index}`} className="rounded-md bg-muted/50 p-2">
                              <p className="text-xs font-medium text-foreground">{insight.title}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{insight.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 rounded-lg border border-border bg-card p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Post-session Q&A</p>
                      {session.learnerId === user.id && !followUp && (
                        <div className="mt-2 space-y-2">
                          {session.canLearnerAskFollowUp && windowOpen ? (
                            <>
                              <p className="text-xs text-primary">You can ask one follow-up question for {formatRemaining(remainingMs)}.</p>
                              <Textarea
                                placeholder="Ask your follow-up question about what you learned..."
                                value={questionDrafts[session.id] || ""}
                                onChange={(e) => setQuestionDrafts((p) => ({ ...p, [session.id]: e.target.value }))}
                                className="min-h-20"
                              />
                              <Button size="sm" onClick={() => handleAskQuestion(session.id)} disabled={questionLoading === session.id || !(questionDrafts[session.id] || "").trim()}>
                                {questionLoading === session.id ? "Posting..." : "Post Question"}
                              </Button>
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground">Question window closed. You had 15 minutes after session end to ask.</p>
                          )}
                        </div>
                      )}

                      {followUp && (
                        <div className="mt-2 space-y-2">
                          <div className="rounded-md bg-muted/50 p-2">
                            <p className="text-xs font-medium text-foreground">Learner Question</p>
                            <p className="mt-1 text-xs text-muted-foreground">{followUp.question}</p>
                            <p className="mt-1 text-[11px] text-muted-foreground">Asked: {new Date(followUp.askedAt).toLocaleString()}</p>
                          </div>

                          {followUp.answer ? (
                            <div className="rounded-md bg-primary/10 p-2">
                              <p className="text-xs font-medium text-foreground">Teacher Answer</p>
                              <p className="mt-1 text-xs text-muted-foreground">{followUp.answer}</p>
                              {followUp.answeredAt ? <p className="mt-1 text-[11px] text-muted-foreground">Answered: {new Date(followUp.answeredAt).toLocaleString()}</p> : null}
                            </div>
                          ) : session.teacherId === user.id ? (
                            <div className="space-y-2 rounded-md border border-accent/40 bg-accent/10 p-2">
                              <p className="flex items-center gap-1 text-xs font-medium text-accent-foreground">
                                <BellRing className="h-3.5 w-3.5" /> New learner question waiting for your answer
                              </p>
                              <Textarea
                                placeholder="Type your answer..."
                                value={answerDrafts[session.id] || ""}
                                onChange={(e) => setAnswerDrafts((p) => ({ ...p, [session.id]: e.target.value }))}
                                className="min-h-20"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleAnswerQuestion(followUp.id, session.id)}
                                disabled={answerLoading === session.id || !(answerDrafts[session.id] || "").trim()}
                              >
                                {answerLoading === session.id ? "Posting..." : "Post Answer"}
                              </Button>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">Teacher has not answered yet.</p>
                          )}
                        </div>
                      )}
                    </div>

                    {showRating === session.id && (
                      <div className="mt-4 space-y-3 rounded-lg border border-border bg-card p-4">
                        <h4 className="text-sm font-semibold text-foreground">Rate this session</h4>
                        {(["punctuality", "teachingQuality", "behavior"] as const).map((field) => (
                          <div key={field} className="space-y-1">
                            <Label className="text-xs capitalize">{field.replace(/([A-Z])/g, " $1").trim()}</Label>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() => setRatingForm((p) => ({ ...p, [field]: n }))}
                                  className={`flex h-8 w-8 items-center justify-center rounded text-sm ${n <= ratingForm[field] ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                                >
                                  {n}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                        <div className="space-y-1">
                          <Label className="text-xs">Comment (optional)</Label>
                          <Input placeholder="Share your experience..." value={ratingForm.comment} onChange={(e) => setRatingForm((p) => ({ ...p, comment: e.target.value }))} />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              const ratedUserId = session.teacherId === user.id ? session.learnerId : session.teacherId
                              handleRate(session.id, ratedUserId)
                            }}
                          >
                            Submit Rating
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setShowRating(null)}>Cancel</Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Session History */}
      {historyCount > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Session History ({historyCount})
          </h2>
          <div className="space-y-3">
            {history.map((item: { id: string; title: string; completedAt: string }) => (
              <Card key={item.id} className="border border-border shadow-sm">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Session completed.</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Completed: {new Date(item.completedAt).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SessionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <SessionsContent />
    </Suspense>
  )
}
