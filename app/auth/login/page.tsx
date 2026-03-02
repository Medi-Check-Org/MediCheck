"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { Shield, Eye, EyeOff, Users, ArrowLeft, Lock, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSignIn, useUser } from "@clerk/nextjs"
import { toast } from "react-toastify"
import { getRedirectPath } from "@/utils"
import { authRoutes } from "@/utils"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const { signIn, setActive } = useSignIn()
  const { user, isSignedIn } = useUser()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    if (!signIn) return
    try {
      const result = await signIn.create({ identifier: email, password })
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        toast.success("Signed in successfully.")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isSignedIn && user) {
      const role = user.publicMetadata?.role as string | undefined
      const orgType = user.publicMetadata?.organizationType as string | undefined
      router.push(getRedirectPath(role, orgType))
    }
  }, [isSignedIn, user, router])

  return (
    <div className="min-h-screen bg-background flex">
      <div id="clerk-captcha" />

      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[44%] bg-primary flex-col justify-between p-10 xl:p-12">
        <div>
          <div className="flex items-center gap-2.5 mb-14">
            <div className="h-7 w-7 bg-accent rounded flex items-center justify-center flex-shrink-0">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm text-white tracking-tight">MediCheck</span>
          </div>

          <div className="mb-10">
            <p className="text-xs font-mono text-white/40 uppercase tracking-widest mb-4">Regulatory Platform</p>
            <h1 className="text-2xl xl:text-3xl font-semibold text-white leading-snug text-balance mb-4">
              Medication Verification & Supply Chain Intelligence
            </h1>
            <p className="text-sm text-white/60 leading-relaxed max-w-xs">
              Blockchain-backed traceability for Africa&apos;s pharmaceutical supply chain. Trusted by manufacturers, hospitals, and regulatory authorities.
            </p>
          </div>
        </div>

        <div>
          <div className="space-y-3 mb-8">
            {[
              { icon: CheckCircle, text: "Immutable blockchain event logging" },
              { icon: Lock, text: "256-bit enterprise encryption" },
              { icon: Shield, text: "NAFDAC regulatory compliance" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <Icon className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                <span className="text-xs text-white/70">{text}</span>
              </div>
            ))}
          </div>
          <div className="pt-5 border-t border-white/10">
            <p className="text-xs text-white/30 font-mono">&copy; 2025 MediCheck. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-12">
          <div className="w-full max-w-sm">
            {/* Mobile brand */}
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="h-7 w-7 bg-primary rounded flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm text-foreground tracking-tight">MediCheck</span>
            </div>

            <div className="mb-7">
              <h2 className="text-xl font-semibold text-foreground mb-1 tracking-tight">
                Sign in to your account
              </h2>
              <p className="text-xs text-muted-foreground">
                Enter your credentials to access the platform.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-foreground">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@organization.com"
                  className="h-9 text-sm"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium text-foreground">
                    Password
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-9 text-sm pr-10"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <Button
                disabled={isLoading}
                type="submit"
                variant="default"
                className="w-full h-9 mt-1 text-sm"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-5 space-y-4">
              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <Button variant="outline" asChild className="w-full h-9 text-sm">
                <Link href="/auth/team-member-login" className="flex items-center justify-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  <span>Team Member Login</span>
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {"Don't have an account? "}
                <Link href="/auth/register" className="text-foreground hover:underline font-medium">
                  Register your organization
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
