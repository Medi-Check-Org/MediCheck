"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { Shield, ArrowLeft, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { authRoutes } from "@/utils"
import { useSignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { signIn } = useSignIn()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("Please enter your email address")
      return
    }
    setIsLoading(true)
    try {
      await signIn?.create({
        strategy: "reset_password_email_code",
        identifier: email,
      })
      toast.success("Verification code sent. Check your email.")
      router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`)
    } catch (error: any) {
      const msg = error?.errors?.[0]?.message || "Failed to send reset email"
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 bg-primary rounded flex items-center justify-center">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm text-foreground tracking-tight">MediCheck</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link
            href={authRoutes.login}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-7"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign In
          </Link>

          <div className="mb-7">
            <h1 className="text-xl font-semibold text-foreground mb-1 tracking-tight">
              Reset your password
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter your registered email and we&apos;ll send a verification code to reset your password.
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
                placeholder="you@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 text-sm"
                required
                autoComplete="email"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-9 text-sm"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Code"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-5">
            Remember your password?{" "}
            <Link href={authRoutes.login} className="text-foreground font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
