import { NextRequest, NextResponse } from "next/server"
import { connectDb } from "@/lib/db"
import { UserModel } from "@/lib/models/User"
import { serializeUser } from "@/lib/serializers"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await connectDb()
  const user = await UserModel.findById(id)

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  return NextResponse.json({ user: serializeUser(user) })
}
