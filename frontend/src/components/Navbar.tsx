"use client"

import { useContext } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthContext } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { BookOpen, LogOut, Settings, UserCircle2, LogIn, UserPlus, Sparkles, GraduationCap } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export default function Navbar() {
  const authContext = useContext(AuthContext)
  const router = useRouter()

  if (!authContext) {
    return (
      <nav className="bg-background/80 backdrop-blur-sm border-b border-border/40 fixed w-full top-0 z-50">
        <div className="container mx-auto flex justify-between items-center h-16 px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              TutorAI
            </span>
          </div>
          <div className="h-8 w-24 bg-muted/60 rounded-full animate-pulse"></div>
        </div>
      </nav>
    )
  }

  const { user, logout, isLoading: authIsLoading } = authContext

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <nav className="bg-background/80 backdrop-blur-sm border-b border-border/40 fixed w-full top-0 z-50 print:hidden">
      <div className="container mx-auto flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80 group">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            TutorAI
          </span>
        </Link>

        <div className="flex items-center gap-3 md:gap-4">
          {authIsLoading ? (
            <div className="h-9 w-32 bg-muted/60 rounded-full animate-pulse"></div>
          ) : user ? (
            <>
              <Link href="/dashboard" className="hidden sm:block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <GraduationCap className="h-4 w-4" />
                  <span>Dashboard</span>
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 px-2 hover:bg-primary/5 transition-colors"
                  >
                    <Avatar className="h-8 w-8 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {user.full_name ? getInitials(user.full_name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden md:inline truncate max-w-[120px]">
                      {user.full_name || user.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col gap-1">
                    <span className="font-medium">{user.full_name || "Používateľ"}</span>
                    <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/dashboard">
                    <DropdownMenuItem className="cursor-pointer sm:hidden">
                      <GraduationCap className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer">
                      <UserCircle2 className="mr-2 h-4 w-4" />
                      <span>Profil</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/settings">
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Nastavenia</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Odhlásiť sa</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  <span>Prihlásiť sa</span>
                </Button>
              </Link>
              <Link href="/register" >
                <Button size="sm" className="flex items-center gap-2 group">
                  <UserPlus className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>Registrovať sa</span>
                  <Badge
                    variant="outline"
                    className="ml-1 bg-primary/10 border-primary/20 text-white text-[10px] px-1 py-0 hidden sm:flex"
                  >
                    <Sparkles className="h-3 w-3 mr-0.5 text-white" />
                    Zdarma
                  </Badge>
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
