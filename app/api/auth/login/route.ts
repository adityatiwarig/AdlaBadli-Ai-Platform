import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createSession } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { UserModel } from "@/lib/models/User"
import { serializeUser } from "@/lib/serializers"

export async function POST(request: NextRequest) {
  try {
    await connectDb()
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const user = await UserModel.findOne({ email: String(email).toLowerCase() })
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const isValid = await bcrypt.compare(String(password), user.password)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    await createSession(user._id.toString())
    return NextResponse.json({ user: serializeUser(user) })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
