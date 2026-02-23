import type { User } from "@/lib/types"
import type { UserDoc } from "@/lib/models/User"

export function serializeUser(user: UserDoc): User {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    city: user.city,
    area: user.area || "",
    offlineMeetPreferred: user.offlineMeetPreferred || false,
    teachSkills: user.teachSkills || [],
    learnSkills: user.learnSkills || [],
    skillLevel: user.skillLevel,
    learningStyle: user.learningStyle || "mixed",
    languages: user.languages || [],
    availabilitySlots: user.availabilitySlots || [],
    credits: user.credits || 0,
    trustScore: user.trustScore || 0,
    reliabilityScore: user.reliabilityScore || 0,
    sessionsCompleted: user.sessionsCompleted || 0,
    bio: user.bio || "",
    avatar: user.avatar || "",
    createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
  }
}
