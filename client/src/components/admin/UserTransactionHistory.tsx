import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar, ShoppingCart, DollarSign } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Transaction {
  id: number;
  amount: number;
  purchasedAt: string;
  status: string;
  stripePaymentIntentId: string;
  courseTitle: string;
  thumbnailUrl: string;
}

interface UserTransactionHistoryProps {
  userId: string;
  userName: string;
}

export function UserTransactionHistory({ userId, userName }: UserTransactionHistoryProps) {
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ["/api/admin/users", userId, "transactions"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/users/${userId}/transactions`);
      return response.json();
    },
    enabled: !!userId,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTotalSpent = (transactions: Transaction[]) => {
    return transactions?.reduce((total, transaction) => total + transaction.amount, 0) || 0;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Transaction History for {userName}</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load transaction history</p>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Transaction History for {userName}</h3>
        </div>
        <div className="text-center py-8">
          <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No transactions found</p>
          <p className="text-sm text-gray-400">This user hasn't made any course purchases yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Transaction History for {userName}</h3>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium">Total Spent: {formatCurrency(getTotalSpent(transactions))}</span>
        </div>
      </div>

      <div className="space-y-3">
        {transactions.map((transaction: Transaction) => (
          <Card key={transaction.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{transaction.courseTitle}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {transaction.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        ID: {transaction.stripePaymentIntentId?.slice(-8) || transaction.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {formatDate(transaction.purchasedAt)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Summary</span>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
              </div>
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(getTotalSpent(transactions))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}