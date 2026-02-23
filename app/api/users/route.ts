import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { UserModel } from "@/lib/models/User"
import { serializeUser } from "@/lib/serializers"

export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  await connectDb()

  const q = request.nextUrl.searchParams.get("q")?.trim()
  const filter: Record<string, unknown> = { _id: { $ne: currentUser.id } }
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { teachSkills: { $elemMatch: { $regex: q, $options: "i" } } },
      { learnSkills: { $elemMatch: { $regex: q, $options: "i" } } },
      { city: { $regex: q, $options: "i" } },
    ]
  }

  const users = await UserModel.find(filter).limit(30).sort({ trustScore: -1, reliabilityScore: -1 })
  return NextResponse.json({ users: users.map((u) => serializeUser(u)) })
}
