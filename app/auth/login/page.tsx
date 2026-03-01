"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { Shield, ArrowLeft, Eye, EyeOff, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSignIn, useUser } from "@clerk/nextjs";
import { toast } from "react-toastify";
import { getRedirectPath } from "@/utils"


export default function LoginPage() {

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const { signIn, setActive } = useSignIn();

  const { user, isSignedIn } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    if (!signIn) return;

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      console.log("Sign-in result:", result);

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast.success("Successfully signed in!");
      }

    }
    catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
    finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isSignedIn && user) {

      const role = user.publicMetadata?.role as string | undefined;

      const orgType = user.publicMetadata?.organizationType as string | undefined;

      console.log("User Role:", role);
      
      console.log("Organization Type:", orgType);

      const redirectPath = getRedirectPath(role, orgType);

      router.push(redirectPath);
    }
  }, [isSignedIn, user, router]);


  return (
    <div className="min-h-screen bg-background">
      {/* CAPTCHA element for Clerk Smart CAPTCHA */}
      <div id="clerk-captcha"></div>

      {/* Navigation */}
      <nav className="border-b border-border bg-card fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="bg-primary p-1.5 rounded-lg">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-bold text-lg text-foreground">MediCheck</span>
                <span className="text-xs text-muted-foreground font-mono ml-2 hidden sm:inline">Blockchain Secured</span>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Back to Home</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16">
        <div className="w-full max-w-md mx-auto py-12">
          <Card className="border border-border shadow-sm">
            <CardHeader className="text-center pb-6">
              <CardTitle className="font-bold text-2xl sm:text-3xl text-foreground">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2 text-base">
                Sign in to your MediCheck account
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </div>

                <Button
                  disabled={isLoading}
                  type="submit"
                  variant="default"
                  size="lg"
                  className="w-full"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-6 space-y-4">
                <div className="border-t border-border pt-4">
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/auth/team-member-login" className="flex items-center justify-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Team Member Login</span>
                    </Link>
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  {"Don't have an account? "}
                  <Link href="/auth/register" className="text-primary hover:underline font-medium">
                    Register here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
