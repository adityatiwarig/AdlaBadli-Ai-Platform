"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  Clock,
  EyeOff,
  Globe,
  MessageSquare,
  Shield,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react"

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Matching",
    description: "Our AI engine finds your perfect skill exchange partner based on compatibility, availability, and learning style.",
  },
  {
    icon: Clock,
    title: "Time Credit Economy",
    description: "1 hour teaching = 1 credit earned. Use credits to learn new skills. Fair, transparent, and money-free.",
  },
  {
    icon: Shield,
    title: "Trust & Safety",
    description: "AI-driven trust scores, ratings, and reliability metrics ensure safe and genuine learning experiences.",
  },
  {
    icon: MessageSquare,
    title: "Real-Time Chat",
    description: "Connect instantly with your match. Discuss topics, schedule sessions, and build learning relationships.",
  },
  {
    icon: BookOpen,
    title: "Session Summaries",
    description: "AI generates key learnings, important points, and suggested next steps after every session.",
  },
  {
    icon: Globe,
    title: "Local & Online",
    description: "Find nearby learners in your city for offline meetups or connect with anyone online.",
  },
]

const stats = [
  { value: "10K+", label: "Active Learners" },
  { value: "500+", label: "Skills Available" },
  { value: "25K+", label: "Sessions Completed" },
  { value: "4.8", label: "Average Rating" },
]

const howItWorks = [
  {
    step: "01",
    title: "Create Your Profile",
    description: "List the skills you can teach and what you want to learn. Set your availability and preferences.",
  },
  {
    step: "02",
    title: "Get Matched by AI",
    description: "Our matching engine finds compatible partners based on skills, availability, language, and location.",
  },
  {
    step: "03",
    title: "Exchange & Grow",
    description: "Start sessions, earn time credits, build trust, and keep learning new skills.",
  },
]

