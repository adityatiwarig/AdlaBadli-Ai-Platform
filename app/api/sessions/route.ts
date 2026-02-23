import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { SessionModel } from "@/lib/models/Session"
import { MessageModel } from "@/lib/models/Message"
import { SessionQuestionModel } from "@/lib/models/SessionQuestion"
import { UserModel } from "@/lib/models/User"
import { NotificationModel } from "@/lib/models/Notification"
import { RatingModel } from "@/lib/models/Rating"
import { SessionHistoryModel } from "@/lib/models/SessionHistory"
import { generateRollingSessionSummary } from "@/lib/ai"
import { publishSessionCompletedEvent } from "@/lib/inngest"

const CREDITS_PER_MINUTE = 10
const QUESTION_WINDOW_MINUTES = 15

function buildMeetingRoomId(sessionId: string) {
  return `adlabadli-${sessionId.slice(-10)}`
}

function buildNewMeetingRoomId() {
  return `adlabadli-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

type FollowUpView = {
  id: string
  learnerId: string
  teacherId: string
  question: string
  answer: string
  askedAt: string
  answeredAt?: string
}

type SessionViewInput = {
  _id: { toString(): string }
  teacherId: { _id?: { toString(): string }; toString?: () => string; name?: string; email?: string } | string
  learnerId: { _id?: { toString(): string }; toString?: () => string; name?: string; email?: string } | string
  skill: string
  status: string
  startTime?: Date
  endTime?: Date
  plannedDuration?: number
  duration?: number
  creditsTransferred?: number
  teacherConfirmed: boolean
  learnerConfirmed: boolean
  meetingRoomId?: string
  meetingProvider?: string
  summary?: string
  summaryUpdatedAt?: Date
  aiInsights?: Array<{
    agent?: string
    title?: string
    content?: string
    createdAt?: Date
  }>
  deletedBy?: Array<{ toString(): string } | string>
  followUpQuestion?: FollowUpView | null
  currentUserId?: string
  createdAt: Date
}

function sessionView(session: SessionViewInput) {
  const teacher = typeof session.teacherId === "string"
    ? { id: session.teacherId, name: "", email: "" }
    : {
        id: session.teacherId._id?.toString() || session.teacherId.toString?.() || "",
        name: session.teacherId.name || "",
        email: session.teacherId.email || "",
      }
  const learner = typeof session.learnerId === "string"
    ? { id: session.learnerId, name: "", email: "" }
    : {
        id: session.learnerId._id?.toString() || session.learnerId.toString?.() || "",
        name: session.learnerId.name || "",
        email: session.learnerId.email || "",
      }
  const endTime = session.endTime?.toISOString()
  const isDeletedForUser = !!session.currentUserId && (session.deletedBy || []).some((id) => {
    const value = typeof id === "string" ? id : id.toString()
    return value === session.currentUserId
  })
  const meetingRoomId = session.status === "active" ? (session.meetingRoomId || buildMeetingRoomId(session._id.toString())) : undefined
  const meetingProvider = session.status === "active" ? (session.meetingProvider || "jitsi") : undefined
  const meetingUrl = meetingRoomId ? `https://meet.jit.si/${meetingRoomId}` : undefined
  const questionWindowEndsAt = session.endTime
    ? new Date(session.endTime.getTime() + QUESTION_WINDOW_MINUTES * 60 * 1000).toISOString()
    : undefined
  const canLearnerAskFollowUp =
    !!session.endTime &&
    !!session.currentUserId &&
    learner.id === session.currentUserId &&
    session.status === "completed" &&
    !session.followUpQuestion &&
    !isDeletedForUser &&
    !!questionWindowEndsAt &&
    Date.now() <= new Date(questionWindowEndsAt).getTime()
  const hasTeacherPendingQuestion =
    !!session.followUpQuestion &&
    !!session.currentUserId &&
    teacher.id === session.currentUserId &&
    !session.followUpQuestion.answer &&
    !isDeletedForUser

  return {
    id: session._id.toString(),
    teacherId: teacher.id,
    learnerId: learner.id,
    skill: session.skill,
    status: session.status,
    startTime: session.startTime?.toISOString(),
    endTime,
    plannedDuration: session.plannedDuration || 60,
    duration: session.duration || 0,
    creditsTransferred: session.creditsTransferred || 0,
    teacherConfirmed: session.teacherConfirmed,
    learnerConfirmed: session.learnerConfirmed,
    meetingRoomId,
    meetingProvider,
    meetingUrl,
    summary: isDeletedForUser ? "" : (session.summary || ""),
    summaryUpdatedAt: session.summaryUpdatedAt?.toISOString(),
    aiInsights: isDeletedForUser ? [] : (session.aiInsights || []).map((insight) => ({
      agent: insight.agent || "",
      title: insight.title || "",
      content: insight.content || "",
      createdAt: insight.createdAt?.toISOString() || new Date().toISOString(),
    })),
    followUpQuestion: isDeletedForUser ? null : (session.followUpQuestion || null),
    questionWindowEndsAt,
    canLearnerAskFollowUp,
    hasTeacherPendingQuestion,
    isDeletedForUser,
    historyHeading: `${session.skill} session`,
    createdAt: session.createdAt.toISOString(),
    teacher,
    learner,
  }
}

