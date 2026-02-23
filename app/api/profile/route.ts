import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { UserModel } from "@/lib/models/User"
import { serializeUser } from "@/lib/serializers"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }
  return NextResponse.json({ user })
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    await connectDb()
    const body = await request.json()
    const {
      name,
      city,
      area,
      teachSkills,
      learnSkills,
      skillLevel,
      learningStyle,
      languages,
      availabilitySlots,
      offlineMeetPreferred,
      bio,
    } = body

    const updated = await UserModel.findByIdAndUpdate(
      user.id,
      {
        ...(name && { name }),
        ...(city && { city }),
        ...(area !== undefined && { area }),
        ...(teachSkills && { teachSkills }),
        ...(learnSkills && { learnSkills }),
        ...(skillLevel && { skillLevel }),
        ...(learningStyle && { learningStyle }),
        ...(languages && { languages }),
        ...(availabilitySlots && { availabilitySlots }),
        ...(offlineMeetPreferred !== undefined && { offlineMeetPreferred: Boolean(offlineMeetPreferred) }),
        ...(bio !== undefined && { bio }),
      },
      { new: true }
    )

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user: serializeUser(updated) })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
