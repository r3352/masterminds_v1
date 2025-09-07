"use client";

import { useQuery } from '@apollo/client';
import { GET_ESCROW_TRANSACTIONS } from '@/lib/graphql/payments';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default function PaymentsPage() {
  const { user, isAuthenticated } = useAuth();
  
  const { data, loading, error, refetch } = useQuery(GET_ESCROW_TRANSACTIONS, {
    variables: { take: 50 },
    skip: !isAuthenticated,
  });

  if (!isAuthenticated) {
    redirect('/auth/login');
  }

  const transactions = data?.escrowTransactions || [];

  // Calculate summary statistics
  const totalPaid = transactions
    .filter((t: any) => t.payer.id === user?.id && t.status !== 'REFUNDED')
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const totalEarned = transactions
    .filter((t: any) => t.payee?.id === user?.id && t.status === 'RELEASED')
    .reduce((sum: number, t: any) => sum + (t.amount - t.platformFee), 0);

  const pendingEscrows = transactions.filter((t: any) => 
    t.status === 'PENDING' && (t.payer.id === user?.id || t.payee?.id === user?.id)
  ).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'RELEASED':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Released</Badge>;
      case 'REFUNDED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading payments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">Error loading payments: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Payment Dashboard</h1>
            <p className="text-muted-foreground">Manage your bounties and earnings</p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPaid.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">On bounties</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              <ArrowDownLeft className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalEarned.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">From answers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Escrows</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingEscrows}</div>
              <p className="text-xs text-muted-foreground">Awaiting resolution</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(totalEarned - totalPaid).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalEarned >= totalPaid ? 'Profit' : 'Loss'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your payment history and escrow activities</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No transactions yet</p>
                <Button asChild>
                  <Link href="/ask">Ask your first question with a bounty</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction: any) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                        <DollarSign className="h-5 w-5 text-primary" />
                      </div>
                      
                      <div>
                        <Link 
                          href={`/questions/${transaction.question.id}`}
                          className="font-medium hover:text-primary line-clamp-1"
                        >
                          {transaction.question.title}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {transaction.payer.id === user?.id ? 'You paid' : 'You received'} • {formatDate(transaction.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-medium">
                          {transaction.payer.id === user?.id ? '-' : '+'}${
                            transaction.status === 'RELEASED' && transaction.payee?.id === user?.id 
                              ? (transaction.amount - transaction.platformFee).toFixed(2)
                              : transaction.amount.toFixed(2)
                          }
                        </div>
                        {transaction.status === 'RELEASED' && transaction.payee?.id === user?.id && (
                          <div className="text-xs text-muted-foreground">
                            Fee: ${transaction.platformFee.toFixed(2)}
                          </div>
                        )}
                      </div>
                      
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}