async function completeSession(session: {
  _id: { toString(): string }
  skill: string
  teacherId: { toString(): string; _id?: { toString(): string } }
  learnerId: { toString(): string; _id?: { toString(): string } }
  duration?: number
  plannedDuration?: number
  status: string
  creditsTransferred?: number
  summary?: string
  summaryUpdatedAt?: Date
  startTime?: Date
  endTime?: Date
  save: () => Promise<unknown>
}) {
  const [teacher, learner] = await Promise.all([
    UserModel.findById(session.teacherId),
    UserModel.findById(session.learnerId),
  ])

  if (!teacher || !learner) {
    throw new Error("Session users not found")
  }

  const durationMin = Math.max(1, session.duration || session.plannedDuration || 60)
  const credits = durationMin * CREDITS_PER_MINUTE

  // Strict transfer: teacher earns exactly what learner spends.
  const transferredCredits = Math.min(learner.credits, credits)

  session.status = "completed"
  session.creditsTransferred = transferredCredits

  await Promise.all([
    UserModel.findByIdAndUpdate(teacher._id, {
      $inc: { credits: transferredCredits, sessionsCompleted: 1 },
    }),
    UserModel.findByIdAndUpdate(learner._id, {
      $inc: { credits: -transferredCredits, sessionsCompleted: 1 },
    }),
  ])

  const messages = await MessageModel.find({ sessionId: session._id }).sort({ createdAt: 1 }).limit(120)
  const snippets = messages.map((m) => ({
    senderName: m.senderId.toString() === teacher._id.toString() ? teacher.name : learner.name,
    message: m.message,
    timestamp: m.createdAt.toISOString(),
  }))

  const summary = await generateRollingSessionSummary({
    skill: session.skill,
    duration: durationMin,
    teacherName: teacher.name,
    learnerName: learner.name,
    previousSummary: session.summary,
    messages: snippets,
  })
  session.summary = summary
  session.summaryUpdatedAt = new Date()

  const completedAt = session.endTime || new Date()
  await Promise.all([
    SessionHistoryModel.updateOne(
      { sessionId: session._id, userId: teacher._id },
      {
        $setOnInsert: {
          sessionId: session._id,
          userId: teacher._id,
          title: `${session.skill} session`,
          completedAt,
        },
      },
      { upsert: true }
    ),
    SessionHistoryModel.updateOne(
      { sessionId: session._id, userId: learner._id },
      {
        $setOnInsert: {
          sessionId: session._id,
          userId: learner._id,
          title: `${session.skill} session`,
          completedAt,
        },
      },
      { upsert: true }
    ),
  ])

  await publishSessionCompletedEvent({
    sessionId: session._id.toString(),
    teacherId: teacher._id.toString(),
    learnerId: learner._id.toString(),
    skill: session.skill,
    duration: durationMin,
  })

  await session.save()
}

function getSessionAutoEndTime(session: { startTime?: Date; plannedDuration?: number }) {
  if (!session.startTime) return null
  const planned = Math.max(1, Number(session.plannedDuration) || 60)
  return new Date(session.startTime.getTime() + planned * 60 * 1000)
}

