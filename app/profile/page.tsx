"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, Globe, Loader2, MapPin, Shield, Star, Timer, X } from "lucide-react"

const skillOptions = [
  "JavaScript", "React", "Node.js", "Python", "Machine Learning", "Data Science",
  "Java", "Spring Boot", "DSA", "UI/UX Design", "Figma", "Adobe XD",
  "DevOps", "Docker", "Kubernetes", "English Speaking", "Communication",
  "Public Speaking", "Tailwind CSS", "Web Development", "Deep Learning",
  "SQL", "MongoDB", "AWS", "Flutter", "Kotlin", "Swift",
]
const languageOptions = ["English", "Hindi", "Tamil", "Telugu", "Gujarati", "Malayalam", "Marathi", "Bengali", "Kannada"]
const timeSlots = ["Morning", "Afternoon", "Evening", "Night"]
const cities = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Pune", "Hyderabad", "Kolkata", "Ahmedabad"]
const learningStyles = ["visual", "auditory", "reading", "kinesthetic", "mixed"] as const

export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    name: "",
    city: "",
    area: "",
    bio: "",
    teachSkills: [] as string[],
    learnSkills: [] as string[],
    skillLevel: "beginner",
    learningStyle: "mixed",
    languages: [] as string[],
    availabilitySlots: [] as string[],
    offlineMeetPreferred: false,
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
    if (user) {
      setForm({
        name: user.name,
        city: user.city,
        area: user.area || "",
        bio: user.bio || "",
        teachSkills: user.teachSkills,
        learnSkills: user.learnSkills,
        skillLevel: user.skillLevel,
        learningStyle: user.learningStyle || "mixed",
        languages: user.languages,
        availabilitySlots: user.availabilitySlots,
        offlineMeetPreferred: user.offlineMeetPreferred || false,
      })
    }
  }, [user, loading, router])

  const addToList = (field: "teachSkills" | "learnSkills" | "languages" | "availabilitySlots", value: string) => {
    if (!form[field].includes(value)) {
      setForm((prev) => ({ ...prev, [field]: [...prev[field], value] }))
    }
  }

  const removeFromList = (field: "teachSkills" | "learnSkills" | "languages" | "availabilitySlots", value: string) => {
    setForm((prev) => ({ ...prev, [field]: prev[field].filter((v) => v !== value) }))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        await refreshUser()
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="page-shell max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Your Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">Manage your skills, preferences, and availability.</p>
      </div>

      {/* Profile Header Card */}
      <Card className="section-card mb-6">
        <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-3 sm:justify-start">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {user.city}{user.area ? ` / ${user.area}` : ""}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" /> {user.languages.join(", ")}
              </span>
            </div>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-primary">{user.credits}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground"><Timer className="h-3 w-3" />Credits</div>
            </div>
            <div>
              <div className="text-lg font-bold text-chart-2">{user.trustScore}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground"><Shield className="h-3 w-3" />Trust</div>
            </div>
            <div>
              <div className="text-lg font-bold text-chart-5">{user.sessionsCompleted}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground"><Star className="h-3 w-3" />Sessions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Info */}
        <Card className="section-card">
          <CardHeader>
            <CardTitle className="text-lg">Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Select value={form.city} onValueChange={(v) => setForm((p) => ({ ...p, city: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Area</Label>
              <Input value={form.area} onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card className="section-card">
          <CardHeader>
            <CardTitle className="text-lg">Skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Skills You Teach</Label>
              <Select onValueChange={(v) => addToList("teachSkills", v)}>
                <SelectTrigger><SelectValue placeholder="Add a teaching skill" /></SelectTrigger>
                <SelectContent>
                  {skillOptions.filter((s) => !form.teachSkills.includes(s)).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-1.5">
                {form.teachSkills.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {s}
                    <button type="button" onClick={() => removeFromList("teachSkills", s)}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Skills You Learn</Label>
              <Select onValueChange={(v) => addToList("learnSkills", v)}>
                <SelectTrigger><SelectValue placeholder="Add a learning skill" /></SelectTrigger>
                <SelectContent>
                  {skillOptions.filter((s) => !form.learnSkills.includes(s)).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-1.5">
                {form.learnSkills.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-1 text-xs font-medium text-accent-foreground">
                    {s}
                    <button type="button" onClick={() => removeFromList("learnSkills", s)}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Skill Level</Label>
              <Select value={form.skillLevel} onValueChange={(v) => setForm((p) => ({ ...p, skillLevel: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Learning Style</Label>
              <Select value={form.learningStyle} onValueChange={(v) => setForm((p) => ({ ...p, learningStyle: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {learningStyles.map((style) => (
                    <SelectItem key={style} value={style}>
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Languages & Availability */}
        <Card className="section-card">
          <CardHeader>
            <CardTitle className="text-lg">Languages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select onValueChange={(v) => addToList("languages", v)}>
              <SelectTrigger><SelectValue placeholder="Add a language" /></SelectTrigger>
              <SelectContent>
                {languageOptions.filter((l) => !form.languages.includes(l)).map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-1.5">
              {form.languages.map((l) => (
                <span key={l} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                  {l}
                  <button type="button" onClick={() => removeFromList("languages", l)}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="section-card">
          <CardHeader>
            <CardTitle className="text-lg">Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() =>
                    form.availabilitySlots.includes(slot)
                      ? removeFromList("availabilitySlots", slot)
                      : addToList("availabilitySlots", slot)
                  }
                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    form.availabilitySlots.includes(slot)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-foreground">Offline Meet Preference</p>
                <p className="text-xs text-muted-foreground">Used for nearby partner prioritization</p>
              </div>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, offlineMeetPreferred: !p.offlineMeetPreferred }))}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  form.offlineMeetPreferred ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {form.offlineMeetPreferred ? "Enabled" : "Disabled"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save */}
      <div className="mt-6 flex items-center justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-1 text-sm text-primary">
            <Check className="h-4 w-4" /> Profile saved!
          </span>
        )}
        <Button onClick={handleSave} disabled={saving} className="min-w-[140px]">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  )
}
