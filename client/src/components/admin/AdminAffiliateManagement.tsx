import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  UserCheck, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Copy,
  DollarSign,
  TrendingUp,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  BarChart3
} from "lucide-react";
import type { Affiliate } from "@shared/schema";

type SortField = 'followers' | 'tiktokFollowers' | 'country' | 'totalSales' | 'totalRevenue';
type SortOrder = 'asc' | 'desc';

export function AdminAffiliateManagement() {
  const [activeTab, setActiveTab] = useState("pending");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const queryClient = useQueryClient();

  // Fetch all affiliates
  const { data: allAffiliates = [], isLoading } = useQuery<Affiliate[]>({
    queryKey: ["/api/admin/affiliates"],
  });

  // Fetch Top of Funnel data
  const { data: tofData = [], isLoading: tofLoading } = useQuery({
    queryKey: ["/api/admin/tof-links"],
  });



  // Sort function
  const sortData = (data: any[], field: SortField, order: SortOrder) => {
    return [...data].sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];
      
      // Handle different data types
      if (field === 'country') {
        aVal = aVal?.toLowerCase() || '';
        bVal = bVal?.toLowerCase() || '';
      } else if (field === 'totalRevenue') {
        aVal = parseFloat(aVal || 0);
        bVal = parseFloat(bVal || 0);
      } else {
        aVal = aVal || 0;
        bVal = bVal || 0;
      }
      
      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  };

  // Toggle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  // Filter and sort affiliates based on active tab
  let pendingAffiliates = allAffiliates.filter(affiliate => affiliate.status === 'pending');
  let activeAffiliates = allAffiliates.filter(affiliate => affiliate.status === 'approved');
  
  if (sortField) {
    pendingAffiliates = sortData(pendingAffiliates, sortField, sortOrder);
    activeAffiliates = sortData(activeAffiliates, sortField, sortOrder);
  }
  
  const loadingPending = isLoading;
  const loadingActive = isLoading;

  // Approve affiliate mutation
  const approveAffiliateMutation = useMutation({
    mutationFn: async (affiliateId: string) => {
      return await apiRequest("PATCH", `/api/admin/affiliates/${affiliateId}`, { status: 'approved' });
    },
    onSuccess: () => {
      toast({
        title: "Affiliate Approved",
        description: "Affiliate has been approved and can now start earning commissions.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliates"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject affiliate mutation
  const rejectAffiliateMutation = useMutation({
    mutationFn: async (affiliateId: string) => {
      return await apiRequest("PATCH", `/api/admin/affiliates/${affiliateId}`, { status: 'rejected' });
    },
    onSuccess: () => {
      toast({
        title: "Affiliate Rejected",
        description: "Application has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliates"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  const PendingApplicationsTable = () => {
    if (loadingPending) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      );
    }

    if (!pendingAffiliates?.length) {
      return (
        <div className="text-center p-8 text-gray-500">
          <Clock className="mx-auto h-12 w-12 mb-4 text-gray-300" />
          <p>No pending applications</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Profile</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Instagram</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50" 
              onClick={() => handleSort('followers')}
            >
              <div className="flex items-center gap-1">
                IG Followers {getSortIcon('followers')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50" 
              onClick={() => handleSort('tiktokFollowers')}
            >
              <div className="flex items-center gap-1">
                TikTok Followers {getSortIcon('tiktokFollowers')}
              </div>
            </TableHead>
            <TableHead>PayPal Email</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50" 
              onClick={() => handleSort('country')}
            >
              <div className="flex items-center gap-1">
                Country {getSortIcon('country')}
              </div>
            </TableHead>
            <TableHead>Applied</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingAffiliates.map((affiliate: Affiliate) => (
            <TableRow key={affiliate.id}>
              <TableCell>
                {affiliate.profilePhotoUrl ? (
                  <img 
                    src={affiliate.profilePhotoUrl} 
                    alt={affiliate.fullName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-gray-500" />
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">{affiliate.fullName}</TableCell>
              <TableCell>
                {affiliate.instagramHandle ? (
                  <a 
                    href={`https://instagram.com/${affiliate.instagramHandle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    @{affiliate.instagramHandle.replace('@', '')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-gray-500">N/A</span>
                )}
              </TableCell>
              <TableCell>{affiliate.followers?.toLocaleString() || 'N/A'}</TableCell>
              <TableCell>{affiliate.tiktokFollowers?.toLocaleString() || 'N/A'}</TableCell>
              <TableCell className="max-w-[150px] truncate" title={affiliate.paypalEmail}>
                {affiliate.paypalEmail || 'N/A'}
              </TableCell>
              <TableCell>{affiliate.country}</TableCell>
              <TableCell>{affiliate.createdAt ? new Date(affiliate.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => approveAffiliateMutation.mutate(affiliate.id)}
                    disabled={approveAffiliateMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => rejectAffiliateMutation.mutate(affiliate.id)}
                    disabled={rejectAffiliateMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const TopOfFunnelTable = () => {
    if (tofLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      );
    }

    if (!tofData?.length) {
      return (
        <div className="text-center p-8 text-gray-500">
          <BarChart3 className="mx-auto h-12 w-12 mb-4 text-gray-300" />
          <p>No Top of Funnel links</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>TOF URL</TableHead>
            <TableHead>Campaign Name</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50" 
              onClick={() => handleSort('totalSales')}
            >
              <div className="flex items-center gap-1">
                Clicks {getSortIcon('totalSales')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50" 
              onClick={() => handleSort('totalSales')}
            >
              <div className="flex items-center gap-1">
                Total Sales {getSortIcon('totalSales')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50" 
              onClick={() => handleSort('totalRevenue')}
            >
              <div className="flex items-center gap-1">
                Total Revenue {getSortIcon('totalRevenue')}
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tofData.map((link: any) => (
            <TableRow key={link.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 max-w-[200px] truncate" title={link.tofUrl}>
                    {link.tofUrl}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(link.tofUrl, "TOF URL")}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>{link.campaignName || 'N/A'}</TableCell>
              <TableCell>{link.clicks?.toLocaleString() || '0'}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  {link.totalSales || 0}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  {formatCurrency(parseFloat(link.totalRevenue || "0"))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const ActiveAffiliatesTable = () => {
    if (loadingActive) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      );
    }

    if (!activeAffiliates?.length) {
      return (
        <div className="text-center p-8 text-gray-500">
          <Users className="mx-auto h-12 w-12 mb-4 text-gray-300" />
          <p>No active affiliates</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Profile</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Instagram</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50" 
              onClick={() => handleSort('followers')}
            >
              <div className="flex items-center gap-1">
                IG Followers {getSortIcon('followers')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50" 
              onClick={() => handleSort('tiktokFollowers')}
            >
              <div className="flex items-center gap-1">
                TikTok Followers {getSortIcon('tiktokFollowers')}
              </div>
            </TableHead>
            <TableHead>PayPal Email</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50" 
              onClick={() => handleSort('country')}
            >
              <div className="flex items-center gap-1">
                Country {getSortIcon('country')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50" 
              onClick={() => handleSort('totalSales')}
            >
              <div className="flex items-center gap-1">
                Total Sales {getSortIcon('totalSales')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50" 
              onClick={() => handleSort('totalRevenue')}
            >
              <div className="flex items-center gap-1">
                Total Revenue {getSortIcon('totalRevenue')}
              </div>
            </TableHead>
            <TableHead>URLs</TableHead>
            <TableHead>Payout Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activeAffiliates.map((affiliate: Affiliate) => (
            <TableRow key={affiliate.id}>
              <TableCell>
                {affiliate.profilePhotoUrl ? (
                  <img 
                    src={affiliate.profilePhotoUrl} 
                    alt={affiliate.fullName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-gray-500" />
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">{affiliate.fullName}</TableCell>
              <TableCell>
                {affiliate.instagramHandle ? (
                  <a 
                    href={`https://instagram.com/${affiliate.instagramHandle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    @{affiliate.instagramHandle.replace('@', '')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-gray-500">N/A</span>
                )}
              </TableCell>
              <TableCell>{affiliate.followers?.toLocaleString() || 'N/A'}</TableCell>
              <TableCell>{affiliate.tiktokFollowers?.toLocaleString() || 'N/A'}</TableCell>
              <TableCell className="max-w-[150px] truncate" title={affiliate.paypalEmail}>
                {affiliate.paypalEmail || 'N/A'}
              </TableCell>
              <TableCell>{affiliate.country}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  {affiliate.totalSales || 0}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  {formatCurrency(parseFloat(affiliate.totalRevenue || "0"))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(affiliate.referralUrl, "Referral URL")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  {affiliate.shortUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(affiliate.shortUrl!, "Short URL")}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={affiliate.connectedAccountId ? "default" : "secondary"}>
                  {affiliate.connectedAccountId ? "Connected" : "Pending"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Affiliate Management</h2>
          <p className="text-muted-foreground">
            Manage affiliate applications and track performance.
          </p>
        </div>
        <Button asChild>
          <a href="https://myapp.drgolly.com/affiliates/apply" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            View Application Form
          </a>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Applications
            {pendingAffiliates?.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingAffiliates.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Active Affiliates
            {activeAffiliates?.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeAffiliates.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="tof" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Top of Funnel
            {tofData?.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {tofData.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Applications</CardTitle>
              <CardDescription>
                Review and approve or reject affiliate applications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PendingApplicationsTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Affiliates</CardTitle>
              <CardDescription>
                Manage active affiliates and track their performance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActiveAffiliatesTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tof" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Top of Funnel Links</CardTitle>
              <CardDescription>
                Automatically tracks engagement and revenue from freebie downloads. 
                Tracking links are auto-generated for all blog posts starting with "/blog/free-".
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TopOfFunnelTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}