async function autoExpireSessions() {
  const now = new Date()
  const activeSessions = await SessionModel.find({
    status: "active",
    startTime: { $exists: true, $ne: null },
    $or: [{ endTime: { $exists: false } }, { endTime: null }],
  })

  for (const session of activeSessions) {
    const autoEndAt = getSessionAutoEndTime({
      startTime: session.startTime || undefined,
      plannedDuration: session.plannedDuration,
    })
    if (!autoEndAt || autoEndAt.getTime() > now.getTime()) continue

    const locked = await SessionModel.findOneAndUpdate(
      { _id: session._id, status: "active", $or: [{ endTime: { $exists: false } }, { endTime: null }] },
      {
        $set: {
          status: "active",
          endTime: autoEndAt,
          duration: Math.max(1, Math.round((autoEndAt.getTime() - (session.startTime?.getTime() || autoEndAt.getTime())) / 60000)),
        },
      },
      { new: true }
    )
    if (!locked) continue

    await completeSession(locked as never)
  }
}

async function hardDeleteSession(sessionId: { toString(): string }) {
  await Promise.all([
    MessageModel.deleteMany({ sessionId }),
    SessionQuestionModel.deleteMany({ sessionId }),
    RatingModel.deleteMany({ sessionId }),
    NotificationModel.deleteMany({ relatedSessionId: sessionId }),
    SessionModel.deleteOne({ _id: sessionId }),
  ])
}

