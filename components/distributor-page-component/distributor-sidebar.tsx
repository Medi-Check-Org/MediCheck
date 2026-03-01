"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { LoadingSpinner } from "@/components/ui/loading"
import {
  Shield,
  LayoutDashboard,
  Package,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Settings,
  LogOut,
  Building2,
  Truck,
  Camera,
  Users
} from "lucide-react"
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { authRoutes } from "@/utils";
import { ManufacturerTab } from "@/utils";
import { useState, useEffect } from "react"

interface DistributorSidebarProps {
  activeTab: string
  setActiveTab: React.Dispatch<React.SetStateAction<ManufacturerTab>>
  orgId: string
  isMobile?: boolean
  onTabSelect?: () => void
}

export function DistributorSidebar({ activeTab, setActiveTab, orgId, isMobile, onTabSelect }: DistributorSidebarProps) {

  const { signOut } = useClerk();
  const [orgName, setOrgName] = useState("Loading...")
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Fetch organization info
  useEffect(() => {
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
        setOrgName("Distributor")
      }
    }

    fetchOrgInfo()
  }, [orgId])

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
    { id: "inventory", label: "Warehouse Stock", icon: Package },
    { id: "team", label: "Team Members", icon: Users },
    { id: "analytics", label: "Distribution Analytics", icon: TrendingUp },
    { id: "qr-scanner", label: "QR Scanner", icon: Camera },
    { id: "transfers", label: "Dispatch & Shipments", icon: Truck },
    { id: "alerts", label: "Stock Alerts", icon: AlertTriangle },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  const handleTabClick = (tab: ManufacturerTab) => {
    setActiveTab(tab as ManufacturerTab);
    if (isMobile && onTabSelect) {
      onTabSelect();
    }
  };

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
      
      {/* Sidebar */}
      <div className={`${isMobile ? 'w-full h-full flex flex-col' : 'w-64 h-screen'} bg-sidebar border-r border-sidebar-border shadow-lg flex flex-col`}>
        {/* Sidebar Header */}
        <div className="px-5 py-4 border-b border-sidebar-border flex-shrink-0 flex items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <Shield className="h-6 w-6 text-sidebar-primary flex-shrink-0" />
            <span className="font-bold text-base text-sidebar-foreground tracking-tight">MediCheck</span>
          </Link>
        </div>
        {/* Organization Card */}
        <div className="px-5 py-4 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-role-distributor flex-shrink-0" />
            <span className="text-xs font-medium text-role-distributor uppercase tracking-widest">Distributor</span>
          </div>
          <span className="block font-semibold text-sm text-sidebar-foreground truncate mt-1">{orgName}</span>
          <span className="text-xs text-sidebar-foreground/50">Active Distribution Hub</span>
        </div>
        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start cursor-pointer h-9 px-3 text-sm font-medium transition-colors duration-150 ${isActive ? 'bg-sidebar-accent text-sidebar-foreground border-l-2 border-role-distributor rounded-l-none pl-[10px]' : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'} ${isMobile ? 'h-11 text-base' : ''}`}
                onClick={() => handleTabClick(item.id as ManufacturerTab)}
              >
                <Icon className={`flex-shrink-0 ${isMobile ? 'h-5 w-5 mr-3' : 'h-4 w-4 mr-2.5'} ${isActive ? 'text-role-distributor' : ''}`} />
                <span>{item.label}</span>
              </Button>
            )
          })}
        </nav>
        {/* Sign Out */}
        <div className="px-3 py-3 border-t border-sidebar-border flex-shrink-0">
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
      </div>
    </>
  )
}
