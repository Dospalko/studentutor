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
import { BookOpen, AlertCircle, Mail, Lock, ArrowRight } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
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

  const { login, isLoading: authIsLoading } = authContext

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const formData = new URLSearchParams()
    formData.append("username", email)
    formData.append("password", password)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Login failed")
      }

      if (data.access_token) {
        login(data.access_token)
        router.push("/dashboard")
      } else {
        setError("Login failed: No token received.")
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    }
  }

  return (
    <div className=" flex flex-col items-center justify-center bg-background p-4 pt-16">
      {/* Background elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl"
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
            Vitajte v{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">TutorAI</span>
          </h1>
          <p className="text-muted-foreground mt-2">Prihláste sa a pokračujte vo svojej vzdelávacej ceste</p>
        </div>

        <Card className="border-muted/60 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Prihlásenie</CardTitle>
            <CardDescription>Zadajte svoje prihlasovacie údaje</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6 border-destructive/20 bg-destructive/5">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Chyba pri prihlásení</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Heslo
                  </Label>
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                    Zabudli ste heslo?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="pl-10 h-11"
                  />
                </div>
              </div>
              <Button type="submit" disabled={authIsLoading} className="w-full h-11 text-base font-medium group">
                {authIsLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                    Prihlasujem...
                  </>
                ) : (
                  <>
                    Prihlásiť sa
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t p-6">
            <p className="text-sm text-muted-foreground">
              Ešte nemáte účet?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Zaregistrujte sa tu
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