async function ensureSessionHistory(session: {
  _id: { toString(): string }
  teacherId: { toString(): string }
  learnerId: { toString(): string }
  skill: string
  endTime?: Date
}) {
  const completedAt = session.endTime || new Date()
  await Promise.all([
    SessionHistoryModel.updateOne(
      { sessionId: session._id, userId: session.teacherId },
      {
        $setOnInsert: {
          sessionId: session._id,
          userId: session.teacherId,
          title: `${session.skill} session`,
          completedAt,
        },
      },
      { upsert: true }
    ),
    SessionHistoryModel.updateOne(
      { sessionId: session._id, userId: session.learnerId },
      {
        $setOnInsert: {
          sessionId: session._id,
          userId: session.learnerId,
          title: `${session.skill} session`,
          completedAt,
        },
      },
      { upsert: true }
    ),
  ])
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  await connectDb()
  await autoExpireSessions()
  const sessions = await SessionModel.find({
    $or: [{ teacherId: user.id }, { learnerId: user.id }],
  })
    .populate("teacherId", "name email")
    .populate("learnerId", "name email")
    .sort({ createdAt: -1 })
  const sessionIds = sessions.map((s) => s._id)
  const followUps = await SessionQuestionModel.find({ sessionId: { $in: sessionIds } }).sort({ createdAt: -1 })
  const [historyRows, historyCount] = await Promise.all([
    SessionHistoryModel.find({ userId: user.id }).sort({ completedAt: -1 }).limit(200),
    SessionHistoryModel.countDocuments({ userId: user.id }),
  ])
  const followUpMap = new Map<string, FollowUpView>()
  for (const q of followUps) {
    followUpMap.set(q.sessionId.toString(), {
      id: q._id.toString(),
      learnerId: q.learnerId.toString(),
      teacherId: q.teacherId.toString(),
      question: q.question,
      answer: q.answer || "",
      askedAt: q.askedAt.toISOString(),
      answeredAt: q.answeredAt?.toISOString(),
    })
  }

  return NextResponse.json({
    sessions: sessions.map((s) =>
      sessionView({
        ...(s.toObject() as SessionViewInput),
        followUpQuestion: followUpMap.get(s._id.toString()) || null,
        currentUserId: user.id,
      })
    ),
    history: historyRows.map((h) => ({
      id: h._id.toString(),
      sessionId: h.sessionId.toString(),
      title: h.title,
      completedAt: h.completedAt.toISOString(),
      createdAt: h.createdAt.toISOString(),
    })),
    historyCount,
  })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    await connectDb()
    const body = await request.json()
    const { teacherId, learnerId, skill, startTime, plannedDuration, mode } = body

    if (!teacherId || !learnerId || !skill) {
      return NextResponse.json({ error: "Teacher, learner, and skill are required" }, { status: 400 })
    }
    if (teacherId === learnerId) {
      return NextResponse.json({ error: "Teacher and learner must be different users" }, { status: 400 })
    }
    if (user.id !== teacherId && user.id !== learnerId) {
      return NextResponse.json({ error: "You can only create sessions where you are a participant" }, { status: 403 })
    }

    const [teacher, learner] = await Promise.all([
      UserModel.findById(teacherId),
      UserModel.findById(learnerId),
    ])
    if (!teacher || !learner) {
      return NextResponse.json({ error: "Invalid teacher or learner" }, { status: 404 })
    }

    const session = await SessionModel.create({
      teacherId,
      learnerId,
      skill,
      status: "scheduled",
      startTime: startTime ? new Date(startTime) : new Date(Date.now() + 30 * 60 * 1000),
      plannedDuration: Math.max(1, Number(plannedDuration) || 60),
      teacherConfirmed: false,
      learnerConfirmed: false,
      meetingRoomId: buildNewMeetingRoomId(),
      meetingProvider: "jitsi",
    })

    const recipientId = user.id === teacherId ? learnerId : teacherId
    await NotificationModel.create({
      recipientId,
      senderId: user.id,
      type: mode === "offline" ? "offline_meet_request" : "session_scheduled",
      title: mode === "offline" ? "Offline meet request" : "New session scheduled",
      body: mode === "offline"
        ? `${user.name} requested an offline ${skill} session.`
        : `${user.name} scheduled a ${skill} session.`,
      relatedSessionId: session._id,
      relatedUserId: user.id,
    })

    return NextResponse.json({ session: sessionView(session as never) }, { status: 201 })
  } catch (error) {
    console.error("Create session error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    await connectDb()
    await autoExpireSessions()
    const body = await request.json()
    const { sessionId, action } = body

    const session = await SessionModel.findById(sessionId)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }
    if (session.teacherId.toString() !== user.id && session.learnerId.toString() !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (action === "start") {
      session.status = "active"
      session.startTime = new Date()
      session.endTime = undefined
      session.duration = undefined
      session.creditsTransferred = 0
      session.teacherConfirmed = false
      session.learnerConfirmed = false
      if (!session.meetingRoomId) {
        session.meetingRoomId = buildMeetingRoomId(session._id.toString())
      }
      if (!session.meetingProvider) {
        session.meetingProvider = "jitsi"
      }
      await session.save()
    } else if (action === "end") {
      if (session.status !== "active") {
        return NextResponse.json({ error: "Only active sessions can be ended" }, { status: 400 })
      }

      const now = new Date()
      const start = session.startTime ? session.startTime.getTime() : now.getTime()
      const durationMin = Math.max(1, Math.round((now.getTime() - start) / 60000))
      session.endTime = now
      session.duration = durationMin
      await completeSession(session as never)
    } else if (action === "confirm") {
      const isTeacher = session.teacherId.toString() === user.id
      if (isTeacher) {
        session.teacherConfirmed = true
      } else {
        session.learnerConfirmed = true
      }
      await session.save()
    } else if (action === "cancel") {
      session.status = "cancelled"
      await session.save()
    } else if (action === "delete") {
      if (session.status !== "completed") {
        return NextResponse.json({ error: "Only completed sessions can be deleted" }, { status: 400 })
      }
      await ensureSessionHistory(session as never)
      await hardDeleteSession(session._id)
      return NextResponse.json({
        deleted: true,
        sessionId: session._id.toString(),
        economy: { creditsPerMinute: CREDITS_PER_MINUTE },
      })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const updated = await SessionModel.findById(session._id)
      .populate("teacherId", "name email")
      .populate("learnerId", "name email")

    return NextResponse.json({
      session: sessionView({
        ...(updated?.toObject() as SessionViewInput),
        currentUserId: user.id,
      }),
      economy: { creditsPerMinute: CREDITS_PER_MINUTE },
    })
  } catch (error) {
    console.error("Update session error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    await connectDb()
    await autoExpireSessions()
    const sessionId = request.nextUrl.searchParams.get("sessionId")
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
    }

    const session = await SessionModel.findById(sessionId)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }
    if (session.teacherId.toString() !== user.id && session.learnerId.toString() !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (session.status !== "completed") {
      return NextResponse.json({ error: "Only completed sessions can be deleted" }, { status: 400 })
    }

    await ensureSessionHistory(session as never)
    await hardDeleteSession(session._id)
    return NextResponse.json({ deleted: true, sessionId: session._id.toString() })
  } catch (error) {
    console.error("Delete session error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
