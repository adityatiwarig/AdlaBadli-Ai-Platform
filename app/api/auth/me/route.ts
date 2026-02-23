import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ user: null, authenticated: false })
    }
    return NextResponse.json({ user, authenticated: true })
  } catch (error) {
    console.error("auth/me error:", error)
    return NextResponse.json({ user: null, authenticated: false }, { status: 200 })
  }
}
