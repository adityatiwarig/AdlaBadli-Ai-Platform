import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { SessionModel } from "@/lib/models/Session"
import { SessionQuestionModel } from "@/lib/models/SessionQuestion"

const QUESTION_WINDOW_MINUTES = 15

function questionWindowEndsAt(endTime?: Date): Date | null {
  if (!endTime) return null
  return new Date(endTime.getTime() + QUESTION_WINDOW_MINUTES * 60 * 1000)
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    await connectDb()
    const body = await request.json()
    const { sessionId, question } = body as { sessionId?: string; question?: string }

    if (!sessionId || !question?.trim()) {
      return NextResponse.json({ error: "sessionId and question are required" }, { status: 400 })
    }

    const session = await SessionModel.findById(sessionId)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }
    if (session.status !== "completed" || !session.endTime) {
      return NextResponse.json({ error: "Question can only be asked after completed session" }, { status: 400 })
    }
    if (session.learnerId.toString() !== user.id) {
      return NextResponse.json({ error: "Only learner can ask follow-up question" }, { status: 403 })
    }

    const windowEnds = questionWindowEndsAt(session.endTime)
    if (!windowEnds || Date.now() > windowEnds.getTime()) {
      return NextResponse.json({ error: "Question window expired (15 minutes after session end)" }, { status: 400 })
    }

    const existing = await SessionQuestionModel.findOne({ sessionId: session._id, learnerId: user.id })
    if (existing) {
      return NextResponse.json({ error: "Follow-up question already posted for this session" }, { status: 409 })
    }

    const created = await SessionQuestionModel.create({
      sessionId: session._id,
      learnerId: session.learnerId,
      teacherId: session.teacherId,
      question: question.trim(),
      askedAt: new Date(),
    })

    return NextResponse.json(
      {
        question: {
          id: created._id.toString(),
          sessionId: created.sessionId.toString(),
          learnerId: created.learnerId.toString(),
          teacherId: created.teacherId.toString(),
          question: created.question,
          answer: created.answer || "",
          askedAt: created.askedAt.toISOString(),
          answeredAt: created.answeredAt?.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create session question error:", error)
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
    const body = await request.json()
    const { questionId, answer } = body as { questionId?: string; answer?: string }

    if (!questionId || !answer?.trim()) {
      return NextResponse.json({ error: "questionId and answer are required" }, { status: 400 })
    }

    const questionDoc = await SessionQuestionModel.findById(questionId)
    if (!questionDoc) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }
    if (questionDoc.teacherId.toString() !== user.id) {
      return NextResponse.json({ error: "Only teacher can answer this question" }, { status: 403 })
    }

    questionDoc.answer = answer.trim()
    questionDoc.answeredAt = new Date()
    await questionDoc.save()

    return NextResponse.json({
      question: {
        id: questionDoc._id.toString(),
        sessionId: questionDoc.sessionId.toString(),
        learnerId: questionDoc.learnerId.toString(),
        teacherId: questionDoc.teacherId.toString(),
        question: questionDoc.question,
        answer: questionDoc.answer || "",
        askedAt: questionDoc.askedAt.toISOString(),
        answeredAt: questionDoc.answeredAt?.toISOString(),
      },
    })
  } catch (error) {
    console.error("Answer session question error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
