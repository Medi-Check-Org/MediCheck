"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { publicRoutes, authRoutes } from "@/utils";
import { useUser } from "@clerk/nextjs";
import { getRedirectPath } from "@/utils";
import {
  Shield,
  Scan,
  Building2,
  Users,
  ChevronRight,
  QrCode,
  CheckCircle,
  Zap,
  Lock,
  TrendingUp,
  LogOut,
  Factory,
  Truck,
  Pill,
} from "lucide-react"
import Link from "next/link"
import { useClerk } from "@clerk/nextjs"
import { useEffect } from "react"

export default function HomePage() {

  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const role = user?.publicMetadata.role as string | undefined;
  const organizationType = user?.publicMetadata.organizationType as string | undefined;

  useEffect(() => {
    const handleScroll = () => {
      const elements = document.querySelectorAll('.scroll-animate');
      elements.forEach((element) => {
        const elementTop = element.getBoundingClientRect().top;
        if (elementTop < window.innerHeight - 100) {
          element.classList.add('animate');
        }
      });
    };
    setTimeout(handleScroll, 100);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">

      {/* Navigation */}
      <nav className="border-b border-border bg-card fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-1.5 rounded-lg">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-bold text-lg text-foreground">MediCheck</span>
                <span className="text-xs text-muted-foreground font-mono ml-2 hidden sm:inline">Blockchain Secured</span>
              </div>
            </div>

            <div className="hidden lg:flex items-center space-x-8">
              <Link href="#verify" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                Verify Drug
              </Link>
              <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                Features
              </Link>
              <Link href="#contact" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                Contact
              </Link>
            </div>

            {isSignedIn ? (
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ redirectUrl: authRoutes.login })}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
                <Link href={getRedirectPath(role, organizationType)}>
                  <Button variant="default" size="sm">
                    Dashboard
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Link href={authRoutes.login}>
                  <Button variant="outline" size="sm">Login</Button>
                </Link>
                <Link href={authRoutes.register}>
                  <Button variant="default" size="sm">
                    <span className="hidden sm:inline">Get Started</span>
                    <span className="sm:hidden">Start</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-6">
              AI + Blockchain Verification
            </Badge>
            <h1 className="font-bold text-4xl sm:text-5xl lg:text-6xl text-foreground mb-6 leading-tight tracking-tight text-balance">
              Verify Any Medicine
              <span className="text-accent block mt-1">Instantly &amp; Securely</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl">
              Protect yourself and your loved ones with enterprise-grade blockchain medication verification.
              Scan, verify, and trust with regulatory-ready security.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={publicRoutes.scan}>
                <Button variant="default" size="lg" className="w-full sm:w-auto">
                  <Scan className="h-4 w-4 mr-2" />
                  Start Scanning
                </Button>
              </Link>
              <Link href={authRoutes.register}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Register Organization
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-16 border-t border-border">
            <div>
              <div className="flex items-center gap-2 text-accent mb-1">
                <CheckCircle className="h-4 w-4" />
                <span className="font-bold text-2xl">99.9%</span>
              </div>
              <span className="text-sm text-muted-foreground">Accuracy Rate</span>
            </div>
            <div>
              <div className="flex items-center gap-2 text-accent mb-1">
                <Lock className="h-4 w-4" />
                <span className="font-bold text-2xl">256-bit</span>
              </div>
              <span className="text-sm text-muted-foreground">Encryption</span>
            </div>
            <div>
              <div className="flex items-center gap-2 text-accent mb-1">
                <Zap className="h-4 w-4" />
                <span className="font-bold text-2xl">{'<'}2s</span>
              </div>
              <span className="text-sm text-muted-foreground">Verification Time</span>
            </div>
            <div>
              <div className="flex items-center gap-2 text-accent mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="font-bold text-2xl">1M+</span>
              </div>
              <span className="text-sm text-muted-foreground">Verified Daily</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="font-bold text-3xl sm:text-4xl text-foreground mb-4 text-balance">
              Complete Medication Traceability Ecosystem
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl">
              From manufacturer to patient, every step is verified and secured on the blockchain.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Factory className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Manufacturers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Create and track medication batches with complete transparency and real-time analytics.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                  <Truck className="h-5 w-5 text-accent" />
                </div>
                <CardTitle className="text-lg">Distributors</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Manage shipments and transfers with transparency and automated compliance reporting.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Pharmacies</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Verify authenticity and manage inventory with blockchain data and automated alerts.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <CardTitle className="text-lg">Patients</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Verify medication authenticity with a simple scan and access complete medication history.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-2">1M+</div>
              <div className="text-sm text-primary-foreground/70">Medications Verified Daily</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-2">500+</div>
              <div className="text-sm text-primary-foreground/70">Enterprise Partners</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-2">99.9%</div>
              <div className="text-sm text-primary-foreground/70">Accuracy Guarantee</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-2">24/7</div>
              <div className="text-sm text-primary-foreground/70">Global Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="verify" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <div className="h-14 w-14 bg-primary rounded-xl flex items-center justify-center mx-auto mb-6">
            <QrCode className="h-7 w-7 text-primary-foreground" />
          </div>
          <h2 className="font-bold text-3xl sm:text-4xl text-foreground mb-4 text-balance">
            Ready to Verify Your Medicine?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
            Scan any QR code on your medication packaging to instantly verify authenticity and access complete supply chain intelligence.
          </p>
          <Link href={publicRoutes.scan}>
            <Button variant="default" size="lg">
              <Scan className="h-4 w-4 mr-2" />
              Start Scanning Now
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 px-4 sm:px-6 lg:px-8" id="contact">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-8">
            <div className="flex flex-col items-start">
              <div className="flex items-center space-x-3 mb-3">
                <div className="bg-primary p-1.5 rounded-lg">
                  <Shield className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl text-foreground">MediCheck</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                Enterprise-Grade Consensus Security
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 text-sm">
              <div className="flex items-center gap-4">
                <Link
                  href="https://x.com/medi_check2025"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Follow us on X (Twitter)"
                >
                  <svg className="h-5 w-5" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <path fill="currentColor" d="M31.993,6.077C30.816,6.6,29.552,6.953,28.223,7.11c1.355-0.812,2.396-2.098,2.887-3.63c-1.269,0.751-2.673,1.299-4.168,1.592C25.744,3.797,24.038,3,22.149,3c-3.625,0-6.562,2.938-6.562,6.563c0,0.514,0.057,1.016,0.169,1.496C10.301,10.785,5.465,8.172,2.227,4.201c-0.564,0.97-0.888,2.097-0.888,3.3c0,2.278,1.159,4.286,2.919,5.464c-1.075-0.035-2.087-0.329-2.972-0.821c-0.001,0.027-0.001,0.056-0.001,0.082c0,3.181,2.262,5.834,5.265,6.437c-0.55,0.149-1.13,0.23-1.729,0.23c-0.424,0-0.834-0.041-1.234-0.117c0.834,2.606,3.259,4.504,6.13,4.558c-2.245,1.76-5.075,2.811-8.15,2.811c-0.53,0-1.053-0.031-1.566-0.092C2.905,27.913,6.355,29,10.062,29c12.072,0,18.675-10.001,18.675-18.675c0-0.284-0.008-0.568-0.02-0.85C30,8.55,31.112,7.395,31.993,6.077z"/>
                  </svg>
                </Link>
                <Link
                  href="https://www.linkedin.com/company/medicheck25"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Follow us on LinkedIn"
                >
                  <svg className="h-5 w-5" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                    <path fill="currentColor" d="M512,64c0,-35.323 -28.677,-64 -64,-64l-384,0c-35.323,0 -64,28.677 -64,64l0,384c0,35.323 28.677,64 64,64l384,0c35.323,0 64,-28.677 64,-64l0,-384Z"/>
                    <rect fill="#fff" height="257.962" width="85.76" x="61.053" y="178.667"/>
                    <path fill="#fff" d="M104.512,54.28c-29.341,0-48.512,19.29-48.512,44.573c0,24.752,18.588,44.574,47.377,44.574l0.554,0c29.903,0,48.516-19.822,48.516-44.574c-0.555-25.283-18.611-44.573-47.935-44.573Z"/>
                    <path fill="#fff" d="M357.278,172.601c-45.49,0-65.866,25.017-77.276,42.589l0,-36.523l-85.738,0c1.137,24.197,0,257.961,0,257.961l85.737,0l0,-144.064c0,-7.711,0.554,-15.42,2.827,-20.931c6.188,-15.4,20.305,-31.352,43.993,-31.352c31.012,0,43.436,23.664,43.436,58.327l0,138.02l85.741,0l0,-147.93c0,-79.237-42.305,-116.097-98.72,-116.097Z"/>
                  </svg>
                </Link>
              </div>
              <Link href="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Terms of Service
              </Link>
              <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Contact
              </Link>
            </div>
          </div>

          <div className="pt-8 border-t border-border">
            <p className="text-muted-foreground text-sm">
              &copy; 2025 MediCheck. All rights reserved. Securing medication authenticity with enterprise-grade consensus security technology.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
