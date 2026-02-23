import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { MessageModel } from "@/lib/models/Message"
import { SessionModel } from "@/lib/models/Session"
import { UserModel } from "@/lib/models/User"
import { AgentType, generateAgentResponse, pickAgentTypes } from "@/lib/ai"

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    await connectDb()
    const body = await request.json()
    const { agent, partnerId, sessionId, focus } = body as {
      agent?: AgentType
      partnerId?: string
      sessionId?: string
      focus?: string
    }

    if (!partnerId || !agent || !pickAgentTypes().includes(agent)) {
      return NextResponse.json({ error: "Valid agent and partnerId are required" }, { status: 400 })
    }

    const [partner, inferredSession] = await Promise.all([
      UserModel.findById(partnerId),
      sessionId
        ? SessionModel.findById(sessionId)
        : SessionModel.findOne({
            status: { $in: ["active", "completed", "scheduled"] },
            $or: [
              { teacherId: user.id, learnerId: partnerId },
              { teacherId: partnerId, learnerId: user.id },
            ],
          }).sort({ updatedAt: -1 }),
    ])

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 })
    }

    const session = inferredSession
    if (!session) {
      return NextResponse.json({ error: "No session found. Start or select a session chat first." }, { status: 400 })
    }
    const participants = [session.teacherId.toString(), session.learnerId.toString()]
    if (!participants.includes(user.id) || !participants.includes(partnerId)) {
      return NextResponse.json({ error: "Invalid session context for these users" }, { status: 403 })
    }

    const messages = await MessageModel.find({ sessionId: session._id }).sort({ createdAt: -1 }).limit(80)

    const skill = session.skill || (partner.teachSkills?.[0] || "general skill exchange")
    const response = await generateAgentResponse({
      agent,
      partnerName: partner.name,
      skill,
      summary: [session.summary || "", focus?.trim() ? `User focus: ${focus.trim()}` : ""].filter(Boolean).join("\n"),
      messages: messages.reverse().map((m) => ({
        senderName: m.senderId.toString() === user.id ? "You" : partner.name,
        message: m.message,
        timestamp: m.createdAt.toISOString(),
      })),
    })

    await SessionModel.findByIdAndUpdate(session._id, {
      $push: {
        aiInsights: {
          agent,
          title: response.title,
          content: response.content,
          createdAt: new Date(),
        },
      },
    })

    return NextResponse.json({ result: response, sessionId: session._id.toString() })
  } catch (error) {
    console.error("Agent response error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
