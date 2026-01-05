"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { bookingAPI } from "@/lib/api";
import { Header } from "@/components/dashboard/header";
import { ArrowLeft, ArrowUpRight, ArrowDownRight, RefreshCw, Filter } from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";

interface Transaction {
  id: string;
  wallet_id: string;
  amount: string;
  currency: string;
  transaction_type: "credit" | "debit";
  status: string;
  description?: string;
  reference?: string;
  booking_id?: string;
  created_at: string;
  updated_at: string;
}

export default function TransactionsPage() {
  const { user, isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchTransactions = async (showRefreshing = false) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params: any = {
        page,
        page_size: pageSize,
      };

      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      const response = await bookingAPI.getAgentTransactions(user.id, params) as any;
      
      // Handle paginated response
      const transactionsData = response?.transactions || response?.results || response?.data?.transactions || (Array.isArray(response) ? response : []);
      const totalCount = response?.total || response?.count || transactionsData.length;
      const currentPage = response?.page || page;
      const totalPagesCount = response?.total_pages || Math.ceil(totalCount / pageSize) || 1;

      setTransactions(transactionsData);
      setTotal(totalCount);
      setTotalPages(totalPagesCount);
      setPage(currentPage);
    } catch (err: any) {
      console.error("Error fetching transactions:", err);
      const errorMessage =
        err?.message ||
        err?.response?.data?.detail ||
        "Failed to load transactions";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTransactions();
    }
  }, [isAuthenticated, user?.id, page, statusFilter]);

  const handleRefresh = () => {
    fetchTransactions(true);
  };

  const formatAmount = (amount: string, currency: string = "NGN"): string => {
    try {
      const numAmount = parseFloat(amount);
      if (!isNaN(numAmount)) {
        return `${currency} ${numAmount.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      }
      return `${currency} ${amount}`;
    } catch {
      return `${currency} ${amount}`;
    }
  };

  const formatDateTime = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    if (type?.toLowerCase() === "credit") {
      return "text-green-400 bg-green-500/20 border-green-500/30";
    }
    return "text-red-400 bg-red-500/20 border-red-500/30";
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'completed' || statusLower === 'success') return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (statusLower === 'pending') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (statusLower === 'failed' || statusLower === 'cancelled') return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-[#222222] min-h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
          <p className="text-gray-400">
            You need to be logged in to view transactions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#222222] min-h-screen">
      <Header title="Transactions" />
      <div className="ml-6 p-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Link
                href="/dashboard/wallet"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Wallet
              </Link>
              <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
              <p className="text-gray-400">
                View all your wallet transactions and activity
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#373737] hover:bg-[#444444] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400 text-sm">Filter by Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1); // Reset to first page when filter changes
            }}
            className="px-4 py-2 bg-[#212121] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {statusFilter !== "all" && (
            <button
              onClick={() => {
                setStatusFilter("all");
                setPage(1);
              }}
              className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear Filter
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-400">Loading transactions...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-400 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Transactions List */}
        {!loading && (
          <>
            {transactions.length === 0 ? (
              <div className="bg-[#212121] border border-gray-700 rounded-lg p-12 text-center">
                <p className="text-gray-400 text-lg mb-2">No transactions found</p>
                <p className="text-gray-500 text-sm">
                  {statusFilter !== "all"
                    ? "Try adjusting your filter"
                    : "You don't have any transactions yet"}
                </p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="mb-6 flex items-center justify-between text-sm text-gray-400">
                  <p>
                    Showing {transactions.length} of {total} transactions
                  </p>
                  {totalPages > 1 && (
                    <p>
                      Page {page} of {totalPages}
                    </p>
                  )}
                </div>

                {/* Transactions Table */}
                <div className="bg-[#212121] border border-gray-700 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#2a2a2a] border-b border-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Reference
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {transactions.map((transaction) => (
                          <tr
                            key={transaction.id}
                            className="hover:bg-[#2a2a2a] transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {transaction.transaction_type?.toLowerCase() === "credit" ? (
                                  <ArrowDownRight className="w-4 h-4 text-green-400" />
                                ) : (
                                  <ArrowUpRight className="w-4 h-4 text-red-400" />
                                )}
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium border ${getTransactionTypeColor(
                                    transaction.transaction_type || ""
                                  )}`}
                                >
                                  {transaction.transaction_type?.toUpperCase() || "N/A"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`font-semibold ${
                                  transaction.transaction_type?.toLowerCase() === "credit"
                                    ? "text-green-400"
                                    : "text-red-400"
                                }`}
                              >
                                {transaction.transaction_type?.toLowerCase() === "credit"
                                  ? "+"
                                  : "-"}
                                {formatAmount(
                                  transaction.amount,
                                  transaction.currency
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-white text-sm">
                                {transaction.description || "Transaction"}
                              </p>
                              {transaction.booking_id && (
                                <p className="text-gray-400 text-xs mt-1">
                                  Booking: {transaction.booking_id.substring(0, 8)}...
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
                                  transaction.status || ""
                                )}`}
                              >
                                {transaction.status || "Unknown"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {transaction.reference ? (
                                <p className="text-gray-300 font-mono text-xs">
                                  {transaction.reference}
                                </p>
                              ) : (
                                <p className="text-gray-500 text-xs">N/A</p>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                              {formatDateTime(transaction.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || loading}
                      className="px-4 py-2 bg-[#212121] border border-gray-600 text-white rounded-lg hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-gray-400">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || loading}
                      className="px-4 py-2 bg-[#212121] border border-gray-600 text-white rounded-lg hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

