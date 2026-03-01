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

  // Mobile header for extra polish
  const MobileHeader = () => (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">MediCheck</span>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MobileHeader />

      {/* Navigation */}
      <nav className="border-b border-border bg-card sticky top-0 z-40 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href={publicRoutes.home} className="flex items-center space-x-3">
              <div className="bg-primary p-1.5 rounded-lg">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-bold text-lg text-foreground">MediCheck</span>
                <span className="text-xs text-muted-foreground font-mono ml-2 hidden sm:inline">Blockchain Secured</span>
              </div>
            </Link>
            {isSignedIn ? (
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Link href={getRedirectPath(role, organizationType)}>
                  <Button variant="default" size="sm">
                    Dashboard
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Link href={authRoutes.register}>
                  <Button variant="outline" size="sm">
                    Create Account
                  </Button>
                </Link>
                <Link href={authRoutes.login}>
                  <Button variant="default" size="sm">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-4xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Mobile: Place title under header */}
        <div className="block lg:hidden pt-[68px] pb-4 px-1">
          <h1 className="font-bold text-2xl text-foreground mb-1 text-center">
            Verify Your Medicine
          </h1>
          <p className="text-muted-foreground text-sm text-center">
            Scan the QR code or NFC tag on your medication packaging
          </p>
        </div>
        {/* Desktop: Keep title as before */}
        <div className="hidden lg:block text-center mb-6 sm:mb-8">
          <Link
            href={publicRoutes.home}
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="font-bold text-3xl text-foreground mb-2">
            Verify Your Medicine
          </h1>
          <p className="text-muted-foreground text-base">
            Scan the QR code on your medication packaging
          </p>
        </div>
        <Card className="max-w-2xl mx-auto border border-border shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center font-bold">
              <QrCode className="h-6 w-6 mr-2 text-primary" />
              <span className="text-foreground">Medicine Scanner</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <QRScanner
                onScan={handleQRScan}
                onError={handleQRError}
                width={320}
                height={240}
                facingMode="environment"
                className="mx-auto"
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
