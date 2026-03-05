"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { publicRoutes, authRoutes } from "@/utils"
import { useUser } from "@clerk/nextjs"
import { getRedirectPath } from "@/utils"
import {
  Shield,
  Scan,
  Building2,
  Users,
  QrCode,
  CheckCircle,
  Zap,
  Lock,
  TrendingUp,
  LogOut,
  Factory,
  Truck,
  ArrowRight,
  Twitter,
  Linkedin,
  Facebook,
  Youtube,
  Mail
} from "lucide-react"
import Link from "next/link"
import { useClerk } from "@clerk/nextjs"

export default function HomePage() {
  const { user, isSignedIn } = useUser()
  const { signOut } = useClerk()
  const role = user?.publicMetadata.role as string | undefined
  const organizationType = user?.publicMetadata.organizationType as string | undefined

  return (
    <div className="min-h-screen bg-background">

      {/* Navigation - Increased height and internal padding */}
      <nav className="border-b border-border bg-card/95 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-12">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-lg">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="font-bold text-lg text-foreground tracking-tight">MediCheck</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono hidden sm:inline border border-border rounded-full px-2 py-0.5">
                  Blockchain Secured
                </span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-10">
              <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Features</Link>
              <Link href="#verify" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Verify Drug</Link>
              <Link href="#contact" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Contact</Link>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              {isSignedIn ? (
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" className="hidden sm:flex" onClick={() => signOut({ redirectUrl: authRoutes.login })}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                  <Link href={getRedirectPath(role, organizationType)}>
                    <Button variant="default" size="default" className="px-6 shadow-lg shadow-primary/20">Dashboard</Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href={authRoutes.login}>
                    <Button variant="ghost" size="sm" className="font-medium">Sign In</Button>
                  </Link>
                  <Link href={authRoutes.register}>
                    <Button variant="default" size="default" className="px-6">Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Centered layout with better container constraints */}
      <section className="pt-40 pb-24 px-6 sm:px-10 lg:px-12 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-6 px-4 py-1 text-xs font-mono uppercase tracking-tighter">
              AI + Blockchain Verification
            </Badge>
            <h1 className="font-bold text-4xl sm:text-6xl lg:text-7xl text-foreground mb-6 leading-[1.05] tracking-tight">
              Verify Any Medicine.<br />
              <span className="text-primary italic">Instantly &amp; Securely.</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl">
              Enterprise-grade blockchain medication verification for manufacturers, distributors, hospitals, and regulators across Africa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href={publicRoutes.scan}>
                <Button variant="default" size="lg" className="h-14 px-8 text-base shadow-xl shadow-primary/20">
                  <Scan className="h-5 w-5 mr-3" />
                  Start Verifying
                </Button>
              </Link>
              <Link href={authRoutes.register}>
                <Button variant="outline" size="lg" className="h-14 px-8 text-base bg-background/50">
                  Register Organization
                  <ArrowRight className="h-5 w-5 ml-3" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24">
            {[
              { icon: Lock, value: "256-bit", label: "Encryption Standard" },
              { icon: Zap, value: "<2s", label: "Verification Time" },
              { icon: TrendingUp, value: "1M+", label: "Verified Daily" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="bg-card/50 border border-border rounded-2xl p-8 backdrop-blur-sm">
                <div className="text-3xl font-bold text-foreground mb-2">{value}</div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium tracking-wide uppercase">{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 sm:px-10 lg:px-12 border-b border-border bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="mb-20">
            <span className="text-xs font-bold text-primary uppercase tracking-[0.2em] block mb-4">Platform Overview</span>
            <h2 className="font-bold text-3xl sm:text-5xl text-foreground mb-6 tracking-tight">
              Complete Medication <br />Traceability Ecosystem
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
              From manufacturer to patient, every step is verified and immutably recorded on the blockchain, ensuring patient safety and regulatory compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Factory, title: "Manufacturers", desc: "Create and track medication batches with complete transparency and real-time analytics." },
              { icon: Truck, title: "Distributors", desc: "Manage shipments and transfers with automated compliance reporting and chain-of-custody tracking." },
              { icon: Building2, title: "Pharmacies", desc: "Verify authenticity and manage inventory with blockchain data and expiry alerts." },
              { icon: Users, title: "Patients", desc: "Verify medication authenticity with a simple QR scan and access complete supply chain history." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group border border-border rounded-2xl p-8 bg-card hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/5">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-3">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-24 px-6 sm:px-10 lg:px-12 bg-primary">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
            {[
              { value: "1M+", label: "Daily Verifications" },
              { value: "500+", label: "Enterprise Partners" },
              { value: "99.9%", label: "Accuracy Guarantee" },
              { value: "24/7", label: "Global Uptime" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-4xl sm:text-5xl font-bold text-primary-foreground mb-3 tracking-tighter">{value}</div>
                <div className="text-sm font-medium text-primary-foreground/80 uppercase tracking-widest">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="verify" className="py-32 px-6 sm:px-10 lg:px-12 border-b border-border bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="border border-border rounded-[2.5rem] p-12 sm:p-24 bg-card text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
            <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <QrCode className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-bold text-3xl sm:text-5xl text-foreground mb-6 tracking-tight">
              Ready to Verify Your Medicine?
            </h2>
            <p className="text-muted-foreground text-lg mb-10 leading-relaxed max-w-xl mx-auto">
              Scan any QR code on medication packaging to instantly verify authenticity and access complete supply chain intelligence.
            </p>
            <Link href={publicRoutes.scan}>
              <Button variant="default" size="lg" className="h-16 px-10 text-lg rounded-xl shadow-xl shadow-primary/20">
                <Scan className="h-5 w-5 mr-3" />
                Start Scanning Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Improved Footer */}
      <footer className="bg-card border-t border-border pt-20 pb-10 px-6 sm:px-10 lg:px-12" id="contact">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 lg:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary p-2 rounded-lg">
                  <Shield className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl text-foreground tracking-tight">MediCheck</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Securing the global pharmaceutical supply chain with enterprise-grade blockchain and AI technology.
              </p>
              <div className="flex gap-4">
                <Link href="#" className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all"><Twitter className="h-4 w-4" /></Link>
                <Link href="#" className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all"><Linkedin className="h-4 w-4" /></Link>
                <Link href="#" className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all"><Facebook className="h-4 w-4" /></Link>
                <Link href="#" className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all"><Youtube className="h-4 w-4" /></Link>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-sm uppercase tracking-widest mb-6">Resources</h4>
              <ul className="space-y-4">
                <li><Link href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">About Us</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">Technology</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">API Documentation</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">Support Center</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm uppercase tracking-widest mb-6">Legal</h4>
              <ul className="space-y-4">
                <li><Link href="/privacy-policy" className="text-muted-foreground hover:text-primary text-sm transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="text-muted-foreground hover:text-primary text-sm transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">Cookie Policy</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">Compliance</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm uppercase tracking-widest mb-6">Contact</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary" />
                  contact@medicheck.com
                </li>
                <li className="text-sm text-muted-foreground leading-relaxed">
                  Available for enterprise consultations 24/7.
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-xs font-medium">
              &copy; 2026 MediCheck. All rights reserved.
            </p>
            <div className="flex gap-6">
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}