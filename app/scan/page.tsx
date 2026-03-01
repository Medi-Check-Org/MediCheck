"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { QRScanner } from "@/components/qr-scanner";
import { publicRoutes, authRoutes } from "@/utils";
import { useUser } from "@clerk/nextjs";
import { getRedirectPath } from "@/utils";
import {
  Shield,
  ArrowLeft,
  QrCode,
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
      window.location.href = scannedQRcodeResult;
    }
  }, [scannedQRcodeResult])

  // Handle QR scanner errors
  const handleQRError = (error: string) => {
    console.error('QR Scanner error:', error)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Unified Navigation */}
      <nav className="border-b border-border bg-card/95 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link href={publicRoutes.home} className="flex items-center gap-2.5">
              <div className="bg-primary p-1.5 rounded-md">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-base text-foreground tracking-tight">MediCheck</span>
            </Link>
            {isSignedIn ? (
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Link href={getRedirectPath(role, organizationType)}>
                  <Button variant="default" size="sm">Dashboard</Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Link href={authRoutes.login}>
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href={authRoutes.register}>
                  <Button variant="default" size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="mb-6">
          <Link
            href={publicRoutes.home}
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm mb-5"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Home
          </Link>
          <h1 className="font-bold text-2xl sm:text-3xl text-foreground mb-1.5 tracking-tight">
            Verify Your Medicine
          </h1>
          <p className="text-muted-foreground text-sm">
            Scan the QR code on your medication packaging to verify authenticity.
          </p>
        </div>

        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <QrCode className="h-4 w-4 text-accent" />
              Medication Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QRScanner
              onScan={handleQRScan}
              onError={handleQRError}
              width={320}
              height={240}
              facingMode="environment"
              className="mx-auto"
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
