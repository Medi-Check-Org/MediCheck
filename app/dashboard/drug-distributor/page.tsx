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
      console.log(scannedQRcodeResult);
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
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(true)} className="h-8 w-8 p-0">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm tracking-tight">MediCheck</span>
          </div>
          <ThemeToggle />
        </div>
      </div>
      <div className="hidden lg:block">
        <DistributorSidebar activeTab={activeTab} setActiveTab={setActiveTab} orgId={orgId} />
      </div>
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="fixed left-0 top-0 bottom-0 w-72 bg-sidebar shadow-xl border-r border-sidebar-border" onClick={e => e.stopPropagation()}>
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
      <main className="flex-1 overflow-y-auto lg:ml-0">
        <div className="p-4 sm:p-6 lg:p-8 mt-14 lg:mt-0">
          {activeTab === "dashboard" && (<DistributorMain setActiveTab={setActiveTab} orgId={orgId} />)}
          {activeTab === "inventory" && (<DistributorInventory orgId={orgId} />)}
          {activeTab === "team" && (<TeamMemberManagement organizationType="distributor" organizationId={orgId} />)}
          {activeTab === "analytics" && (<AnalyticsDashboard dashboardType="distributor" title="Distributor Analytics" />)}
          {activeTab === "alerts" && (<DistributorAlerts />)}
          {activeTab === "transfers" && (<Transfers orgId={orgId} allBatches={batches} loadBatches={loadBatches} />)}
          {activeTab === "qr-scanner" && (
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
          )}
          {activeTab === "settings" && (<DistributorSettings />)}
        </div>
      </main>
    </div>
  )
}
