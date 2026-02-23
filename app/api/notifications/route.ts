import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { NotificationModel } from "@/lib/models/Notification"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  await connectDb()
  const notifications = await NotificationModel.find({ recipientId: user.id })
    .sort({ createdAt: -1 })
    .limit(40)

  return NextResponse.json({
    notifications: notifications.map((n) => ({
      id: n._id.toString(),
      type: n.type,
      title: n.title,
      body: n.body || "",
      relatedSessionId: n.relatedSessionId?.toString(),
      relatedUserId: n.relatedUserId?.toString(),
      createdAt: n.createdAt.toISOString(),
    })),
  })
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  await connectDb()
  const id = request.nextUrl.searchParams.get("id")
  const clearAll = request.nextUrl.searchParams.get("all") === "true"

  if (clearAll) {
    const res = await NotificationModel.deleteMany({ recipientId: user.id })
    return NextResponse.json({ deletedCount: res.deletedCount || 0 })
  }

  if (!id) {
    return NextResponse.json({ error: "id or all=true is required" }, { status: 400 })
  }

  const res = await NotificationModel.deleteOne({ _id: id, recipientId: user.id })
  return NextResponse.json({ deletedCount: res.deletedCount || 0 })
}
