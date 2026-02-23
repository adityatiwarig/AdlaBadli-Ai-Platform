import type { User } from "./types"

interface MatchResult {
  user: User
  score: number
  confidence: "low" | "medium" | "high"
  matchedTeachSkill: string
  matchedLearnSkill: string
  reasons: string[]
  breakdown: {
    skillFit: number
    scheduleFit: number
    trustFit: number
    locationFit: number
    chemistryFit: number
  }
}

export function calculateCompatibility(currentUser: User, otherUser: User): MatchResult | null {
  let rawScore = 0
  const reasons: string[] = []
  let matchedTeachSkill = ""
  let matchedLearnSkill = ""
  const breakdown = {
    skillFit: 0,
    scheduleFit: 0,
    trustFit: 0,
    locationFit: 0,
    chemistryFit: 0,
  }

  const MAX_SCORE = 110

  // 1. Skill match: current user wants to learn what other can teach (28 points)
  const teachMatch = otherUser.teachSkills.filter((skill) =>
    currentUser.learnSkills.some((ls) => ls.toLowerCase() === skill.toLowerCase())
  )

  if (teachMatch.length === 0) return null // No match possible

  matchedTeachSkill = teachMatch[0]
  const teachScore = Math.min(teachMatch.length * 14, 28)
  rawScore += teachScore
  breakdown.skillFit += teachScore
  reasons.push(`Can teach you: ${teachMatch.join(", ")}`)

  // 2. Reverse match: current user can teach what other wants to learn (14 points)
  const learnMatch = currentUser.teachSkills.filter((skill) =>
    otherUser.learnSkills.some((ls) => ls.toLowerCase() === skill.toLowerCase())
  )

  if (learnMatch.length > 0) {
    matchedLearnSkill = learnMatch[0]
    const reverseScore = Math.min(learnMatch.length * 7, 14)
    rawScore += reverseScore
    breakdown.skillFit += reverseScore
    reasons.push(`Wants to learn: ${learnMatch.join(", ")}`)
  }

  // 3. Skill level compatibility (10 points)
  const levelRank = { beginner: 1, intermediate: 2, advanced: 3 } as const
  const levelGap = Math.abs(levelRank[currentUser.skillLevel] - levelRank[otherUser.skillLevel])
  if (levelGap === 0) {
    rawScore += 10
    breakdown.skillFit += 10
    reasons.push("Same skill level")
  } else if (levelGap === 1) {
    rawScore += 6
    breakdown.skillFit += 6
    reasons.push("Compatible skill level")
  }

  // 4. Language match (10 points)
  const langMatch = currentUser.languages.filter((lang) =>
    otherUser.languages.some((ol) => ol.toLowerCase() === lang.toLowerCase())
  )
  if (langMatch.length > 0) {
    const languageScore = Math.min(langMatch.length * 5, 10)
    rawScore += languageScore
    breakdown.chemistryFit += languageScore
    reasons.push(`Common languages: ${langMatch.join(", ")}`)
  }

  // 5. Availability overlap (10 points)
  const timeMatch = currentUser.availabilitySlots.filter((slot) =>
    otherUser.availabilitySlots.includes(slot)
  )
  if (timeMatch.length > 0) {
    const availabilityScore = Math.min(timeMatch.length * 5, 10)
    rawScore += availabilityScore
    breakdown.scheduleFit += availabilityScore
    reasons.push(`Available: ${timeMatch.join(", ")}`)
  }

  // 6. Trust score (8 points) + reliability (7 points)
  if (otherUser.trustScore >= 80) {
    rawScore += 8
    breakdown.trustFit += 8
    reasons.push("Highly trusted")
  } else if (otherUser.trustScore >= 60) {
    rawScore += 5
    breakdown.trustFit += 5
    reasons.push("Good trust score")
  }

  if (otherUser.reliabilityScore >= 85) {
    rawScore += 7
    breakdown.trustFit += 7
    reasons.push("Very reliable")
  } else if (otherUser.reliabilityScore >= 70) {
    rawScore += 4
    breakdown.trustFit += 4
  }

  // 7. Same city priority (12 points total)
  if (currentUser.city.toLowerCase() === otherUser.city.toLowerCase()) {
    rawScore += 8
    breakdown.locationFit += 8
    reasons.push("Same city")
    if (currentUser.area && otherUser.area && currentUser.area.toLowerCase() === otherUser.area.toLowerCase()) {
      rawScore += 4
      breakdown.locationFit += 4
      reasons.push("Nearby")
    }
  }

  // 8. Learning chemistry (7 points)
  if (currentUser.learningStyle && otherUser.learningStyle) {
    if (currentUser.learningStyle === otherUser.learningStyle) {
      rawScore += 7
      breakdown.chemistryFit += 7
      reasons.push("Strong learning chemistry")
    } else if (currentUser.learningStyle === "mixed" || otherUser.learningStyle === "mixed") {
      rawScore += 4
      breakdown.chemistryFit += 4
      reasons.push("Flexible learning styles")
    }
  }

  // 9. Offline preference boost (4 points)
  if (currentUser.offlineMeetPreferred && otherUser.offlineMeetPreferred) {
    rawScore += 4
    breakdown.locationFit += 4
    reasons.push("Both open to offline sessions")
  }

  const score = Math.min(100, Math.round((rawScore / MAX_SCORE) * 100))
  const confidence: "low" | "medium" | "high" = score >= 78 ? "high" : score >= 55 ? "medium" : "low"

  return {
    user: otherUser,
    score,
    confidence,
    matchedTeachSkill,
    matchedLearnSkill,
    reasons,
    breakdown: {
      skillFit: Math.min(100, Math.round((breakdown.skillFit / 52) * 100)),
      scheduleFit: Math.min(100, Math.round((breakdown.scheduleFit / 10) * 100)),
      trustFit: Math.min(100, Math.round((breakdown.trustFit / 15) * 100)),
      locationFit: Math.min(100, Math.round((breakdown.locationFit / 16) * 100)),
      chemistryFit: Math.min(100, Math.round((breakdown.chemistryFit / 17) * 100)),
    },
  }
}

export function findMatches(currentUser: User, allUsers: User[]): MatchResult[] {
  const matches: MatchResult[] = []

  for (const user of allUsers) {
    if (user.id === currentUser.id) continue

    const result = calculateCompatibility(currentUser, user)
    if (result) {
      matches.push(result)
    }
  }

  return matches.sort((a, b) => b.score - a.score)
}
