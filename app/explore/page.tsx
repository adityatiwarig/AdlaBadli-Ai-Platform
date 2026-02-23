"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Globe,
  Heart,
  MapPin,
  MessageSquare,
  Search,
  Shield,
  Sparkles,
  Star,
  Timer,
  Users,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface MatchUser {
  id: string
  name: string
  city: string
  area?: string
  offlineMeetPreferred?: boolean
  teachSkills: string[]
  learnSkills: string[]
  skillLevel: string
  learningStyle?: string
  languages: string[]
  trustScore: number
  reliabilityScore: number
  sessionsCompleted: number
  bio?: string
  availabilitySlots: string[]
}

interface MatchResult {
  user: MatchUser
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

const SHORTLIST_KEY = "adlabadli-shortlist"

export default function ExplorePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { data } = useSWR(user ? "/api/matches" : null, fetcher)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSkill, setSelectedSkill] = useState("")
  const [sameCityOnly, setSameCityOnly] = useState(false)
  const [shortlistOnly, setShortlistOnly] = useState(false)
  const [shortlist, setShortlist] = useState<string[]>([])

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    const raw = localStorage.getItem(SHORTLIST_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setShortlist(parsed)
      } catch {
        // ignore parse error
      }
    }
  }, [])

  const toggleShortlist = (userId: string) => {
    setShortlist((prev) => {
      const updated = prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
      localStorage.setItem(SHORTLIST_KEY, JSON.stringify(updated))
      return updated
    })
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const matches: MatchResult[] = data?.matches || []
  const allTeachSkills = [...new Set(matches.flatMap((m) => m.user.teachSkills))]

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      const inShortlist = !shortlistOnly || shortlist.includes(match.user.id)
      const nameMatch = match.user.name.toLowerCase().includes(searchQuery.toLowerCase())
      const skillMatch =
        !selectedSkill || match.user.teachSkills.some((s) => s.toLowerCase().includes(selectedSkill.toLowerCase()))
      const cityMatch = !sameCityOnly || match.user.city.toLowerCase() === user.city.toLowerCase()
      return inShortlist && nameMatch && skillMatch && cityMatch
    })
  }, [matches, shortlistOnly, shortlist, searchQuery, selectedSkill, sameCityOnly, user.city])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Smart Matchmaking Hub
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">Find Your Best Learning Partner</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
              Improved scoring now prioritizes skill fit, schedule overlap, trust/reliability, local compatibility, and learning chemistry.
            </p>
          </div>
          <div className="rounded-xl bg-muted px-4 py-3 text-right">
            <p className="text-xs text-muted-foreground">Compatible partners</p>
            <p className="text-2xl font-bold text-foreground">{filteredMatches.length}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, city, or skill..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSameCityOnly((v) => !v)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                sameCityOnly ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              Same City
            </button>
            <button
              onClick={() => setShortlistOnly((v) => !v)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                shortlistOnly ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              Shortlisted
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedSkill("")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              !selectedSkill ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            All Skills
          </button>
          {allTeachSkills.slice(0, 10).map((skill) => (
            <button
              key={skill}
              onClick={() => setSelectedSkill(selectedSkill === skill ? "" : skill)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                selectedSkill === skill ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20">
          <Search className="mb-4 h-16 w-16 text-muted-foreground/40" />
          <h3 className="text-xl font-semibold text-foreground">No matches for these filters</h3>
          <p className="mt-2 text-sm text-muted-foreground">Try clearing skill/city filters or update your profile skills.</p>
          <Link href="/profile" className="mt-4">
            <Button variant="outline">Update Profile</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredMatches.map((match) => {
            const isShortlisted = shortlist.includes(match.user.id)
            const confidenceClass =
              match.confidence === "high"
                ? "bg-primary/10 text-primary"
                : match.confidence === "medium"
                  ? "bg-chart-2/10 text-chart-2"
                  : "bg-muted text-muted-foreground"

            return (
              <Card key={match.user.id} className="overflow-hidden border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <CardContent className="p-0">
                  <div className="border-b border-border bg-gradient-to-r from-primary/10 via-transparent to-accent/10 px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                          {match.user.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{match.user.name}</h3>
                          <p className="text-xs text-muted-foreground">{match.user.skillLevel} level • {match.user.learningStyle || "mixed"} style</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleShortlist(match.user.id)}
                        className={`rounded-full p-2 ${isShortlisted ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                        aria-label="Toggle shortlist"
                      >
                        <Heart className={`h-4 w-4 ${isShortlisted ? "fill-primary" : ""}`} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        <Sparkles className="h-3 w-3" /> {match.score}% score
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${confidenceClass}`}>
                        {match.confidence} confidence
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {match.user.city}{match.user.area ? ` / ${match.user.area}` : ""}
                      </span>
                      {match.user.city.toLowerCase() === user.city.toLowerCase() && (
                        <span className="rounded-full bg-chart-2/10 px-2 py-0.5 text-[10px] font-semibold text-chart-2">Same City</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="mb-1 text-muted-foreground">Skill Fit</p>
                        <Progress value={match.breakdown.skillFit} className="h-2" />
                      </div>
                      <div>
                        <p className="mb-1 text-muted-foreground">Schedule Fit</p>
                        <Progress value={match.breakdown.scheduleFit} className="h-2" />
                      </div>
                      <div>
                        <p className="mb-1 text-muted-foreground">Trust Fit</p>
                        <Progress value={match.breakdown.trustFit} className="h-2" />
                      </div>
                      <div>
                        <p className="mb-1 text-muted-foreground">Chemistry</p>
                        <Progress value={match.breakdown.chemistryFit} className="h-2" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Best skill they can teach you</p>
                        <p className="text-sm font-semibold text-foreground">{match.matchedTeachSkill}</p>
                      </div>
                      {match.matchedLearnSkill ? (
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Reciprocal learning opportunity</p>
                          <p className="text-sm text-foreground">You can teach: {match.matchedLearnSkill}</p>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Shield className="h-3.5 w-3.5" /> Trust {match.user.trustScore}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5" /> {match.user.sessionsCompleted} sessions
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5" /> {match.user.languages.slice(0, 2).join(", ")}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {match.reasons.slice(0, 3).map((reason) => (
                        <span key={reason} className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          {reason}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/chat?partner=${match.user.id}`} className="flex-1">
                        <Button size="sm" className="w-full gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5" />
                          Start Chat
                        </Button>
                      </Link>
                      <Link href={`/sessions?create=true&partner=${match.user.id}&skill=${match.matchedTeachSkill}`}>
                        <Button size="sm" variant="outline" className="gap-1.5">
                          <Timer className="h-3.5 w-3.5" />
                          Schedule
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="mt-8 rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Score includes skill fit, availability overlap, trust/reliability, location, and learning chemistry.
        </div>
      </div>
    </div>
  )
}
