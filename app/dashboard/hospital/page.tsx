"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// components import 
import { HospitalSidebar } from "@/components/hospital-page-component/hospital-sidebar";
import HospitalSettings from "@/components/hospital-page-component/HospitalSettings";
import HospitalAlerts from "@/components/hospital-page-component/HospitalAlerts";
import HospitalReports from "@/components/hospital-page-component/HospitalReports";
import HospitalInventory from "@/components/hospital-page-component/HospitalInventory";
import HospitalMain from "@/components/hospital-page-component/HospitalMain";
import Transfers from "@/components/Transfers";
import QRScanner from "@/components/qr-scanner";
import { TeamMemberManagement } from "@/components/team-member-management";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { Button } from "@/components/ui/button";
import { UniversalLoader } from "@/components/ui/universal-loader";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, Shield, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// 
import { toast } from "react-toastify";

import { ManufacturerTab } from "@/utils";
import { MedicationBatchInfoProps } from "@/utils";

export default function HospitalDashboard() {

  const router = useRouter();
  
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

  // 1️⃣ Fetch orgId
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

      // Align with new batches API shape: { batches, total }
      setBatches(data.batches || []);
      toast.success("Fetched batches");
    }
    catch (err) {
      toast.error(`Failed to fetch batches: ${err instanceof Error ? err.message : String(err)}`);
    }
    finally {
      setBatchesLoading(false);
    }
  };

  // 2️⃣ Fetch batches when orgId is ready
  useEffect(() => {

    if (!orgId) return;

    loadBatches();

  }, [orgId]);

  // 3️⃣ Guard rendering while loading
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

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <HospitalSidebar activeTab={activeTab} setActiveTab={setActiveTab} orgId={orgId} />
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-foreground/20" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="fixed left-0 top-0 bottom-0 w-60 bg-sidebar shadow-lg border-r border-sidebar-border" onClick={(e) => e.stopPropagation()}>
            <HospitalSidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              orgId={orgId}
              isMobile={true}
              onTabSelect={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto relative z-10">

        <div className="p-5 sm:p-6 lg:p-8 mt-12 lg:mt-0">

          {activeTab === "dashboard" && (
            <HospitalMain setActiveTab={setActiveTab} orgId={orgId} />
          )}

          {activeTab === "inventory" && (
            <HospitalInventory orgId={orgId} />
          )}

          {activeTab === "team" && (
            <TeamMemberManagement 
              organizationType="hospital"
              organizationId={orgId}
            />
          )}

          {activeTab === "analytics" && (
            <AnalyticsDashboard 
              dashboardType="hospital"
              title="Hospital Analytics"
            />
          )}

          {activeTab === "reports" && (
            <HospitalReports />
          )}

          {activeTab === "alerts" && (
            <HospitalAlerts />
          )}

          {activeTab === "transfers" && (
            <Transfers orgId={orgId} allBatches={batches} loadBatches={loadBatches} />
          )}

          {activeTab === "qr-scanner" && (
            <div className="flex justify-center items-center min-h-[500px]">
              {/* Desktop: Card wrap */}
              <div className="hidden lg:block w-full max-w-[600px]">
                <Card className="border border-border shadow-sm">
                  <CardContent>
                    <div className="flex justify-center items-center">
                      <QRScanner onScan={handleQRScan} />
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* Mobile: No Card wrap, fill space */}
              <div className="block lg:hidden w-full">
                <QRScanner onScan={handleQRScan} />
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <HospitalSettings />
          )}
          
        </div>

      </main>

    </div>
  )
}
