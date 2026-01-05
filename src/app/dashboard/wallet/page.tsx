"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { bookingAPI } from "@/lib/api";
import { Header } from "@/components/dashboard/header";
import { Wallet, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";

interface WalletData {
  id: string;
  user_id: string;
  balance: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

// Format large balance string to readable number
const formatBalance = (balance: string): string => {
  try {
    // Parse the balance string to a number
    const numBalance = parseFloat(balance);
    
    // If it's a valid number, format it with commas
    if (!isNaN(numBalance)) {
      // Round to 2 decimal places for display
      return numBalance.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    
    // If parsing fails, return the original string
    return balance;
  } catch {
    return balance;
  }
};

export default function WalletPage() {
  const { user, isAuthenticated } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = async (showRefreshing = false) => {
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

      const walletData = await bookingAPI.getAgentWallet(user.id);
      setWallet(walletData);
    } catch (err: any) {
      console.error("Error fetching wallet:", err);
      const errorMessage =
        err?.message ||
        err?.response?.data?.detail ||
        "Failed to load wallet information";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchWallet();
    }
  }, [isAuthenticated, user?.id]);

  const handleRefresh = () => {
    fetchWallet(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-[#222222] min-h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
          <p className="text-gray-400">
            You need to be logged in to view your wallet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#222222] min-h-screen">
      <Header title="Wallet" />
      <div className="ml-6 p-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Wallet</h1>
              <p className="text-gray-400">
                View your wallet balance and transaction history
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

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-400">Loading wallet...</span>
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

        {/* Wallet Content */}
        {!loading && wallet && (
          <div className="space-y-6">
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-[#2a2a2a] to-[#1f1f1f] border border-[#373737] rounded-lg p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#FFD700] to-[#780991] rounded-lg flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-400">
                      Current Balance
                    </h2>
                    <p className="text-sm text-gray-500">
                      Last updated:{" "}
                      {new Date(wallet.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-5xl font-bold text-white mb-2">
                  {wallet.currency} {formatBalance(wallet.balance)}
                </p>
                <p className="text-gray-400 text-sm">
                  Wallet ID: {wallet.id}
                </p>
              </div>
            </div>

            {/* Wallet Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Wallet Details */}
              <div className="bg-[#2a2a2a] border border-[#373737] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Wallet Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Currency</p>
                    <p className="text-white font-medium">{wallet.currency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Created</p>
                    <p className="text-white font-medium">
                      {new Date(wallet.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Last Updated</p>
                    <p className="text-white font-medium">
                      {new Date(wallet.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-[#2a2a2a] border border-[#373737] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Quick Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <span className="text-gray-400">Total Earnings</span>
                    </div>
                    <span className="text-white font-semibold">
                      {wallet.currency} {formatBalance(wallet.balance)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-blue-400" />
                      <span className="text-gray-400">Available Balance</span>
                    </div>
                    <span className="text-white font-semibold">
                      {wallet.currency} {formatBalance(wallet.balance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Message */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-blue-400 font-medium mb-1">
                      How it works
                    </p>
                    <p className="text-blue-300/80 text-sm">
                      Your wallet balance is automatically updated when guests
                      complete payments for bookings on your properties. You can
                      withdraw your earnings through the settings page.
                    </p>
                    <Link
                      href="/dashboard/transactions"
                      className="mt-2 inline-block text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                      View Transaction History →
                    </Link>
                  </div>
                </div>
              </div>
          </div>
        )}
      </div>
    </div>
  );
}

