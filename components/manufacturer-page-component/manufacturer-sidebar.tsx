"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading"
import {
  Shield,
  LayoutDashboard,
  Package,
  Factory,
  QrCode,
  Settings,
  LogOut,
  Truck,
  Users,
  BarChart3,
  PillBottle
} from "lucide-react"
import Link from "next/link"
import { useClerk } from "@clerk/nextjs"
import { authRoutes } from "@/utils";
import { ManufacturerTab } from "@/utils"
import { useState, useEffect } from "react"

interface ManufacturerSidebarProps {
  activeTab: string
  setActiveTab: (tab: ManufacturerTab) => void
  orgId: string
  orgName?: string
  isMobile?: boolean
  onTabSelect?: () => void
}

export function ManufacturerSidebar({ 
  activeTab, 
  setActiveTab, 
  orgId, 
  orgName: propOrgName, 
  isMobile = false, 
  onTabSelect 
}: ManufacturerSidebarProps) {
  const { signOut } = useClerk()
  const [orgName, setOrgName] = useState(propOrgName || "Loading...")
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Fetch organization info only if not provided via props
  useEffect(() => {
    if (propOrgName) {
      setOrgName(propOrgName)
      return
    }

    const fetchOrgInfo = async () => {
      if (!orgId) return
      
      try {
        const response = await fetch(`/api/web/organizations/info?orgId=${orgId}`)
        if (response.ok) {
          const data = await response.json()
          setOrgName(data.companyName)
        }
      } catch (error) {
        console.error('Error fetching organization info:', error)
        setOrgName("Organization")
      }
    }

    fetchOrgInfo()
  }, [orgId, propOrgName])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut({ redirectUrl: authRoutes.login })
    } catch (error) {
      console.error('Error signing out:', error)
      setIsSigningOut(false)
    }
  }

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "units", label: "Unit Management", icon: PillBottle },
    { id: "batches", label: "Batch Management", icon: Package },
    { id: "products", label: "Product Catalog", icon: Factory },
    { id: "transfers", label: "Batch Transfers", icon: Truck },
    { id: "qr-generator", label: "QR Generator", icon: QrCode },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "team", label: "Team Management", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },

  ]

  const handleTabSelect = (tab: ManufacturerTab) => {
    setActiveTab(tab)
    if (isMobile && onTabSelect) {
      onTabSelect()
    }
  }

  // For closing sidebar when clicking overlay (mobile)
  const [showSidebar, setShowSidebar] = useState(true);

  const handleOverlayClick = () => {
    setShowSidebar(false);
    if (onTabSelect) onTabSelect();
  };

  useEffect(() => {
    if (!isMobile) setShowSidebar(true);
    else setShowSidebar(true); // Always open when rendered, but can be closed
  }, [isMobile]);

  return (
    <>
      {/* Full-page loading overlay when signing out */}
      {isSigningOut && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-8 rounded-lg shadow-lg border">
            <LoadingSpinner size="large" text="Signing out..." />
          </div>
        </div>
      )}
      
      {/* Mobile Overlay */}
      {isMobile && showSidebar && (
        <div
          className="fixed inset-0 z-40 lg:hidden transition-all duration-300 pointer-events-auto"
          style={{
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            background: "rgba(0,0,0,0.15)",
          }}
          onClick={handleOverlayClick}
        />
      )}

      {/* Sidebar */}
      {(!isMobile || showSidebar) && (
        <div
          className={`${ isMobile ? 'w-4/5 max-w-xs fixed top-0 left-0 z-50 bg-sidebar flex flex-col': 'w-64 bg-sidebar'} flex flex-col h-full border-r border-sidebar-border shadow-lg`}
          style={isMobile ? { top: 0, left: 0 } : {}}
        >

          {/* Sidebar Header */}
          <div className="px-5 py-4 border-b border-sidebar-border flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <Shield className="h-6 w-6 text-sidebar-primary flex-shrink-0" />
              <span className="font-bold text-base text-sidebar-foreground tracking-tight">MediCheck</span>
            </Link>
            {isMobile && (
              <button
                aria-label="Close sidebar"
                className="p-1.5 rounded-md cursor-pointer hover:bg-sidebar-accent/50 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
                onClick={() => { setShowSidebar(false); if (onTabSelect) onTabSelect(); }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M5 5l8 8M5 13L13 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg>
              </button>
            )}
          </div>

          <section className="flex flex-col h-full overflow-hidden">
            {/* Organization Card */}
            <div className="px-5 py-4 border-b border-sidebar-border">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-sidebar-primary flex-shrink-0" />
                <span className="text-xs font-medium text-sidebar-primary uppercase tracking-widest">Manufacturer</span>
              </div>
              <span className="block font-semibold text-sm text-sidebar-foreground truncate mt-1">{orgName}</span>
              <span className="text-xs text-sidebar-foreground/50">Manufacturing Organization</span>
            </div>
            {/* Navigation */}
            <nav className="px-3 py-3 flex-1 overflow-y-auto space-y-0.5">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={`w-full justify-start cursor-pointer h-9 px-3 text-sm font-medium transition-colors duration-150 ${isActive ? 'bg-sidebar-accent text-sidebar-foreground border-l-2 border-sidebar-primary rounded-l-none pl-[10px]' : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'} ${isMobile ? 'h-11 text-base' : ''}`}
                    onClick={() => handleTabSelect(item.id as ManufacturerTab)}
                  >
                    <Icon className={`flex-shrink-0 ${isMobile ? 'h-5 w-5 mr-3' : 'h-4 w-4 mr-2.5'} ${isActive ? 'text-sidebar-primary' : ''}`} />
                    <span>{item.label}</span>
                  </Button>
                )
              })}
            </nav>
            {/* Sign Out Button */}
            <div className="px-3 py-3 border-t border-sidebar-border">
              <Button
                variant="ghost"
                className="w-full justify-start h-9 px-3 text-sm text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                <LogOut className="h-4 w-4 mr-2.5 flex-shrink-0" />
                <span>Sign Out</span>
              </Button>
            </div>
          </section>

        </div>
      )}
    </>
  )
}
