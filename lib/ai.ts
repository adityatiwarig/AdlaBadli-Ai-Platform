interface SessionSummaryInput {
  skill: string
  duration: number
  teacherName: string
  learnerName: string
}

interface ConversationSnippet {
  senderName: string
  message: string
  timestamp?: string
}

interface RollingSummaryInput extends SessionSummaryInput {
  previousSummary?: string
  messages: ConversationSnippet[]
}

export type AgentType = "coach" | "icebreaker" | "scheduler" | "progress"

interface AgentResponseInput {
  agent: AgentType
  skill: string
  partnerName: string
  summary?: string
  messages: ConversationSnippet[]
}

const promptCache = new Map<string, { value: string; expiresAt: number }>()

async function callGemini(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  const cacheHit = promptCache.get(prompt)
  if (cacheHit && cacheHit.expiresAt > Date.now()) {
    return cacheHit.value
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 9000)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            topP: 0.9,
            maxOutputTokens: 280,
          },
        }),
        signal: controller.signal,
      }
    )
    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error("Gemini request failed")
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (typeof text === "string" && text.trim()) {
      const value = text.trim()
      promptCache.set(prompt, { value, expiresAt: Date.now() + 20000 })
      return value
    }
  } catch {
    return null
  }

  return null
}

export async function generateSessionSummary(input: SessionSummaryInput): Promise<string> {
  const fallback = `Session recap: ${input.teacherName} and ${input.learnerName} completed a ${input.duration}-minute ${input.skill} exchange. Key outcome: core concepts were practiced with actionable examples. Suggested next step: schedule a follow-up session focused on one practical project task.`
  const prompt = [
    "Create a concise learning summary for a skill exchange session.",
    `Skill: ${input.skill}`,
    `Duration (minutes): ${input.duration}`,
    `Teacher: ${input.teacherName}`,
    `Learner: ${input.learnerName}`,
    "Include: key learnings, important points, next steps. Keep under 90 words.",
  ].join("\n")

  const result = await callGemini(prompt)
  if (result) return result
  return fallback
}

export async function generateRollingSessionSummary(input: RollingSummaryInput): Promise<string> {
  const lastMessages = input.messages.slice(-18)
  const chatBlock = lastMessages
    .map((m) => {
      const stamp = m.timestamp ? ` (${new Date(m.timestamp).toLocaleString()})` : ""
      return `${m.senderName}${stamp}: ${m.message}`
    })
    .join("\n")

  const fallback = [
    `Live session summary for ${input.skill}: ${input.teacherName} and ${input.learnerName} are actively discussing practical steps.`,
    lastMessages.length > 0 ? `Latest focus: "${lastMessages[lastMessages.length - 1].message.slice(0, 100)}".` : "",
    "Next step: continue with one small task and confirm outcomes at the end of session.",
  ]
    .filter(Boolean)
    .join(" ")

  const prompt = [
    "You are a learning-session summarizer.",
    "Write one short evolving summary that updates from chat messages.",
    `Skill: ${input.skill}`,
    `Duration target (minutes): ${input.duration}`,
    `Teacher: ${input.teacherName}`,
    `Learner: ${input.learnerName}`,
    input.previousSummary ? `Previous summary: ${input.previousSummary}` : "",
    "Conversation snippets:",
    chatBlock || "No chat yet.",
    "Return under 130 words with these parts in plain text:",
    "Progress: ...",
    "Key points: ...",
    "Next step: ...",
  ]
    .filter(Boolean)
    .join("\n")

  const result = await callGemini(prompt)
  if (result) return result
  return fallback
}

export async function generateAgentResponse(input: AgentResponseInput): Promise<{ title: string; content: string }> {
  const recent = input.messages.slice(-12).map((m) => `${m.senderName}: ${m.message}`).join("\n")
  const titles: Record<AgentType, string> = {
    coach: "Step-by-Step Coaching Plan",
    icebreaker: "Ready-to-Send Messages",
    scheduler: "Session Plan You Can Follow",
    progress: "Progress Checkup",
  }

  const agentInstruction: Record<AgentType, string> = {
    coach: "Give practical coaching with headings: Goal now, Next 3 actions, Common mistake, Quick success check.",
    icebreaker: "Give 5 copy-paste friendly messages the user can send now. Keep them short and natural.",
    scheduler: "Give one clear agenda based on current context with time slots and checkpoint prompts.",
    progress: "Evaluate progress in plain language with headings: What is going well, What is missing, Next best 3 actions.",
  }

  const fallback: Record<AgentType, string> = {
    coach: "Goal now: finish one practical outcome.\nNext 3 actions: define target, do guided example, repeat independently.\nCommon mistake: spending too long on theory only.\nQuick success check: explain the concept in 2 minutes and solve one example alone.",
    icebreaker: "1) What exact result do you want by the end of this session?\n2) Show me one example where you get stuck.\n3) Should we do concept recap first or hands-on practice first?\n4) Can we do a quick checkpoint after 15 minutes?\n5) Before closing, let's lock one action item for next time.",
    scheduler: "0-5 min: align goal and expected result.\n5-20 min: concept + live example.\n20-35 min: learner practices while teacher guides.\n35-45 min: recap, doubts, and next action.",
    progress: "What is going well: active participation and clear learning intent.\nWhat is missing: measurable success checkpoint.\nNext best 3 actions: define one metric, complete one practical task, schedule review follow-up.",
  }

  const prompt = [
    "You are an AI assistant for session-based skill coaching.",
    `Agent mode: ${input.agent}`,
    `Skill: ${input.skill}`,
    `Partner name: ${input.partnerName}`,
    input.summary ? `Current summary: ${input.summary}` : "",
    "Session chat messages:",
    recent || "No recent messages.",
    agentInstruction[input.agent],
    "Rules: use only session context, avoid generic advice, be concise and practical.",
  ]
    .filter(Boolean)
    .join("\n")

  const result = await callGemini(prompt)
  return {
    title: titles[input.agent],
    content: result || fallback[input.agent],
  }
}

export function pickAgentTypes(): AgentType[] {
  return ["coach", "icebreaker", "scheduler", "progress"]
}

export function summarizeMessagesForAgent(messages: ConversationSnippet[]): string {
  if (!messages.length) {
    return "No conversation yet."
  }
  return messages
    .slice(-5)
    .map((m) => `${m.senderName}: ${m.message}`)
    .join(" | ")
}
