import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, CheckCircle, Clock, XCircle } from "lucide-react"
import { useState, useEffect } from "react"

interface StatsData {
  activeInvestigations: number;
  investigationGrowth: number;
  complianceChecks: number;
  complianceGrowth: number;
  pendingReviews: number;
  pendingGrowth: number;
  violationsFound: number;
  violationChange: number;
}

const RegulatorStats = () => {
  const [stats, setStats] = useState<StatsData>({
    activeInvestigations: 0,
    investigationGrowth: 0,
    complianceChecks: 0,
    complianceGrowth: 0,
    pendingReviews: 0,
    pendingGrowth: 0,
    violationsFound: 0,
    violationChange: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/web/dashboard/regulator-stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          console.error('Failed to fetch regulator stats');
        }
      } catch (error) {
        console.error('Error fetching regulator stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="border border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active Investigations</CardTitle>
          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
            <Eye className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.activeInvestigations}</div>
          <p className="text-xs text-muted-foreground">
            <span className={stats.investigationGrowth >= 0 ? "text-accent font-medium" : "text-destructive font-medium"}>
              {stats.investigationGrowth >= 0 ? '+' : ''}{stats.investigationGrowth}
            </span> from last month
          </p>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Compliance Checks</CardTitle>
          <div className="h-8 w-8 rounded-md bg-status-verified/10 flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-status-verified" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.complianceChecks}</div>
          <p className="text-xs text-muted-foreground">
            <span className={stats.complianceGrowth >= 0 ? "text-status-verified" : "text-destructive"}>
              {stats.complianceGrowth >= 0 ? '+' : ''}{stats.complianceGrowth}%
            </span> this month
          </p>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reviews</CardTitle>
          <div className="h-8 w-8 rounded-md bg-status-warning/10 flex items-center justify-center">
            <Clock className="h-4 w-4 text-status-warning" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-status-warning">{stats.pendingReviews}</div>
          <p className="text-xs text-muted-foreground">
            <span className={stats.pendingGrowth >= 0 ? "text-status-warning" : "text-status-verified"}>
              {stats.pendingGrowth >= 0 ? '+' : ''}{stats.pendingGrowth}%
            </span> change
          </p>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Violations Found</CardTitle>
          <div className="h-8 w-8 rounded-md bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-4 w-4 text-destructive" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{stats.violationsFound}</div>
          <p className="text-xs text-muted-foreground">
            <span className={stats.violationChange <= 0 ? "text-status-verified" : "text-destructive"}>
              {stats.violationChange >= 0 ? '+' : ''}{stats.violationChange}
            </span> from last month
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegulatorStats;
