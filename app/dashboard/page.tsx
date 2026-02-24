"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  ArrowRight,
  BookOpen,
  Clock,
  MapPin,
  MessageSquare,
  Search,
  Shield,
  Star,
  Timer,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { data: matchData } = useSWR(user ? "/api/matches" : null, fetcher)
  const { data: sessionData } = useSWR(user ? "/api/sessions" : null, fetcher)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const topMatches = matchData?.matches?.slice(0, 3) || []
  const activeSessions = sessionData?.sessions?.filter((s: { status: string }) => s.status === "active" || s.status === "scheduled") || []
  const completedSessions = sessionData?.sessions?.filter((s: { status: string }) => s.status === "completed") || []

  return (
    <div className="page-shell">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Welcome back, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Personalized insights for your learning economy: match quality, trust momentum, and credit growth.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="section-card">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Timer className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{user.credits}</p>
              <p className="text-sm text-muted-foreground">Time Credits</p>
            </div>
          </CardContent>
        </Card>

        <Card className="section-card">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-chart-2/10">
              <Shield className="h-6 w-6 text-chart-2" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{user.trustScore}</p>
              <p className="text-sm text-muted-foreground">Trust Score</p>
            </div>
          </CardContent>
        </Card>

        <Card className="section-card">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-chart-3/10">
              <BookOpen className="h-6 w-6 text-chart-3" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{user.sessionsCompleted}</p>
              <p className="text-sm text-muted-foreground">Sessions Done</p>
            </div>
          </CardContent>
        </Card>

        <Card className="section-card">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-chart-5/10">
              <TrendingUp className="h-6 w-6 text-chart-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{user.reliabilityScore}</p>
              <p className="text-sm text-muted-foreground">Reliability</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Skills Overview */}
        <Card className="section-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Your Skills</CardTitle>
            <CardDescription>What you teach and want to learn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Teaching</p>
              <div className="flex flex-wrap gap-2">
                {user.teachSkills.map((skill) => (
                  <span key={skill} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Learning</p>
              <div className="flex flex-wrap gap-2">
                {user.learnSkills.map((skill) => (
                  <span key={skill} className="rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent-foreground">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Level</p>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium capitalize text-secondary-foreground">
                  {user.skillLevel}
                </span>
                <Progress
                  value={user.skillLevel === "beginner" ? 33 : user.skillLevel === "intermediate" ? 66 : 100}
                  className="h-2 flex-1"
                />
              </div>
            </div>
            <Link href="/profile">
              <Button variant="outline" className="w-full gap-2" size="sm">
                Edit Profile
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Top Matches */}
        <Card className="section-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recommended Matches</CardTitle>
              <CardDescription>AI-powered skill partners for you</CardDescription>
            </div>
            <Link href="/explore">
              <Button variant="ghost" size="sm" className="gap-1">
                View All
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {topMatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Search className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No matches yet. Update your skills to find partners!</p>
                <Link href="/profile" className="mt-3">
                  <Button size="sm" variant="outline">Update Skills</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {topMatches.map((match: { user: { id: string; name: string; city: string; area?: string; trustScore: number; teachSkills: string[] }; score: number; confidence?: string; matchedTeachSkill: string; reasons: string[] }) => (
                  <div key={match.user.id} className="flex items-center gap-4 rounded-xl border border-border/70 p-4 transition-colors hover:bg-muted/45">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {match.user.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{match.user.name}</span>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {match.score}% match
                        </span>
                        {match.confidence ? (
                          <span className="rounded-full bg-chart-2/10 px-2 py-0.5 text-xs font-medium text-chart-2 capitalize">
                            {match.confidence} confidence
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {match.user.city}{match.user.area ? ` / ${match.user.area}` : ""} - Can teach: {match.matchedTeachSkill}
                      </p>
                    </div>
                    <Link href={`/chat?partner=${match.user.id}`}>
                      <Button size="sm" variant="outline" className="gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Chat
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Sessions & Quick Actions */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="section-card">
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
            <CardDescription>{activeSessions.length} active or scheduled</CardDescription>
          </CardHeader>
          <CardContent>
            {activeSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Clock className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No upcoming sessions. Find a match and schedule one!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSessions.slice(0, 3).map((session: { id: string; skill: string; status: string; startTime?: string; teacher?: { name: string }; learner?: { name: string }; teacherId: string }) => (
                  <div key={session.id} className="flex items-center justify-between rounded-xl border border-border/70 p-3">
                    <div>
                      <p className="font-medium text-foreground">{session.skill}</p>
                      <p className="text-xs text-muted-foreground">
                        with {session.teacherId === user.id ? session.learner?.name : session.teacher?.name}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      session.status === "active"
                        ? "bg-primary/10 text-primary"
                        : "bg-chart-2/10 text-chart-2"
                    }`}>
                      {session.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Link href="/sessions" className="mt-4 block">
              <Button variant="outline" className="w-full gap-2" size="sm">
                View All Sessions
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="section-card">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Jump into what matters</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link href="/explore">
              <Button variant="outline" className="h-auto w-full flex-col gap-2 py-6">
                <Search className="h-6 w-6 text-primary" />
                <span className="text-sm">Find Matches</span>
              </Button>
            </Link>
            <Link href="/chat">
              <Button variant="outline" className="h-auto w-full flex-col gap-2 py-6">
                <MessageSquare className="h-6 w-6 text-chart-2" />
                <span className="text-sm">Messages</span>
              </Button>
            </Link>
            <Link href="/sessions">
              <Button variant="outline" className="h-auto w-full flex-col gap-2 py-6">
                <Timer className="h-6 w-6 text-chart-3" />
                <span className="text-sm">Sessions</span>
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline" className="h-auto w-full flex-col gap-2 py-6">
                <Users className="h-6 w-6 text-chart-5" />
                <span className="text-sm">Profile</span>
              </Button>
            </Link>
            <Link href="/offline-meets">
              <Button variant="outline" className="h-auto w-full flex-col gap-2 py-6">
                <MapPin className="h-6 w-6 text-primary" />
                <span className="text-sm">Offline Meet</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
