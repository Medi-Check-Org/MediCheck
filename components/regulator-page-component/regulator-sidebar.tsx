"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading"
import {
  Shield,
  LayoutDashboard,
  Eye,
  FileText,
  CheckCircle,
  AlertTriangle,
  Users,
  Settings,
  LogOut,
  Building2,
  X,
} from "lucide-react"
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { authRoutes } from "@/utils";
import { ManufacturerTab } from "@/utils";
import { useEffect, useState } from "react";

interface RegulatorSidebarProps {
  activeTab: ManufacturerTab
  setActiveTab: (tab: ManufacturerTab) => void
  isOpen?: boolean
  onClose?: () => void
}

export function RegulatorSidebar({ activeTab, setActiveTab, isOpen = false, onClose }: RegulatorSidebarProps) {

  const { signOut } = useClerk();
  
  // TODO: Replace with actual organization name from context, props, or API
  const [orgName, setOrgName] = useState<string>("Regulator Org");
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    async function fetchOrgName() {
      try {
        const res = await fetch("/api/web/organization"); // Update endpoint as needed
        const data = await res.json();
        setOrgName(data.name || "Regulator Org");
      } catch {
        setOrgName("Regulator Org");
      }
    }
    fetchOrgName();
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({ redirectUrl: authRoutes.login });
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
    }
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    // { id: "investigations", label: "Investigations", icon: Eye },
    { id: "compliance", label: "Compliance", icon: CheckCircle },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "alerts", label: "Alerts", icon: AlertTriangle },
    { id: "entities", label: "Registered Entities", icon: Users },
    { id: "team", label: "Team Members", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "analytics", label: "Analytics", icon: Eye },
  ]

  const handleTabClick = (tab: ManufacturerTab) => {
    setActiveTab(tab);
    // Close sidebar on mobile after selection
    if (onClose) {
      onClose();
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
      
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 backdrop-blur-md z-40 lg:hidden transition-all duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile Close Button */}
        <div className="lg:hidden absolute top-4 right-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Sidebar Header */}
        <div className="px-5 py-4 border-b border-sidebar-border flex-shrink-0 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Shield className="h-6 w-6 text-sidebar-primary flex-shrink-0" />
            <span className="font-bold text-base text-sidebar-foreground tracking-tight">MediCheck</span>
          </Link>
          <div className="lg:hidden">
            <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0 text-sidebar-foreground/60 hover:text-sidebar-foreground">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Organization Card */}
        <div className="px-5 py-4 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-role-regulator flex-shrink-0" />
            <span className="text-xs font-medium text-role-regulator uppercase tracking-widest">Regulator</span>
          </div>
          <span className="block font-semibold text-sm text-sidebar-foreground truncate mt-1">{orgName}</span>
          <span className="text-xs text-sidebar-foreground/50">Regulatory Authority</span>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id as unknown as string
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start cursor-pointer h-9 px-3 text-sm font-medium transition-colors duration-150 ${isActive ? 'bg-sidebar-accent text-sidebar-foreground border-l-2 border-role-regulator rounded-l-none pl-[10px]' : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'}`}
                onClick={() => handleTabClick(item.id as ManufacturerTab)}
              >
                <Icon className={`h-4 w-4 mr-2.5 flex-shrink-0 ${isActive ? 'text-role-regulator' : ''}`} />
                <span>{item.label}</span>
              </Button>
            )
          })}
        </nav>

        {/* Sign Out Button */}
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
