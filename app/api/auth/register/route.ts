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
    const {
      name,
      email,
      password,
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

    if (!name || !email || !password || !city) {
      return NextResponse.json({ error: "Name, email, password, and city are required" }, { status: 400 })
    }

    const existingUser = await UserModel.findOne({ email: String(email).toLowerCase() })
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(String(password), 10)
    const user = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      city,
      area: area || "",
      offlineMeetPreferred: Boolean(offlineMeetPreferred),
      teachSkills: teachSkills || [],
      learnSkills: learnSkills || [],
      skillLevel: skillLevel || "beginner",
      learningStyle: learningStyle || "mixed",
      languages: languages || ["English"],
      availabilitySlots: availabilitySlots || [],
      credits: 40,
      trustScore: 50,
      reliabilityScore: 50,
      sessionsCompleted: 0,
      bio: bio || "",
    })

    await createSession(user._id.toString())
    return NextResponse.json({ user: serializeUser(user) }, { status: 201 })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
