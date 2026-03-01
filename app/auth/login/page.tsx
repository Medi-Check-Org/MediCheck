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
        toast.success("Successfully signed in!")
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
      {/* CAPTCHA element for Clerk Smart CAPTCHA */}
      <div id="clerk-captcha" />

      {/* Left Panel — Brand / Trust */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary flex-col justify-between p-10 xl:p-14">
        <div>
          <div className="flex items-center gap-2.5 mb-16">
            <Shield className="h-6 w-6 text-primary-foreground" />
            <span className="font-bold text-lg text-primary-foreground tracking-tight">MediCheck</span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-bold text-primary-foreground leading-tight text-balance mb-4">
            Secure Medication<br />Verification Platform
          </h1>
          <p className="text-primary-foreground/70 text-base leading-relaxed max-w-sm">
            Blockchain-backed traceability for Africa&apos;s pharmaceutical supply chain.
            Trusted by manufacturers, hospitals, and regulators.
          </p>
        </div>

        <div className="space-y-3">
          {[
            { icon: CheckCircle, text: "Immutable blockchain event logging" },
            { icon: Lock, text: "Enterprise-grade 256-bit encryption" },
            { icon: Shield, text: "NAFDAC regulatory compliance ready" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <Icon className="h-4 w-4 text-accent flex-shrink-0" />
              <span className="text-sm text-primary-foreground/80">{text}</span>
            </div>
          ))}
          <div className="pt-6 border-t border-primary-foreground/20">
            <p className="text-xs text-primary-foreground/50 font-mono">
              &copy; 2025 MediCheck. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col">
        {/* Top Nav */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-12">
          <div className="w-full max-w-sm">
            {/* Mobile brand mark */}
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="bg-primary p-1.5 rounded-md">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-base text-foreground tracking-tight">MediCheck</span>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-1.5 tracking-tight">Sign in to your account</h2>
              <p className="text-muted-foreground text-sm">Enter your credentials to access the dashboard.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@organization.com"
                  className="h-10"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                  <Link href="/auth/forgot-password" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
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
                    className="h-10 pr-10"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                disabled={isLoading}
                type="submit"
                variant="default"
                className="w-full h-10 mt-1"
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
              <Button variant="outline" asChild className="w-full h-10">
                <Link href="/auth/team-member-login" className="flex items-center justify-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Team Member Login</span>
                </Link>
              </Button>

              <p className="text-sm text-muted-foreground text-center">
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
