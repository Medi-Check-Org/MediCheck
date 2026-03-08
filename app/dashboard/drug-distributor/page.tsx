"use client"
import { useState, useEffect } from "react";
// components import 
import { DistributorSidebar } from "@/components/distributor-page-component/distributor-sidebar";
import DistributorSettings from "@/components/distributor-page-component/DistributorSettings";
import DistributorAlerts from "@/components/distributor-page-component/DistributorAlerts";
import DistributorInventory from "@/components/distributor-page-component/DistributorInventory";
import DistributorMain from "@/components/distributor-page-component/DistributorMain";
import Transfers from "@/components/Transfers";
import QRScanner from "@/components/qr-scanner";
import { TeamMemberManagement } from "@/components/team-member-management";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UniversalLoader } from "@/components/ui/universal-loader";
import { SectionErrorBoundary } from "@/components/ui/error-boundary";
import { Menu, Shield} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "react-toastify";
import { ManufacturerTab } from "@/utils";
import { MedicationBatchInfoProps } from "@/utils";

export default function DrugDistributorDashboard() {
  const [activeTab, setActiveTab] = useState<ManufacturerTab>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [orgId, setOrgId] = useState("");
  const [batches, setBatches] = useState<MedicationBatchInfoProps[]>([]);
  const [orgLoading, setOrgLoading] = useState(true);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [scannedQRcodeResult, setScannedQRcodeResult] = useState("");

  const handleQRScan = (qrData: string) => {
    setScannedQRcodeResult(qrData)
  }

  useEffect(() => {
    if (scannedQRcodeResult) {
      window.location.href = scannedQRcodeResult;
    }
  }, [scannedQRcodeResult])

  useEffect(() => {
    const loadOrg = async () => {
      setOrgLoading(true);
      try {
        const res = await fetch("/api/web/organizations/me");
        const data = await res.json();
        setOrgId(data.organizationId);
      }
      catch (err) {
        toast.error(`Failed to fetch org: ${err instanceof Error ? err.message : String(err)}`);
      }
      finally {
        setOrgLoading(false);
      }
    };
    loadOrg();
  }, []);

  const loadBatches = async () => {
    setBatchesLoading(true);
    try {
      const res = await fetch(`/api/web/batches?organizationId=${orgId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch batches");
      }

      setBatches(data.batches || []);
      toast.success("Fetched batches");
    }
    catch (err) {
      toast.error(`${err instanceof Error ? err.message : String(err)}`);
    }
    finally {
      setBatchesLoading(false);
    }
  };

  useEffect(() => {
    if (!orgId) return;
    loadBatches();
  }, [orgId]);

  if (orgLoading || batchesLoading || !orgId) {
    return <UniversalLoader text="Loading dashboard..." />
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-12">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex items-center justify-center h-8 w-8 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-primary rounded flex items-center justify-center">
              <Shield className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm text-foreground tracking-tight">MediCheck</span>
          </div>
          <ThemeToggle />
        </div>
      </div>
      <div className="hidden lg:flex lg:flex-shrink-0">
        <DistributorSidebar activeTab={activeTab} setActiveTab={setActiveTab} orgId={orgId} />
      </div>
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-foreground/20" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="fixed left-0 top-0 bottom-0 w-60 bg-sidebar shadow-lg border-r border-sidebar-border" onClick={(e) => e.stopPropagation()}>
            <DistributorSidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              orgId={orgId}
              isMobile={true}
              onTabSelect={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}
      <main className="flex-1 overflow-y-auto">
        <div className="p-5 sm:p-6 lg:p-8 mt-12 lg:mt-0">
          {activeTab === "dashboard" && (
            <SectionErrorBoundary context="the distributor dashboard">
              <DistributorMain setActiveTab={setActiveTab} orgId={orgId} />
            </SectionErrorBoundary>
          )}
          {activeTab === "inventory" && (
            <SectionErrorBoundary context="inventory">
              <DistributorInventory orgId={orgId} />
            </SectionErrorBoundary>
          )}
          {activeTab === "team" && (
            <SectionErrorBoundary context="team management">
              <TeamMemberManagement organizationType="distributor" organizationId={orgId} />
            </SectionErrorBoundary>
          )}
          {activeTab === "analytics" && (
            <SectionErrorBoundary context="distributor analytics">
              <AnalyticsDashboard dashboardType="distributor" title="Distributor Analytics" />
            </SectionErrorBoundary>
          )}
          {activeTab === "alerts" && (
            <SectionErrorBoundary context="alerts">
              <DistributorAlerts />
            </SectionErrorBoundary>
          )}
          {activeTab === "transfers" && (
            <SectionErrorBoundary context="transfers">
              <Transfers orgId={orgId} allBatches={batches} loadBatches={loadBatches} />
            </SectionErrorBoundary>
          )}
          {activeTab === "qr-scanner" && (
            <SectionErrorBoundary context="QR scanner">
              <div className="flex justify-center items-center min-h-[500px]">
                <div className="hidden lg:block w-full max-w-[600px]">
                  <Card className="border border-border shadow-sm">
                    <CardContent>
                      <div className="flex justify-center items-center">
                        <QRScanner onScan={handleQRScan} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="block lg:hidden w-full">
                  <QRScanner onScan={handleQRScan} />
                </div>
              </div>
            </SectionErrorBoundary>
          )}
          {activeTab === "settings" && (
            <SectionErrorBoundary context="settings">
              <DistributorSettings />
            </SectionErrorBoundary>
          )}
        </div>
      </main>
    </div>
  )
}
