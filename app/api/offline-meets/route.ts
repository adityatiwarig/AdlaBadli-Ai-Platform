import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { NotificationModel } from "@/lib/models/Notification"
import { UserModel } from "@/lib/models/User"

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    await connectDb()
    const body = await request.json()
    const { partnerId, topic, location, proposedTime, note } = body as {
      partnerId?: string
      topic?: string
      location?: string
      proposedTime?: string
      note?: string
    }

    if (!partnerId || !topic?.trim()) {
      return NextResponse.json({ error: "partnerId and topic are required" }, { status: 400 })
    }
    if (partnerId === user.id) {
      return NextResponse.json({ error: "You cannot request offline meet with yourself" }, { status: 400 })
    }

    const partner = await UserModel.findById(partnerId)
    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 })
    }

    const pieces = [
      `Topic: ${topic.trim()}`,
      location?.trim() ? `Location: ${location.trim()}` : "",
      proposedTime?.trim() ? `Time: ${proposedTime.trim()}` : "",
      note?.trim() ? `Note: ${note.trim()}` : "",
    ].filter(Boolean)

    const created = await NotificationModel.create({
      recipientId: partner._id,
      senderId: user.id,
      type: "offline_meet_request",
      title: "Offline meet request",
      body: pieces.join(" | ").slice(0, 400),
      relatedUserId: user.id,
    })

    return NextResponse.json(
      {
        notification: {
          id: created._id.toString(),
          title: created.title,
          body: created.body,
          createdAt: created.createdAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Offline meet request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
