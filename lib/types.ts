export interface User {
  id: string
  name: string
  email: string
  password?: string
  city: string
  area?: string
  offlineMeetPreferred?: boolean
  teachSkills: string[]
  learnSkills: string[]
  skillLevel: "beginner" | "intermediate" | "advanced"
  learningStyle?: "visual" | "auditory" | "reading" | "kinesthetic" | "mixed"
  languages: string[]
  availabilitySlots: string[]
  credits: number
  trustScore: number
  reliabilityScore: number
  sessionsCompleted: number
  bio?: string
  avatar?: string
  createdAt: string
}

export interface Match {
  id: string
  userId: string
  matchedUserId: string
  compatibilityScore: number
  matchedSkill: string
  status: "pending" | "accepted" | "rejected"
  createdAt: string
  matchedUser?: User
}

export interface ChatMessage {
  id: string
  senderId: string
  receiverId: string
  sessionId?: string
  message: string
  timestamp: string
}

export interface Session {
  id: string
  teacherId: string
  learnerId: string
  skill: string
  status: "scheduled" | "active" | "completed" | "cancelled"
  startTime?: string
  plannedDuration?: number
  endTime?: string
  duration?: number
  creditsTransferred?: number
  teacherConfirmed: boolean
  learnerConfirmed: boolean
  meetingRoomId?: string
  meetingProvider?: string
  meetingUrl?: string
  summary?: string
  summaryUpdatedAt?: string
  aiInsights?: Array<{
    agent: "coach" | "icebreaker" | "scheduler" | "progress" | string
    title: string
    content: string
    createdAt: string
  }>
  followUpQuestion?: {
    id: string
    learnerId: string
    teacherId: string
    question: string
    answer: string
    askedAt: string
    answeredAt?: string
  } | null
  questionWindowEndsAt?: string
  canLearnerAskFollowUp?: boolean
  hasTeacherPendingQuestion?: boolean
  isDeletedForUser?: boolean
  historyHeading?: string
  createdAt: string
  teacher?: User
  learner?: User
}

export interface Rating {
  id: string
  sessionId: string
  raterId: string
  ratedUserId: string
  punctuality: number
  teachingQuality: number
  behavior: number
  comment?: string
  createdAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}