export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const wowKey = process.env.NEXT_PUBLIC_WOW_KEY
  const swipeStartY = useRef<number | null>(null)
  const [wowOpen, setWowOpen] = useState(false)
  const [wowUnlocked, setWowUnlocked] = useState(false)
  const [wowMode, setWowMode] = useState<"normal" | "hyper" | "zen">("normal")
  const [wowBoost, setWowBoost] = useState(false)
  const [wowHue, setWowHue] = useState(false)
  const [wowNote, setWowNote] = useState("")

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (typeof window === "undefined") return
    const unlocked = localStorage.getItem("adlabadli-wow-unlocked")
    const savedMode = localStorage.getItem("adlabadli-wow-mode")
    const savedBoost = localStorage.getItem("adlabadli-wow-boost")
    const savedHue = localStorage.getItem("adlabadli-wow-hue")
    const savedNote = localStorage.getItem("adlabadli-wow-note")
    if (unlocked === "1") setWowUnlocked(true)
    if (savedMode === "normal" || savedMode === "hyper" || savedMode === "zen") setWowMode(savedMode)
    if (savedBoost === "1") setWowBoost(true)
    if (savedHue === "1") setWowHue(true)
    if (savedNote) setWowNote(savedNote)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem("adlabadli-wow-mode", wowMode)
  }, [wowMode])

  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem("adlabadli-wow-boost", wowBoost ? "1" : "0")
  }, [wowBoost])

  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem("adlabadli-wow-hue", wowHue ? "1" : "0")
  }, [wowHue])

  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem("adlabadli-wow-note", wowNote)
  }, [wowNote])

  const wowRootClass = useMemo(() => {
    return ["landing-page", `wow-mode-${wowMode}`, wowBoost ? "wow-boost" : "", wowHue ? "wow-hue" : ""].filter(Boolean).join(" ")
  }, [wowMode, wowBoost, wowHue])

  const requestWowUnlock = () => {
    if (wowUnlocked) return true
    if (!wowKey) {
      setWowUnlocked(true)
      if (typeof window !== "undefined") localStorage.setItem("adlabadli-wow-unlocked", "1")
      return true
    }
    const entered = window.prompt("Enter WOW key")
    if (entered && entered === wowKey) {
      setWowUnlocked(true)
      localStorage.setItem("adlabadli-wow-unlocked", "1")
      return true
    }
    return false
  }

  const openWowLab = () => {
    const allowed = requestWowUnlock()
    if (allowed) setWowOpen(true)
  }

  const onSwipeStart = (y: number) => {
    swipeStartY.current = y
  }

  const onSwipeEnd = (y: number) => {
    if (swipeStartY.current == null) return
    const delta = swipeStartY.current - y
    swipeStartY.current = null
    if (delta > 70) openWowLab()
  }

  useEffect(() => {
    if (typeof window === "undefined") return

    if (window.location.hash === "#wow") {
      openWowLab()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "w") {
        event.preventDefault()
        openWowLab()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (user) return null

  return (
    <div className={`${wowRootClass} min-h-[calc(100vh-64px)]`}>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-14 pt-12 sm:pb-20 sm:pt-16 md:pt-24">
        <div className="absolute inset-0 -z-10 opacity-70">
          <div className="landing-glow-1 absolute left-[10%] top-[10%] h-72 w-72 rounded-full bg-primary/20 blur-3xl sm:h-96 sm:w-96" />
          <div className="landing-glow-2 absolute right-[8%] top-[24%] h-64 w-64 rounded-full bg-accent/20 blur-3xl sm:h-80 sm:w-80" />
          <div className="landing-glow-3 absolute bottom-[8%] left-[42%] h-48 w-48 rounded-full bg-chart-3/20 blur-3xl sm:h-72 sm:w-72" />
          <div className="landing-grid-overlay absolute inset-0 opacity-40" />
          <div className="landing-scanline absolute inset-0 opacity-55" />
          <div className="landing-orb landing-orb-a absolute left-[18%] top-[42%] h-2.5 w-2.5 rounded-full bg-primary/70" />
          <div className="landing-orb landing-orb-b absolute left-[62%] top-[30%] h-2 w-2 rounded-full bg-accent/80" />
          <div className="landing-orb landing-orb-c absolute left-[78%] top-[64%] h-2 w-2 rounded-full bg-chart-4/80" />
        </div>
        <div className="mx-auto max-w-4xl text-center">
          <div className="landing-reveal mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary sm:text-sm">
            <Zap className="h-3.5 w-3.5" />
            AI-Powered Skill Exchange Platform
          </div>
          <h1 className="landing-reveal mb-5 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl md:mb-6 md:text-6xl lg:text-7xl">
            <span className="heading-gradient landing-title">Trade Skills, Not Money</span>
          </h1>
          <p className="landing-reveal mx-auto mb-7 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:mb-10 sm:text-lg md:text-xl">
            AdlaBadli AI converts human knowledge into a shared learning economy where time becomes currency. Teach what you know, learn what you love.
          </p>
          <div className="landing-reveal mx-auto flex w-full max-w-md flex-col items-center gap-3 sm:max-w-none sm:flex-row sm:justify-center sm:gap-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="interactive-button landing-primary-btn w-full gap-2 px-8 text-base sm:w-auto">
                Start Exchanging
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="glass-panel landing-secondary-btn w-full gap-2 border-primary/30 px-8 text-base sm:w-auto">
                I Have an Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="glass-panel border-y border-border/70 px-4 py-8 sm:py-12">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-5 sm:gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="landing-stat-card text-center"
              style={{ animationDelay: `${0.08 * (index + 1)}s` }}
            >
              <div className="landing-stat-value text-2xl font-bold text-primary sm:text-3xl md:text-4xl">{stat.value}</div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-balance text-3xl font-bold text-foreground md:text-4xl">
              Everything You Need to Exchange Skills
            </h2>
            <p className="mx-auto max-w-2xl text-pretty text-muted-foreground">
              From AI matching to trust verification, we handle everything so you can focus on learning and teaching.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className="glass-panel interactive-card landing-feature-card border border-border/70"
                style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              >
                <CardContent className="p-6">
                  <div className="landing-feature-icon mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/15 shadow-[0_0_28px_color-mix(in_oklab,var(--primary)_24%,transparent)]">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="glass-panel border-y border-border/70 px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-balance text-3xl font-bold text-foreground md:text-4xl">
              How It Works
            </h2>
            <p className="text-pretty text-muted-foreground">
              Three simple steps to start your skill exchange journey
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {howItWorks.map((step, index) => (
              <div
                key={step.step}
                className="landing-step-card text-center"
                style={{ animationDelay: `${0.12 * (index + 1)}s` }}
              >
                <div className="landing-step-chip mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary font-mono text-lg font-bold text-primary-foreground">
                  {step.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-14 sm:py-20">
        <div className="landing-cta mx-auto max-w-3xl rounded-2xl bg-primary/90 p-6 text-center text-primary-foreground shadow-[0_18px_80px_color-mix(in_oklab,var(--primary)_45%,transparent)] sm:p-8 md:p-12">
          <ArrowLeftRight className="landing-cta-icon mx-auto mb-4 h-8 w-8" />
          <h2 className="mb-4 text-balance text-3xl font-bold md:text-4xl">
            Ready to Start Exchanging?
          </h2>
          <p className="mb-8 text-primary-foreground/80">
            Join thousands of learners who are already exchanging skills and growing together.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="interactive-button gap-2 px-8 text-base">
              Create Free Account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-panel border-t border-border/70 px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <ArrowLeftRight className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">AdlaBadli AI</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> Community Driven
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5" /> Trusted Platform
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built with purpose. Learn, teach, grow.
          </p>
        </div>
      </footer>
      <div
        className="wow-swipe-strip"
        onMouseDown={(e) => e.preventDefault()}
        onDoubleClick={openWowLab}
        onTouchStart={(e) => onSwipeStart(e.changedTouches[0]?.clientY ?? 0)}
        onTouchEnd={(e) => onSwipeEnd(e.changedTouches[0]?.clientY ?? 0)}
      />
      {wowOpen ? (
        <div className="wow-lab-panel">
          <div className="wow-lab-head">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Hidden WOW Lab</p>
              <p className="text-xs text-muted-foreground">Private controls. Swipe-up at page end to reopen.</p>
            </div>
            <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={() => setWowOpen(false)}>
              <EyeOff className="h-3.5 w-3.5" />
              Hide
            </Button>
          </div>
          <div className="wow-lab-grid">
            <div className="rounded-lg border border-border bg-card p-2">
              <p className="mb-2 text-[11px] font-semibold text-foreground">Motion Mode</p>
              <div className="flex gap-1.5">
                <Button size="sm" variant={wowMode === "hyper" ? "default" : "outline"} className="h-7 px-2 text-[10px]" onClick={() => setWowMode("hyper")}>Hyper</Button>
                <Button size="sm" variant={wowMode === "normal" ? "default" : "outline"} className="h-7 px-2 text-[10px]" onClick={() => setWowMode("normal")}>Normal</Button>
                <Button size="sm" variant={wowMode === "zen" ? "default" : "outline"} className="h-7 px-2 text-[10px]" onClick={() => setWowMode("zen")}>Zen</Button>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-2">
              <p className="mb-2 text-[11px] font-semibold text-foreground">Visual Boost</p>
              <div className="flex gap-1.5">
                <Button size="sm" variant={wowBoost ? "default" : "outline"} className="h-7 px-2 text-[10px]" onClick={() => setWowBoost((v) => !v)}>Glow Boost</Button>
                <Button size="sm" variant={wowHue ? "default" : "outline"} className="h-7 px-2 text-[10px]" onClick={() => setWowHue((v) => !v)}>Hue Shift</Button>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-2">
              <p className="mb-2 text-[11px] font-semibold text-foreground">Quick Jump</p>
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={() => router.push("/explore")}>Explore</Button>
                <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={() => router.push("/chat")}>Chat</Button>
                <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={() => router.push("/sessions")}>Sessions</Button>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-2">
              <p className="mb-2 text-[11px] font-semibold text-foreground">Private Scratchpad</p>
              <textarea
                value={wowNote}
                onChange={(e) => setWowNote(e.target.value)}
                placeholder="Only saved in your browser."
                className="h-16 w-full resize-none rounded-md border border-border bg-background/80 p-2 text-[11px] text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      ) : null}
      <style jsx>{`
        .landing-page {
          --landing-ease: cubic-bezier(0.22, 1, 0.36, 1);
          --motion-speed: 1;
        }

        .wow-mode-hyper {
          --motion-speed: 0.66;
        }

        .wow-mode-zen {
          --motion-speed: 1.55;
        }

        .wow-boost .landing-feature-card,
        .wow-boost .landing-cta {
          box-shadow: 0 20px 56px color-mix(in oklab, var(--primary) 28%, transparent);
        }

        .wow-hue {
          filter: hue-rotate(22deg) saturate(1.08);
        }

        .landing-grid-overlay {
          background-image:
            linear-gradient(to right, color-mix(in oklab, var(--primary) 16%, transparent) 1px, transparent 1px),
            linear-gradient(to bottom, color-mix(in oklab, var(--primary) 16%, transparent) 1px, transparent 1px);
          background-size: 52px 52px;
          mask-image: radial-gradient(circle at 50% 45%, black 32%, transparent 78%);
          animation: gridShift calc(9s * var(--motion-speed)) linear infinite;
        }

        .landing-glow-1,
        .landing-glow-2,
        .landing-glow-3 {
          animation: floatCloud calc(4.5s * var(--motion-speed)) var(--landing-ease) infinite;
          will-change: transform;
        }

        .landing-glow-2 {
          animation-duration: calc(5.8s * var(--motion-speed));
          animation-delay: -1.4s;
        }

        .landing-glow-3 {
          animation-duration: calc(4.9s * var(--motion-speed));
          animation-delay: -2.2s;
        }

        .landing-title {
          background-size: 200% auto;
          animation: gradientSweep calc(2.9s * var(--motion-speed)) linear infinite;
        }

        .landing-reveal {
          opacity: 0;
          transform: translateY(22px) scale(0.98);
          animation: revealIn calc(0.55s * var(--motion-speed)) var(--landing-ease) forwards;
        }

        .landing-reveal:nth-child(2) {
          animation-delay: 0.1s;
        }

        .landing-reveal:nth-child(3) {
          animation-delay: 0.2s;
        }

        .landing-reveal:nth-child(4) {
          animation-delay: 0.3s;
        }

        .landing-primary-btn {
          box-shadow: 0 12px 34px color-mix(in oklab, var(--primary) 32%, transparent);
          transition: transform 220ms var(--landing-ease), box-shadow 220ms var(--landing-ease);
        }

        .landing-primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 42px color-mix(in oklab, var(--primary) 38%, transparent);
        }

        .landing-secondary-btn {
          transition: transform 220ms var(--landing-ease), border-color 220ms var(--landing-ease);
        }

        .landing-secondary-btn:hover {
          transform: translateY(-2px);
          border-color: color-mix(in oklab, var(--primary) 45%, var(--border));
        }

        .landing-stat-card {
          border: 1px solid color-mix(in oklab, var(--border) 85%, transparent);
          background: color-mix(in oklab, var(--card) 90%, transparent);
          border-radius: 0.9rem;
          padding: 0.8rem;
          opacity: 0;
          transform: translateY(18px);
          animation: revealIn calc(0.45s * var(--motion-speed)) var(--landing-ease) forwards;
        }

        .landing-stat-value {
          animation: valuePulse calc(1.15s * var(--motion-speed)) var(--landing-ease) infinite;
        }

        .landing-feature-card {
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translateY(24px);
          animation: revealIn calc(0.55s * var(--motion-speed)) var(--landing-ease) forwards;
          transition: transform 240ms var(--landing-ease), box-shadow 240ms var(--landing-ease), border-color 240ms var(--landing-ease);
        }

        .landing-feature-card::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(110deg, transparent 36%, color-mix(in oklab, white 26%, transparent) 49%, transparent 62%);
          transform: translateX(-135%);
          animation: cardShine calc(2.2s * var(--motion-speed)) linear infinite;
          pointer-events: none;
        }

        .landing-feature-card:hover {
          transform: translateY(-6px);
          border-color: color-mix(in oklab, var(--primary) 35%, var(--border));
          box-shadow: 0 16px 40px color-mix(in oklab, var(--primary) 18%, transparent);
        }

        .landing-feature-card:hover .landing-feature-icon {
          transform: scale(1.08) rotate(-4deg);
        }

        .landing-feature-icon {
          transition: transform 220ms var(--landing-ease);
        }

        .landing-step-card {
          opacity: 0;
          transform: translateY(24px);
          animation: revealIn calc(0.58s * var(--motion-speed)) var(--landing-ease) forwards;
        }

        .landing-step-chip {
          box-shadow: 0 10px 28px color-mix(in oklab, var(--primary) 30%, transparent);
          animation: softPulse calc(1.3s * var(--motion-speed)) var(--landing-ease) infinite;
        }

        .landing-cta {
          position: relative;
          overflow: hidden;
        }

        .landing-cta::before {
          content: "";
          position: absolute;
          inset: -160% auto auto -30%;
          width: 46%;
          aspect-ratio: 1;
          background: radial-gradient(circle, color-mix(in oklab, white 30%, transparent) 0%, transparent 70%);
          opacity: 0.35;
          animation: orbitGlow calc(4.6s * var(--motion-speed)) linear infinite;
          pointer-events: none;
        }

        .landing-cta-icon {
          animation: softPulse calc(1.25s * var(--motion-speed)) var(--landing-ease) infinite;
        }

        .landing-scanline {
          background: repeating-linear-gradient(
            to bottom,
            color-mix(in oklab, var(--primary) 14%, transparent) 0px,
            color-mix(in oklab, var(--primary) 14%, transparent) 1px,
            transparent 2px,
            transparent 8px
          );
          mask-image: radial-gradient(circle at 50% 45%, black 32%, transparent 78%);
          animation: scanRush calc(2.6s * var(--motion-speed)) linear infinite;
        }

        .landing-orb {
          box-shadow: 0 0 14px color-mix(in oklab, var(--primary) 55%, transparent);
          animation: orbDash calc(1.6s * var(--motion-speed)) var(--landing-ease) infinite;
        }

        .wow-swipe-strip {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          height: 44px;
          z-index: 40;
          opacity: 0;
          pointer-events: auto;
          user-select: none;
          -webkit-user-select: none;
        }

        .wow-lab-panel {
          position: fixed;
          left: 50%;
          bottom: 16px;
          z-index: 60;
          width: min(680px, calc(100vw - 20px));
          transform: translateX(-50%);
          border: 1px solid color-mix(in oklab, var(--primary) 30%, var(--border));
          border-radius: 14px;
          background: color-mix(in oklab, var(--card) 95%, transparent);
          backdrop-filter: blur(10px) saturate(115%);
          box-shadow: 0 20px 56px color-mix(in oklab, var(--primary) 20%, transparent);
          padding: 10px;
          animation: wowRise 220ms var(--landing-ease) forwards;
        }

        .wow-lab-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 8px;
        }

        .wow-lab-grid {
          display: grid;
          gap: 8px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        @media (max-width: 680px) {
          .wow-lab-grid {
            grid-template-columns: 1fr;
          }
        }

        .landing-orb-a {
          animation-delay: -0.4s;
        }

        .landing-orb-b {
          animation-delay: -0.9s;
        }

        .landing-orb-c {
          animation-delay: -1.2s;
        }

        @keyframes revealIn {
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes floatCloud {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-16px) translateX(8px);
          }
        }

        @keyframes gradientSweep {
          0% {
            background-position: 0% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        @keyframes softPulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.06);
          }
        }

        @keyframes valuePulse {
          0%,
          100% {
            transform: translateY(0) scale(1);
            text-shadow: 0 0 0 transparent;
          }
          50% {
            transform: translateY(-1px) scale(1.05);
            text-shadow: 0 0 18px color-mix(in oklab, var(--primary) 45%, transparent);
          }
        }

        @keyframes orbitGlow {
          0% {
            transform: translateX(0) rotate(0deg);
          }
          100% {
            transform: translateX(340%) rotate(360deg);
          }
        }

        @keyframes cardShine {
          0% {
            transform: translateX(-135%);
          }
          100% {
            transform: translateX(135%);
          }
        }

        @keyframes gridShift {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(52px, 52px, 0);
          }
        }

        @keyframes scanRush {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(22px);
          }
        }

        @keyframes orbDash {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(0.95);
            opacity: 0.35;
          }
          50% {
            transform: translate3d(10px, -8px, 0) scale(1.15);
            opacity: 0.95;
          }
        }

        @keyframes wowRise {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .landing-grid-overlay,
          .landing-scanline,
          .landing-glow-1,
          .landing-glow-2,
          .landing-glow-3,
          .landing-orb,
          .landing-title,
          .landing-reveal,
          .landing-stat-card,
          .landing-stat-value,
          .landing-feature-card,
          .landing-feature-card::after,
          .landing-step-card,
          .landing-step-chip,
          .landing-cta::before,
          .landing-cta-icon {
            animation: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  )
}


