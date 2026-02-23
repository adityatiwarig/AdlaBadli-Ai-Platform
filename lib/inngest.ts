interface SessionCompletedEventPayload {
  sessionId: string
  teacherId: string
  learnerId: string
  skill: string
  duration: number
}

export async function publishSessionCompletedEvent(payload: SessionCompletedEventPayload) {
  try {
    await fetch("https://inn.gs/e/adlabadli-session-completed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "adlabadli/session.completed",
        data: payload,
      }),
    })
  } catch {
    // best effort publish
  }
}
