"use client"

import { useClerk } from "@clerk/nextjs"
import { authRoutes } from "@/utils"
import { ShieldOff, ArrowLeft } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const UnauthorizedPage = () => {
  const { signOut } = useClerk()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-xs">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </Link>
        <ThemeToggle />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-6">
            <div className="h-12 w-12 bg-destructive/10 rounded-lg flex items-center justify-center">
              <ShieldOff className="h-6 w-6 text-destructive" />
            </div>
          </div>

          <h1 className="text-xl font-semibold text-foreground mb-2 tracking-tight">
            Access Denied
          </h1>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            You do not have permission to access this resource. Please sign in with an authorized account or contact your administrator.
          </p>

          <div className="flex flex-col gap-3">
            <Button
              variant="default"
              className="w-full"
              onClick={() => signOut({ redirectUrl: authRoutes.login })}
            >
              Sign Out
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">Return to Home</Link>
            </Button>
          </div>

          <p className="mt-8 text-xs text-muted-foreground">
            If you believe this is an error, contact{" "}
            <a href="mailto:support@medicheck.io" className="text-foreground hover:underline">
              support@medicheck.io
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default UnauthorizedPage
