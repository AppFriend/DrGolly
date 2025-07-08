import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  ArrowRight,
  User,
  Package
} from "lucide-react";
import { useState } from "react";

interface OrderAnalyticsProps {
  className?: string;
}

interface OrderData {
  id: number;
  orderNumber: string;
  customerName: string;
  courseTitle: string;
  amount: number;
  status: string;
  purchasedAt: string;
  stripePaymentIntentId: string;
}

interface OrderAnalytics {
  totalRevenue: number;
  totalOrders: number;
  todayRevenue: number;
  todayOrders: number;
  yesterdayRevenue: number;
  yesterdayOrders: number;
  lastWeekRevenue: number;
  lastWeekOrders: number;
  lastMonthRevenue: number;
  lastMonthOrders: number;
  dailyRevenueData: Array<{ date: string; revenue: number; orders: number }>;
  dayOnDayChange: number;
  weekOnWeekChange: number;
  monthOnMonthChange: number;
}

export default function OrderAnalytics({ className }: OrderAnalyticsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  // Fetch order analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<OrderAnalytics>({
    queryKey: ["/api/admin/orders/analytics"],
    staleTime: 300000, // 5 minutes
  });

  // Fetch daily orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/admin/orders/daily", currentPage],
    queryFn: () => fetch(`/api/admin/orders/daily?page=${currentPage}&limit=${ordersPerPage}`).then(res => res.json()),
    staleTime: 60000, // 1 minute
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4" />;
    if (value < 0) return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  if (analyticsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Order Analytics</h2>
        <div className="text-sm text-gray-500">
          Last Updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Total Revenue */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-center">
                  {formatCurrency(analytics?.totalRevenue || 0)}
                </div>
                <div className="text-sm text-gray-600 text-center mt-1">Revenue</div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-center">
                  {analytics?.totalOrders || 0}
                </div>
                <div className="text-sm text-gray-600 text-center mt-1">Orders</div>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate (Mock) */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-center">2.2%</div>
                <div className="text-sm text-gray-600 text-center mt-1">Conversion</div>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.dailyRevenueData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#7c3aed" 
                  strokeWidth={2}
                  dot={{ fill: '#7c3aed', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#7c3aed' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Day on Day */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-600">Day on Day</div>
                <div className="text-lg font-semibold">
                  {formatCurrency(analytics?.todayRevenue || 0)}
                </div>
              </div>
              <div className={`flex items-center gap-1 ${getChangeColor(analytics?.dayOnDayChange || 0)}`}>
                {getChangeIcon(analytics?.dayOnDayChange || 0)}
                <span className="text-sm font-medium">
                  {formatPercentage(analytics?.dayOnDayChange || 0)}
                </span>
              </div>
            </div>

            {/* Week on Week */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-600">Week on Week</div>
                <div className="text-lg font-semibold">
                  {formatCurrency(analytics?.lastWeekRevenue || 0)}
                </div>
              </div>
              <div className={`flex items-center gap-1 ${getChangeColor(analytics?.weekOnWeekChange || 0)}`}>
                {getChangeIcon(analytics?.weekOnWeekChange || 0)}
                <span className="text-sm font-medium">
                  {formatPercentage(analytics?.weekOnWeekChange || 0)}
                </span>
              </div>
            </div>

            {/* Month on Month */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-600">Month on Month</div>
                <div className="text-lg font-semibold">
                  {formatCurrency(analytics?.lastMonthRevenue || 0)}
                </div>
              </div>
              <div className={`flex items-center gap-1 ${getChangeColor(analytics?.monthOnMonthChange || 0)}`}>
                {getChangeIcon(analytics?.monthOnMonthChange || 0)}
                <span className="text-sm font-medium">
                  {formatPercentage(analytics?.monthOnMonthChange || 0)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : ordersData?.orders?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No orders found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ordersData?.orders?.map((order: OrderData) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">{order.orderNumber}</div>
                      <div className="text-sm text-gray-600">{order.customerName}</div>
                      <div className="text-xs text-gray-500">{order.courseTitle}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(order.amount)}</div>
                    <div className="text-sm text-gray-500">{formatDate(order.purchasedAt)}</div>
                    <Badge variant="default" className="mt-1 bg-green-100 text-green-800">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {ordersData?.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <span className="text-sm text-gray-600">
                Page {currentPage} of {ordersData.totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(ordersData.totalPages, p + 1))}
                disabled={currentPage === ordersData.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}