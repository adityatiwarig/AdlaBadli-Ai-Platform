"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import {
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  Clock,
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

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (user) return null

  return (
    <div className="min-h-[calc(100vh-64px)]">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-14 pt-12 sm:pb-20 sm:pt-16 md:pt-24">
        <div className="absolute inset-0 -z-10 opacity-70">
          <div className="absolute left-[10%] top-[10%] h-72 w-72 rounded-full bg-primary/20 blur-3xl sm:h-96 sm:w-96" />
          <div className="absolute right-[8%] top-[24%] h-64 w-64 rounded-full bg-accent/20 blur-3xl sm:h-80 sm:w-80" />
          <div className="absolute bottom-[8%] left-[42%] h-48 w-48 rounded-full bg-chart-3/20 blur-3xl sm:h-72 sm:w-72" />
        </div>
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary sm:text-sm">
            <Zap className="h-3.5 w-3.5" />
            AI-Powered Skill Exchange Platform
          </div>
          <h1 className="mb-5 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl md:mb-6 md:text-6xl lg:text-7xl">
            <span className="heading-gradient">Trade Skills, Not Money</span>
          </h1>
          <p className="mx-auto mb-7 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:mb-10 sm:text-lg md:text-xl">
            AdlaBadli AI converts human knowledge into a shared learning economy where time becomes currency. Teach what you know, learn what you love.
          </p>
          <div className="mx-auto mb-5 inline-flex w-full max-w-xl items-center justify-center rounded-full border border-primary/35 bg-primary/15 px-3 py-2 text-center text-xs font-semibold text-foreground shadow-sm sm:mb-6 sm:w-auto sm:px-4 sm:text-base">
            Sikhe ke, sikhawe ke - dono mein fayda.
          </div>
          <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 sm:max-w-none sm:flex-row sm:justify-center sm:gap-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="interactive-button w-full gap-2 px-8 text-base sm:w-auto">
                Start Exchanging
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="glass-panel w-full gap-2 border-primary/30 px-8 text-base sm:w-auto">
                I Have an Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="glass-panel border-y border-border/70 px-4 py-8 sm:py-12">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-5 sm:gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-primary sm:text-3xl md:text-4xl">{stat.value}</div>
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
            {features.map((feature) => (
              <Card key={feature.title} className="glass-panel interactive-card border border-border/70">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/15 shadow-[0_0_28px_color-mix(in_oklab,var(--primary)_24%,transparent)]">
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
            {howItWorks.map((step) => (
              <div key={step.step} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary font-mono text-lg font-bold text-primary-foreground">
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
        <div className="mx-auto max-w-3xl rounded-2xl bg-primary/90 p-6 text-center text-primary-foreground shadow-[0_18px_80px_color-mix(in_oklab,var(--primary)_45%,transparent)] sm:p-8 md:p-12">
          <ArrowLeftRight className="mx-auto mb-4 h-8 w-8" />
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
    </div>
  )
}
