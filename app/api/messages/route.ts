import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { getCurrentUser } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { MessageModel } from "@/lib/models/Message"
import { SessionModel } from "@/lib/models/Session"
import { UserModel } from "@/lib/models/User"
import { NotificationModel } from "@/lib/models/Notification"
import { generateRollingSessionSummary } from "@/lib/ai"
import { serializeUser } from "@/lib/serializers"

async function validateSessionChat(sessionId: string, userId: string, partnerId: string) {
  const session = await SessionModel.findById(sessionId)
  if (!session) return null
  const participants = [session.teacherId.toString(), session.learnerId.toString()]
  if (!participants.includes(userId) || !participants.includes(partnerId)) {
    return null
  }
  return session
}

async function ensureSessionWritable(sessionId: string, userId: string, partnerId: string) {
  const session = await validateSessionChat(sessionId, userId, partnerId)
  if (!session) return null

  if (session.status === "scheduled") {
    session.status = "active"
    if (!session.startTime) {
      session.startTime = new Date()
    }
    session.endTime = undefined
    session.duration = undefined
    session.creditsTransferred = 0
    await session.save()
  }

  if (session.status !== "active") {
    return null
  }
  return session
}

async function refreshSessionSummary(sessionId: string) {
  try {
    const session = await SessionModel.findById(sessionId)
    if (!session) return

    const [teacher, learner, sessionMessages] = await Promise.all([
      UserModel.findById(session.teacherId),
      UserModel.findById(session.learnerId),
      MessageModel.find({ sessionId: session._id }).sort({ createdAt: 1 }).limit(150),
    ])

    if (!teacher || !learner) return
    const messages = sessionMessages

    const summary = await generateRollingSessionSummary({
      skill: session.skill,
      duration: Math.max(1, session.duration || session.plannedDuration || 60),
      teacherName: teacher.name,
      learnerName: learner.name,
      previousSummary: session.summary,
      messages: messages.map((m) => ({
        senderName: m.senderId.toString() === teacher._id.toString() ? teacher.name : learner.name,
        message: m.message,
        timestamp: m.createdAt.toISOString(),
      })),
    })

    session.summary = summary
    session.summaryUpdatedAt = new Date()
    await session.save()
  } catch (error) {
    console.error("Refresh session summary error:", error)
  }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  await connectDb()
  const partnerId = request.nextUrl.searchParams.get("partnerId")
  const scope = request.nextUrl.searchParams.get("scope") || "normal"
  const sessionId = request.nextUrl.searchParams.get("sessionId")

  if (partnerId) {
    let query: Record<string, unknown> = {
      $or: [
        { senderId: user.id, receiverId: partnerId },
        { senderId: partnerId, receiverId: user.id },
      ],
    }
    if (scope === "session") {
      if (!sessionId) {
        return NextResponse.json({ error: "sessionId is required for session scope" }, { status: 400 })
      }
      const session = await validateSessionChat(sessionId, user.id, partnerId)
      if (!session) {
        return NextResponse.json({ error: "Invalid session for this chat" }, { status: 403 })
      }
      query = { ...query, sessionId: session._id }
    } else {
      query = {
        $and: [
          query,
          { $or: [{ sessionId: { $exists: false } }, { sessionId: null }] },
        ],
      }
    }

    const messages = await MessageModel.find(query).sort({ createdAt: 1 })

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m._id.toString(),
        senderId: m.senderId.toString(),
        receiverId: m.receiverId.toString(),
        sessionId: m.sessionId?.toString(),
        message: m.message,
        timestamp: m.createdAt.toISOString(),
      })),
    })
  }

  const userObjectId = new mongoose.Types.ObjectId(user.id)
  const conversationRows = await MessageModel.aggregate([
    {
      $match: {
        $and: [
          { $or: [{ sessionId: { $exists: false } }, { sessionId: null }] },
          { $or: [{ senderId: userObjectId }, { receiverId: userObjectId }] },
        ],
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $addFields: {
        partnerId: {
          $cond: [{ $eq: ["$senderId", userObjectId] }, "$receiverId", "$senderId"],
        },
      },
    },
    {
      $group: {
        _id: "$partnerId",
        lastMessage: { $first: "$$ROOT" },
      },
    },
  ])

  const partnerIds = conversationRows.map((r) => r._id.toString())
  const partnerUsers = await UserModel.find({ _id: { $in: partnerIds } })
  const userMap = new Map(partnerUsers.map((u) => [u._id.toString(), serializeUser(u)]))

  const partners = conversationRows
    .map((row) => {
      const pid = row._id.toString()
      const partner = userMap.get(pid)
      if (!partner) return null
      return {
        user: partner,
        lastMessage: {
          message: row.lastMessage.message,
          timestamp: row.lastMessage.createdAt.toISOString(),
          senderId: row.lastMessage.senderId.toString(),
        },
      }
    })
    .filter(Boolean)

  return NextResponse.json({ partners })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    await connectDb()
    const body = await request.json()
    const { receiverId, message, sessionId } = body

    if (!receiverId || !message) {
      return NextResponse.json({ error: "Receiver and message are required" }, { status: 400 })
    }

    const receiver = await UserModel.findById(receiverId)
    if (!receiver) {
      return NextResponse.json({ error: "Receiver not found" }, { status: 404 })
    }

    let linkedSessionId: mongoose.Types.ObjectId | undefined
    if (sessionId) {
      const session = await ensureSessionWritable(sessionId, user.id, receiverId)
      if (!session) {
        return NextResponse.json({ error: "Session chat is read-only after session closes" }, { status: 400 })
      }
      linkedSessionId = session._id
    }

    const msg = await MessageModel.create({
      senderId: user.id,
      receiverId,
      sessionId: linkedSessionId,
      message,
    })
    if (linkedSessionId) {
      await refreshSessionSummary(linkedSessionId.toString())
    }
    await NotificationModel.create({
      recipientId: receiver._id,
      senderId: user.id,
      type: "message",
      title: "New message",
      body: String(message).slice(0, 140),
      relatedSessionId: linkedSessionId,
      relatedUserId: user.id,
    })

    return NextResponse.json(
      {
        message: {
          id: msg._id.toString(),
          senderId: msg.senderId.toString(),
          receiverId: msg.receiverId.toString(),
          sessionId: msg.sessionId?.toString(),
          message: msg.message,
          timestamp: msg.createdAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Send message error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  await connectDb()
  const partnerId = request.nextUrl.searchParams.get("partnerId")
  const scope = request.nextUrl.searchParams.get("scope") || "normal"

  if (!partnerId) {
    return NextResponse.json({ error: "partnerId is required" }, { status: 400 })
  }
  if (scope !== "normal") {
    return NextResponse.json({ error: "Only normal chat can be cleared" }, { status: 400 })
  }

  const result = await MessageModel.deleteMany({
    $and: [
      {
        $or: [
          { senderId: user.id, receiverId: partnerId },
          { senderId: partnerId, receiverId: user.id },
        ],
      },
      { $or: [{ sessionId: { $exists: false } }, { sessionId: null }] },
    ],
  })

  return NextResponse.json({ deletedCount: result.deletedCount || 0 })
}
