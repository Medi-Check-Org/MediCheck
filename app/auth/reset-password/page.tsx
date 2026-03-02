"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { Shield, ArrowLeft, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { authRoutes } from "@/utils"
import { useSignIn } from "@clerk/nextjs"
import { LoadingSpinner } from "@/components/ui/loading"

function ResetPasswordForm() {
  const [otpCode, setOtpCode] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useSignIn()
  const email = searchParams.get("email")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpCode || !password || !confirmPassword) {
      toast.error("Please fill in all fields")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    setIsLoading(true)
    try {
      await signIn?.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: otpCode,
        password,
      })
      toast.success("Password updated successfully.")
      router.push("/auth/login")
    } catch (error: any) {
      const msg = error?.errors?.[0]?.message || "Failed to reset password"
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
              Set new password
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {email
                ? <>Enter the code sent to <span className="text-foreground font-medium">{email}</span> and your new password.</>
                : "Enter the verification code from your email and your new password."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="otpCode" className="text-xs font-medium text-foreground">
                Verification code
              </Label>
              <Input
                id="otpCode"
                type="text"
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                className="h-9 text-sm text-center tracking-[0.3em] font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-foreground">
                New password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 text-sm pr-10"
                  required
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

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-medium text-foreground">
                Confirm new password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-9 text-sm pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-9 text-sm" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="medium" text="Loading..." />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
