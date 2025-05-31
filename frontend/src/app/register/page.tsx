"use client"

import { useState, type FormEvent, useContext } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AuthContext } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BookOpen, AlertCircle, Mail, Lock, User, CheckCircle, ArrowRight, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const authContext = useContext(AuthContext)

  if (!authContext) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <p className="mt-4 text-muted-foreground">Načítavam...</p>
      </div>
    )
  }

  const { isLoading: authIsLoading } = authContext

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password.length < 6) {
      setError("Heslo musí mať aspoň 6 znakov.")
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, full_name: fullName }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed")
      }

      setSuccess("Registrácia úspešná! Teraz sa môžete prihlásiť.")
      // Redirect to login page after successful registration
      router.push("/login")
      setEmail("")
      setPassword("")
      setFullName("")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 pt-16">
      {/* Background elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div
          className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">
            Začnite s{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">TutorAI</span>
          </h1>
          <p className="text-muted-foreground mt-2">Vytvorte si účet a začnite svoju vzdelávaciu cestu</p>
        </div>

        <Card className="border-muted/60 shadow-lg">
          <CardHeader className="relative">
            <Badge
              variant="outline"
              className="absolute -top-3 right-8 bg-primary/10 border-primary/20 text-primary px-3 py-1"
            >
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              Zdarma
            </Badge>
            <CardTitle className="text-2xl font-bold">Registrácia</CardTitle>
            <CardDescription>Vytvorte si nový účet</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6 border-destructive/20 bg-destructive/5">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Chyba pri registrácii</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle>Úspech!</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Celé meno (nepovinné)
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ján Vzorový"
                    autoComplete="name"
                    className="pl-10 h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Emailová adresa
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="vas@email.com"
                    autoComplete="email"
                    className="pl-10 h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Heslo
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Min. 6 znakov"
                    autoComplete="new-password"
                    className="pl-10 h-11"
                  />
                </div>
              </div>
              <Button type="submit" disabled={authIsLoading} className="w-full h-11 text-base font-medium group">
                {authIsLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                    Registrujem...
                  </>
                ) : (
                  <>
                    Zaregistrovať sa
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t p-6">
            <p className="text-sm text-muted-foreground">
              Už máte účet?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Prihláste sa tu
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
