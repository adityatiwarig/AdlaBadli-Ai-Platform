import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { connectDb } from "./db"
import { UserModel } from "./models/User"
import { serializeUser } from "./serializers"
import type { User } from "./types"

const SESSION_COOKIE = "adlabadli_session"
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me"

function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" })
}

function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return { userId: decoded.userId }
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<User | null> {
  await connectDb()
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  const user = await UserModel.findById(payload.userId)
  if (!user) return null

  return serializeUser(user)
}

export async function createSession(userId: string): Promise<string> {
  const token = generateToken(userId)
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  })
  return token
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}
