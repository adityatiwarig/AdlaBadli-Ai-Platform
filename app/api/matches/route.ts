import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { UserModel } from "@/lib/models/User"
import { findMatches } from "@/lib/matching"
import { serializeUser } from "@/lib/serializers"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  await connectDb()
  const users = await UserModel.find({ _id: { $ne: user.id } })
  const allUsers = users.map((u) => serializeUser(u))
  const safeMatches = findMatches(user, allUsers)

  return NextResponse.json({ matches: safeMatches })
}
