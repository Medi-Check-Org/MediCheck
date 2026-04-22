"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { Shield, ArrowLeft, Users, Mail, CheckCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "react-toastify"
import { useSignIn } from "@clerk/nextjs"

export default function TeamMemberLoginPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { signIn } = useSignIn()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("Please enter your email address")
      return
    }
    if (!signIn) {
      toast.error("Authentication not initialized")
      return
    }
    setIsLoading(true)
    try {
      const response = await fetch("/api/web/auth/team-member-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (response.ok) {
        await signIn.create({
          identifier: email,
          strategy: "email_link",
          redirectUrl: `${window.location.origin}/auth/login`,
        })
        setEmailSent(true)
        toast.success("Magic link sent. Check your email.")
      } else {
        toast.error(data.error || "Failed to send login email")
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.")
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
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-7"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign In
          </Link>

          {emailSent ? (
            <div>
              <div className="mb-7">
                <div className="h-9 w-9 bg-status-verified/10 border border-status-verified/20 rounded flex items-center justify-center mb-4">
                  <CheckCircle className="h-4 w-4 text-status-verified" />
                </div>
                <h1 className="text-xl font-semibold text-foreground mb-1 tracking-tight">
                  Check your email
                </h1>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A secure login link has been sent to{" "}
                  <span className="text-foreground font-medium">{email}</span>.
                  Click the link to access your team dashboard.
                </p>
              </div>

              <div className="bg-muted border border-border rounded p-3 mb-5">
                <p className="text-xs text-muted-foreground">
                  Didn&apos;t receive the email? Check your spam folder or{" "}
                  <button
                    onClick={() => { setEmailSent(false); setEmail("") }}
                    className="text-foreground underline-offset-2 hover:underline font-medium"
                  >
                    try again
                  </button>
                  .
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                Need access? Contact your organization administrator.
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-7">
                <div className="h-9 w-9 bg-muted border border-border rounded flex items-center justify-center mb-4">
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <h1 className="text-xl font-semibold text-foreground mb-1 tracking-tight">
                  Team member login
                </h1>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter your work email to receive a secure, passwordless login link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-foreground">
                    Work email address
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
                  disabled={isLoading}
                  className="w-full h-9 text-sm"
                >
                  {isLoading ? (
                    "Sending..."
                  ) : (
                    <>
                      <Mail className="h-3.5 w-3.5 mr-2" />
                      Send Magic Link
                    </>
                  )}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground text-center mt-5">
                Not a team member?{" "}
                <Link href="/auth/login" className="text-foreground font-medium hover:underline">
                  Sign in with password
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
