import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { RatingModel } from "@/lib/models/Rating"
import { SessionModel } from "@/lib/models/Session"
import { UserModel } from "@/lib/models/User"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }
  await connectDb()
  const ratings = await RatingModel.find({ ratedUserId: user.id }).sort({ createdAt: -1 })
  return NextResponse.json({ ratings })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    await connectDb()
    const body = await request.json()
    const { sessionId, ratedUserId, punctuality, teachingQuality, behavior, comment } = body

    if (!sessionId || !ratedUserId || !punctuality || !teachingQuality || !behavior) {
      return NextResponse.json({ error: "All rating fields are required" }, { status: 400 })
    }

    const session = await SessionModel.findById(sessionId)
    if (!session || session.status !== "completed") {
      return NextResponse.json({ error: "You can only rate completed sessions" }, { status: 400 })
    }

    if (session.teacherId.toString() !== user.id && session.learnerId.toString() !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const rating = await RatingModel.create({
      sessionId,
      raterId: user.id,
      ratedUserId,
      punctuality,
      teachingQuality,
      behavior,
      comment: comment || "",
    })

    const userRatings = await RatingModel.find({ ratedUserId })
    const avgPunctuality = userRatings.reduce((sum, r) => sum + r.punctuality, 0) / userRatings.length
    const avgQuality = userRatings.reduce((sum, r) => sum + r.teachingQuality, 0) / userRatings.length
    const avgBehavior = userRatings.reduce((sum, r) => sum + r.behavior, 0) / userRatings.length
    const trustScore = Math.round(((avgPunctuality + avgQuality + avgBehavior) / 15) * 100)
    const reliabilityScore = Math.round(((avgPunctuality + avgBehavior) / 10) * 100)

    await UserModel.findByIdAndUpdate(ratedUserId, { trustScore, reliabilityScore })

    return NextResponse.json({ rating }, { status: 201 })
  } catch (error) {
    console.error("Create rating error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
