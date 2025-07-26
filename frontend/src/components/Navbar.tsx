"use client"

import { useContext } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthContext } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  LogOut,
  Settings,
  UserCircle2,
  LogIn,
  UserPlus,
  Sparkles,
  GraduationCap,
  Home,
  Menu,
} from "lucide-react"
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
      <nav className="bg-gradient-to-r from-background/95 via-background/90 to-background/95 backdrop-blur-xl border-b border-gradient-to-r from-border/20 via-border/40 to-border/20 fixed w-full top-0 z-50 shadow-lg shadow-primary/5">
        <div className="container mx-auto flex justify-between items-center h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shadow-lg">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-600 to-secondary">
              Vedom.io
            </span>
          </div>
          <div className="h-10 w-32 bg-gradient-to-r from-muted/40 to-muted/60 rounded-xl animate-pulse"></div>
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
    <nav className="bg-gradient-to-r from-background/95 via-background/90 to-background/95 backdrop-blur-xl border-b border-gradient-to-r from-border/20 via-border/40 to-border/20 fixed w-full top-0 z-50 print:hidden shadow-lg shadow-primary/5">
      <div className="container mx-auto flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 transition-all duration-300 hover:scale-105 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:shadow-primary/20 transition-all duration-300">
            <BookOpen className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
          </div>
          <span className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-600 to-secondary">
            Vedom.io
          </span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-4 md:gap-6">
          {authIsLoading ? (
            <div className="h-10 w-40 bg-gradient-to-r from-muted/40 to-muted/60 rounded-xl animate-pulse"></div>
          ) : user ? (
            <>
              {/* Desktop Navigation Links */}
              <div className="hidden lg:flex items-center gap-2">
                <Link href="/">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 rounded-xl px-4 py-2 group"
                  >
                    <Home className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-medium">Domov</span>
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 rounded-xl px-4 py-2 group"
                  >
                    <GraduationCap className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-medium">Dashboard</span>
                  </Button>
                </Link>
              </div>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-3 px-3 py-2 hover:bg-primary/10 transition-all duration-300 rounded-xl group"
                  >
                    <Avatar className="h-9 w-9 border-2 border-primary/30 shadow-lg group-hover:shadow-xl group-hover:shadow-primary/20 transition-all duration-300">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary text-sm font-semibold">
                        {user.full_name ? getInitials(user.full_name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-sm font-semibold text-foreground truncate max-w-[120px]">
                        {user.full_name || "Používateľ"}
                      </span>
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">{user.email}</span>
                    </div>
                    <Menu className="h-4 w-4 text-muted-foreground lg:hidden" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl shadow-primary/10 rounded-2xl p-2"
                >
                  <DropdownMenuLabel className="flex flex-col gap-2 p-3 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-primary/30">
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-semibold">
                          {user.full_name ? getInitials(user.full_name) : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{user.full_name || "Používateľ"}</span>
                        <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-2" />

                  {/* Mobile Navigation Items */}
                  <Link href="/">
                    <DropdownMenuItem className="cursor-pointer lg:hidden rounded-xl p-3 hover:bg-primary/10 transition-colors duration-200">
                      <Home className="mr-3 h-4 w-4 text-primary" />
                      <span className="font-medium">Domov</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/dashboard">
                    <DropdownMenuItem className="cursor-pointer lg:hidden rounded-xl p-3 hover:bg-primary/10 transition-colors duration-200">
                      <GraduationCap className="mr-3 h-4 w-4 text-primary" />
                      <span className="font-medium">Dashboard</span>
                    </DropdownMenuItem>
                  </Link>

                  {/* Profile & Settings */}
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer rounded-xl p-3 hover:bg-primary/10 transition-colors duration-200">
                      <UserCircle2 className="mr-3 h-4 w-4 text-primary" />
                      <span className="font-medium">Profil</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/settings">
                    <DropdownMenuItem className="cursor-pointer rounded-xl p-3 hover:bg-primary/10 transition-colors duration-200">
                      <Settings className="mr-3 h-4 w-4 text-primary" />
                      <span className="font-medium">Nastavenia</span>
                    </DropdownMenuItem>
                  </Link>

                  <DropdownMenuSeparator className="my-2" />

                  {/* Logout */}
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:text-destructive rounded-xl p-3 hover:bg-destructive/10 transition-colors duration-200"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="font-medium">Odhlásiť sa</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {/* Login/Register Buttons */}
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 hover:bg-primary/10 transition-all duration-300 rounded-xl px-4 py-2 group"
                >
                  <LogIn className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-medium">Prihlásiť sa</span>
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 rounded-xl px-4 py-2 shadow-lg hover:shadow-xl hover:shadow-primary/25 group"
                >
                  <UserPlus className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-medium">Registrovať sa</span>
                  <Badge
                    variant="outline"
                    className="ml-2 bg-white/20 border-white/30 text-white text-[10px] px-2 py-0.5 hidden sm:flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
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
