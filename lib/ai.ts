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

export type AgentType = "coach" | "icebreaker" | "scheduler" | "progress" | "diagnose" | "drills"

interface AgentResponseInput {
  agent: AgentType
  skill: string
  partnerName: string
  summary?: string
  focus?: string
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
            temperature: 0.25,
            topP: 0.9,
            maxOutputTokens: 520,
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
  const recentMessages = input.messages.slice(-18)
  const recent = recentMessages.map((m) => `${m.senderName}: ${m.message}`).join("\n")
  const latestUserQuestion = [...recentMessages]
    .reverse()
    .find((m) => m.message.includes("?"))?.message
  const latestTopic = [...recentMessages]
    .reverse()
    .find((m) => m.message.trim().length > 8)?.message
    ?.slice(0, 160)
  const titles: Record<AgentType, string> = {
    coach: "Step-by-Step Coaching Plan",
    icebreaker: "Ready-to-Send Messages",
    scheduler: "Session Plan You Can Follow",
    progress: "Progress Checkup",
    diagnose: "Learning Blocker Diagnosis",
    drills: "Practice Drills Pack",
  }

  const agentInstruction: Record<AgentType, string> = {
    coach: "Return practical coaching with headings exactly: Goal now, Next 3 actions, Common mistake, Quick success check.",
    icebreaker: "Return 6 copy-paste messages the learner can send now. Include opener, clarification, checkpoint, feedback request, next-step lock, and polite close.",
    scheduler: "Return one actionable agenda with time blocks, teacher action, learner action, and checkpoint for each block.",
    progress: "Evaluate progress with headings exactly: Wins, Gaps, Risk if ignored, Next best 3 actions.",
    diagnose: "Identify root cause of confusion with headings exactly: Most likely blocker, Evidence from chat, Fix in 10 minutes, Follow-up check.",
    drills: "Create 4 targeted drills with increasing difficulty. For each drill include: Task, Hint, Success criteria.",
  }

  const fallback: Record<AgentType, string> = {
    coach: "Goal now: finish one practical outcome.\nNext 3 actions: define target, do guided example, repeat independently.\nCommon mistake: spending too long on theory only.\nQuick success check: explain the concept in 2 minutes and solve one example alone.",
    icebreaker: "1) What exact outcome do you want by the end of this session?\n2) Can you show one example where you get stuck?\n3) Should we start with recap or direct practice?\n4) Can we run a checkpoint after 15 minutes?\n5) What should be our final output before we close?\n6) Let's lock one clear next action before ending.",
    scheduler: "0-5 min: align target and success metric.\n5-15 min: teacher demo of one example.\n15-30 min: learner practice with guidance.\n30-40 min: review mistakes and corrections.\n40-45 min: recap and assign one next action.",
    progress: "Wins: active participation and clear intent.\nGaps: no measurable checkpoint yet.\nRisk if ignored: effort without proof of progress.\nNext best 3 actions: set one metric, solve one independent task, schedule review follow-up.",
    diagnose: "Most likely blocker: concept is understood but application steps are unclear.\nEvidence from chat: repeated confusion during practical execution.\nFix in 10 minutes: run one worked example then one learner-led attempt.\nFollow-up check: learner explains the process and solves a similar task without hints.",
    drills: "Drill 1 Task: recall key concept in your own words. Hint: use one real example. Success criteria: explanation in under 90 seconds.\nDrill 2 Task: solve one guided example. Hint: follow the 3-step method. Success criteria: no step skipped.\nDrill 3 Task: solve a similar problem independently. Hint: verify assumptions first. Success criteria: correct output.\nDrill 4 Task: explain why your solution works. Hint: compare with one wrong approach. Success criteria: clear reasoning + correction.",
  }

  const prompt = [
    "You are an AI assistant for session-based skill coaching.",
    "You must be practical, concrete, and directly usable in a live session.",
    `Agent mode: ${input.agent}`,
    `Skill: ${input.skill}`,
    `Partner name: ${input.partnerName}`,
    input.summary ? `Current summary: ${input.summary}` : "",
    input.focus ? `User focus: ${input.focus}` : "",
    latestTopic ? `Latest topic from chat: ${latestTopic}` : "",
    latestUserQuestion ? `Latest question detected: ${latestUserQuestion}` : "",
    "Session chat messages:",
    recent || "No recent messages.",
    agentInstruction[input.agent],
    "Rules:",
    "- Use only session context and user focus.",
    "- Avoid generic textbook advice.",
    "- Keep language simple and direct.",
    "- Include concrete examples where possible.",
    "- Keep output under 220 words.",
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
  return ["coach", "icebreaker", "scheduler", "progress", "diagnose", "drills"]
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
