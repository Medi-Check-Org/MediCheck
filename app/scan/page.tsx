"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { QRScanner } from "@/components/qr-scanner";
import { publicRoutes, authRoutes } from "@/utils";
import { useUser } from "@clerk/nextjs";
import { getRedirectPath } from "@/utils";
import {
  Shield,
  ArrowLeft,
  CheckCircle2,
  Info,
  Smartphone,
  AlertCircle
} from "lucide-react"
import Link from "next/link"

export default function ScanPage() {
  const { user, isSignedIn } = useUser();
  const role = user?.publicMetadata.role as string | undefined;
  const organizationType = user?.publicMetadata.organizationType as string | undefined;

  const [scannedQRcodeResult, setScannedQRcodeResult] = useState("");

  const handleQRScan = (qrData: string) => {
    setScannedQRcodeResult(qrData)
  }

  useEffect(() => {
    if (scannedQRcodeResult) {
      // Logic for smooth transition or validation could go here
      window.location.href = scannedQRcodeResult;
    }
  }, [scannedQRcodeResult])

  const handleQRError = (error: string) => {
    console.error('QR Scanner error:', error)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background flex flex-col">

      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-md fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href={publicRoutes.home} className="flex items-center gap-2.5 group">
              <div className="bg-primary p-2 rounded-xl transition-transform group-hover:scale-105">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg tracking-tight">MediCheck</span>
            </Link>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              {isSignedIn ? (
                <Link href={getRedirectPath(role, organizationType)}>
                  <Button variant="default" size="sm" className="rounded-full px-5">Dashboard</Button>
                </Link>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link href={authRoutes.login}>
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </Link>
                  <Link href={authRoutes.register}>
                    <Button size="sm" className="rounded-full">Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Breadcrumb/Back */}
        <Link
          href={publicRoutes.home}
          className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors text-sm mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Back to Overview
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* Left Column: Instructions & Content */}
          <div className="lg:col-span-5 space-y-8 order-2">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                <CheckCircle2 className="h-3 w-3" />
                Secured by AI Verification
              </div>
              <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-4">
                Verify Your <span className="text-primary">Medication</span>
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Ensure your safety by verifying the authenticity of your medicine in real-time. Our global database checks for tampering and counterfeit signatures.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                How to scan
              </h3>

              <ul className="space-y-4">
                {[
                  { icon: Smartphone, text: "Position the QR code inside the frame" },
                  { icon: Shield, text: "Wait for the auto-detection to complete" },
                  { icon: CheckCircle2, text: "Review the authenticity report instantly" }
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="mt-1 bg-muted p-2 rounded-lg">
                      <item.icon className="h-4 w-4 text-foreground/70" />
                    </div>
                    <p className="text-sm text-muted-foreground">{item.text}</p>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Right Column: The Scanner Area */}
          <div className="lg:col-span-7 order-1">
            <div className="relative group">
              {/* Decorative Background Elements */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-[2rem] blur opacity-15 group-hover:opacity-25 transition duration-1000"></div>

              <Card className="relative border-none shadow-2xl rounded-[2rem] overflow-hidden bg-card/50 backdrop-blur-xl">
                <CardContent className="p-0">
                  <div className="p-6 border-b border-border/50 flex justify-between items-center bg-muted/30">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Live Scanner Active</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Powered by MediCheck AI</span>
                  </div>

                  <div className="p-8 flex justify-center bg-black/5 dark:bg-white/5">
                    <div className="relative">
                      <QRScanner
                        onScan={handleQRScan}
                        onError={handleQRError}
                        width={480}
                        height={360}
                        facingMode="environment"
                        className="rounded-2xl shadow-inner border-4 border-background"
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-muted/30 text-center">
                    <p className="text-xs text-muted-foreground italic">
                      Scanning is encrypted and private. No personal data is stored during this process.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}