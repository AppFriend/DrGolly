import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Crown, 
  Activity, 
  DollarSign, 
  ShoppingCart,
  TrendingUp,
  Calendar,
  UserMinus,
  BarChart3,
  RefreshCw
} from "lucide-react";
import OrderAnalytics from "./OrderAnalytics";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

function MetricCard({ title, value, icon, description, trend }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <Badge 
              variant={trend.isPositive ? "default" : "destructive"}
              className="text-xs"
            >
              {trend.isPositive ? "+" : ""}{trend.value}
            </Badge>
            <span className="text-xs text-muted-foreground ml-2">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminDashboard() {
  const [activeView, setActiveView] = useState<"orders" | "users">("orders");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/admin/metrics"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: courseEngagement, isLoading: engagementLoading } = useQuery({
    queryKey: ["/api/admin/courses/engagement"],
    refetchInterval: 60000, // Refresh every minute
  });

  const syncPendingTransactions = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/sync-pending-transactions", {});
    },
    onSuccess: (data) => {
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${data.updatedCount} pending transactions`,
      });
      // Refresh metrics and orders
      queryClient.invalidateQueries({ queryKey: ["/api/admin/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: "Failed to sync pending transactions",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load metrics</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateAverageEngagement = (engagement: any[]) => {
    if (!engagement || engagement.length === 0) return 0;
    const total = engagement.reduce((sum, course) => sum + course.engagement_percentage, 0);
    return Math.round(total / engagement.length);
  };

  const getMostEngagedCourse = (engagement: any[]) => {
    if (!engagement || engagement.length === 0) return null;
    return engagement.reduce((max, course) => 
      course.engagement_percentage > max.engagement_percentage ? course : max
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-muted-foreground">
            Monitor your app's performance and user metrics
          </p>
        </div>
        <Button
          onClick={() => syncPendingTransactions.mutate()}
          disabled={syncPendingTransactions.isPending}
          className="bg-[#095D66] hover:bg-[#095D66]/90"
        >
          {syncPendingTransactions.isPending ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Transactions
            </>
          )}
        </Button>
      </div>

      {/* Toggle Pills */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
        <Button
          variant={activeView === "orders" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveView("orders")}
          className="flex items-center gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Order Analytics
        </Button>
        <Button
          variant={activeView === "users" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveView("users")}
          className="flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          User Analytics
        </Button>
      </div>

      {/* Conditional Content */}
      {activeView === "orders" ? (
        <OrderAnalytics />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={(metrics.totalUsers || 0).toLocaleString()}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          description="All registered users"
        />
        
        <MetricCard
          title="Free Users"
          value={(metrics.freeUsers || 0).toLocaleString()}
          icon={<Users className="h-4 w-4 text-blue-500" />}
          description="Users on free plan"
        />
        
        <MetricCard
          title="Gold Users"
          value={(metrics.goldUsers || 0).toLocaleString()}
          icon={<Crown className="h-4 w-4 text-yellow-500" />}
          description="Gold plan subscribers"
        />
        
        <MetricCard
          title="Platinum Users"
          value={(metrics.platinumUsers || 0).toLocaleString()}
          icon={<Crown className="h-4 w-4 text-purple-500" />}
          description="Platinum plan subscribers"
        />
        
        <MetricCard
          title="Monthly Active"
          value={(metrics.monthlyActiveUsers || 0).toLocaleString()}
          icon={<Activity className="h-4 w-4 text-green-500" />}
          description="Last 30 days"
        />
        
        <MetricCard
          title="Courses Sold"
          value={(metrics.totalCoursesSold || 0).toLocaleString()}
          icon={<ShoppingCart className="h-4 w-4 text-green-500" />}
          description="Total course purchases"
        />
        
        <MetricCard
          title="Avg Engagement"
          value={engagementLoading ? "Loading..." : `${calculateAverageEngagement(courseEngagement)}%`}
          icon={<BarChart3 className="h-4 w-4 text-blue-500" />}
          description="Course completion rate"
        />
        
        <MetricCard
          title="Course Revenue"
          value={formatCurrency(metrics.totalRevenue || 0)}
          icon={<ShoppingCart className="h-4 w-4 text-purple-500" />}
          description="Individual course purchases"
        />
        
        <MetricCard
          title="Subscription Upgrades"
          value={(metrics.totalSubscriptionUpgrades || 0).toLocaleString()}
          icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
          description="Free to Gold conversions"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserMinus className="h-5 w-5 text-red-500" />
              Churn Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {(metrics.totalChurn || 0).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">
              Cancelled subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(metrics.totalUsers || 0) > 0 
                ? (((metrics.goldUsers || 0) / (metrics.totalUsers || 1)) * 100).toFixed(1) 
                : 0}%
            </div>
            <p className="text-sm text-muted-foreground">
              Free to Gold conversion
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Average Revenue Per User (ARPU)</span>
            <span className="font-semibold">
              {formatCurrency((metrics.totalUsers || 0) > 0 ? (metrics.monthlyGoldRevenue || 0) / (metrics.totalUsers || 1) : 0)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Revenue from Courses</span>
            <span className="font-semibold">
              {formatCurrency((metrics.totalCoursesSold || 0) * 120)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Active User Engagement</span>
            <span className="font-semibold">
              {(metrics.totalUsers || 0) > 0 
                ? (((metrics.monthlyActiveUsers || 0) / (metrics.totalUsers || 1)) * 100).toFixed(1) 
                : 0}%
            </span>
          </div>
        </CardContent>
      </Card>
        </div>
      )}
    </div>
  );
}