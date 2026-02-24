"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeftRight, Loader2, X } from "lucide-react"

const cities = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Pune", "Hyderabad", "Kolkata", "Ahmedabad"]
const skillOptions = [
  "JavaScript", "React", "Node.js", "Python", "Machine Learning", "Data Science",
  "Java", "Spring Boot", "DSA", "UI/UX Design", "Figma", "Adobe XD",
  "DevOps", "Docker", "Kubernetes", "English Speaking", "Communication",
  "Public Speaking", "Tailwind CSS", "Web Development", "Deep Learning",
  "SQL", "MongoDB", "AWS", "Flutter", "Kotlin", "Swift",
]
const languageOptions = ["English", "Hindi", "Tamil", "Telugu", "Gujarati", "Malayalam", "Marathi", "Bengali", "Kannada"]
const timeSlots = ["Morning", "Afternoon", "Evening", "Night"]
const learningStyles = ["visual", "auditory", "reading", "kinesthetic", "mixed"] as const

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    city: "",
    area: "",
    bio: "",
    teachSkills: [] as string[],
    learnSkills: [] as string[],
    skillLevel: "beginner",
    learningStyle: "mixed",
    languages: ["English"] as string[],
    availabilitySlots: [] as string[],
    offlineMeetPreferred: false,
  })

  const addToList = (field: "teachSkills" | "learnSkills" | "languages" | "availabilitySlots", value: string) => {
    if (!formData[field].includes(value)) {
      setFormData((prev) => ({ ...prev, [field]: [...prev[field], value] }))
    }
  }

  const removeFromList = (field: "teachSkills" | "learnSkills" | "languages" | "availabilitySlots", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: prev[field].filter((v) => v !== value) }))
  }

  const handleSubmit = async () => {
    setError("")
    setLoading(true)

    const result = await register(formData)
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center overflow-hidden px-4 py-8 sm:py-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-0 top-0 h-60 w-60 -translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/20 blur-3xl sm:h-80 sm:w-80" />
        <div className="absolute right-0 top-1/3 h-56 w-56 translate-x-1/4 rounded-full bg-chart-3/20 blur-3xl sm:h-72 sm:w-72" />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 translate-y-1/3 rounded-full bg-accent/20 blur-3xl sm:h-72 sm:w-72" />
      </div>
      <Card className="glass-panel w-full max-w-lg border border-border/70 shadow-[0_18px_60px_color-mix(in_oklab,var(--foreground)_16%,transparent)]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-[0_0_24px_color-mix(in_oklab,var(--primary)_40%,transparent)]">
            <ArrowLeftRight className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold sm:text-3xl">
            <span className="heading-gradient">Create Account</span>
          </CardTitle>
          <CardDescription>
            Step {step} of 3 - {step === 1 ? "Basic Info" : step === 2 ? "Skills & Interests" : "Availability & Bio"}
          </CardDescription>
          <div className="flex gap-1 pt-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Select value={formData.city} onValueChange={(v) => setFormData((p) => ({ ...p, city: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Area (Optional)</Label>
                <Input
                  id="area"
                  placeholder="Your area / locality"
                  value={formData.area}
                  onChange={(e) => setFormData((p) => ({ ...p, area: e.target.value }))}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label>Skills You Can Teach</Label>
                <Select onValueChange={(v) => addToList("teachSkills", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add a skill you can teach" />
                  </SelectTrigger>
                  <SelectContent>
                    {skillOptions.filter((s) => !formData.teachSkills.includes(s)).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2">
                  {formData.teachSkills.map((skill) => (
                    <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {skill}
                      <button type="button" onClick={() => removeFromList("teachSkills", skill)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Skills You Want to Learn</Label>
                <Select onValueChange={(v) => addToList("learnSkills", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add a skill to learn" />
                  </SelectTrigger>
                  <SelectContent>
                    {skillOptions.filter((s) => !formData.learnSkills.includes(s)).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2">
                  {formData.learnSkills.map((skill) => (
                    <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent-foreground">
                      {skill}
                      <button type="button" onClick={() => removeFromList("learnSkills", skill)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Skill Level</Label>
                <Select value={formData.skillLevel} onValueChange={(v) => setFormData((p) => ({ ...p, skillLevel: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Learning Style</Label>
                <Select value={formData.learningStyle} onValueChange={(v) => setFormData((p) => ({ ...p, learningStyle: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {learningStyles.map((style) => (
                      <SelectItem key={style} value={style}>
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Languages</Label>
                <Select onValueChange={(v) => addToList("languages", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add a language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languageOptions.filter((l) => !formData.languages.includes(l)).map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2">
                  {formData.languages.map((lang) => (
                    <span key={lang} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                      {lang}
                      <button type="button" onClick={() => removeFromList("languages", lang)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label>Availability</Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() =>
                        formData.availabilitySlots.includes(slot)
                          ? removeFromList("availabilitySlots", slot)
                          : addToList("availabilitySlots", slot)
                      }
                      className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                        formData.availabilitySlots.includes(slot)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-foreground">Open to Offline Meetups</p>
                  <p className="text-xs text-muted-foreground">Enable nearby/same-city partner preference</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, offlineMeetPreferred: !p.offlineMeetPreferred }))}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    formData.offlineMeetPreferred ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {formData.offlineMeetPreferred ? "Yes" : "No"}
                </button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell others about yourself, your learning goals, and what motivates you..."
                  value={formData.bio}
                  onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))}
                  rows={4}
                />
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <div className="flex w-full gap-3">
            {step > 1 && (
              <Button variant="outline" className="flex-1" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button
                className="flex-1"
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && (!formData.name || !formData.email || !formData.password || !formData.city)}
              >
                Continue
              </Button>
            ) : (
              <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            )}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
