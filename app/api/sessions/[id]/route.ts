import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { MessageModel } from "@/lib/models/Message"
import { NotificationModel } from "@/lib/models/Notification"
import { RatingModel } from "@/lib/models/Rating"
import { SessionModel } from "@/lib/models/Session"
import { SessionHistoryModel } from "@/lib/models/SessionHistory"
import { SessionQuestionModel } from "@/lib/models/SessionQuestion"

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    await connectDb()
    const { id } = await params
    const session = await SessionModel.findById(id)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }
    if (session.teacherId.toString() !== user.id && session.learnerId.toString() !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (session.status !== "completed") {
      return NextResponse.json({ error: "Only completed sessions can be deleted" }, { status: 400 })
    }

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

    await Promise.all([
      MessageModel.deleteMany({ sessionId: session._id }),
      SessionQuestionModel.deleteMany({ sessionId: session._id }),
      RatingModel.deleteMany({ sessionId: session._id }),
      NotificationModel.deleteMany({ relatedSessionId: session._id }),
      SessionModel.deleteOne({ _id: session._id }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete completed session by id error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
