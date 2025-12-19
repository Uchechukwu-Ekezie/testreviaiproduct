"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

// Interfaces for type safety
interface Receipt {
  id: string;
  bookingId?: string;
  booking?: {
    id: string;
    property: string | {
      id: string;
      title: string;
      address: string;
    };
  };
  property?: string;
  type: string;
  amount: number;
  date?: string;
  created_at: string;
  updated_at: string;
  time?: string;
  status: string;
  paymentMethod?: string;
  payment_method?: string;
  landlord?: string;
  location?: string;
  transactionId?: string;
  transaction_id?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

const filterOptions = [
  { value: "all", label: "All Status" },
  { value: "paid", label: "Paid" },
  { value: "refunded", label: "Refunded" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "successful", label: "Successful" },
];

const sortOptions = [
  { value: "recent", label: "Most Recent" },
  { value: "oldest", label: "Oldest First" },
  { value: "amount-high", label: "Amount: High to Low" },
  { value: "amount-low", label: "Amount: Low to High" },
];

export default function Receipts() {
  const { user, isAuthenticated } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedReceipts, setSelectedReceipts] = useState<string[]>([]);

  // Fetch receipts data
  useEffect(() => {
    const fetchReceipts = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Try to fetch receipts from API
        const response = await apiFetch("receipts/mine/");
        const receiptsData = response || [];
        
        // Fetched receipts
        setReceipts(receiptsData);

      } catch (err: any) {
        console.error("Error fetching receipts:", err);
        // If endpoint doesn't exist, show empty state instead of error
        if (err.message?.includes('404') || err.message?.includes('Not Found')) {
          setReceipts([]);
          setError(null);
        } else {
          setError("Failed to load receipts");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, [isAuthenticated, user]);

  // Transform receipt data to ensure consistency
  const transformedReceipts = receipts.map(receipt => ({
    ...receipt,
    property: typeof receipt.property === 'string' 
      ? receipt.property 
      : receipt.property || 
        (typeof receipt.booking?.property === 'string' 
          ? receipt.booking.property 
          : receipt.booking?.property?.title) || 
        'Unknown Property',
    location: receipt.location || 
              (typeof receipt.booking?.property === 'object' 
                ? receipt.booking.property.address 
                : '') || 
              'Location not specified',
    paymentMethod: receipt.paymentMethod || receipt.payment_method || 'Unknown',
    transactionId: receipt.transactionId || receipt.transaction_id || `TXN-${receipt.id.slice(0, 8)}`,
    date: formatDate(receipt.date || receipt.created_at),
    time: formatTime(receipt.created_at),
  }));

  // Helper function to format date
  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  // Helper function to format time
  function formatTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  }

  const filteredReceipts = transformedReceipts.filter((receipt) => {
    // Filter by status
    if (statusFilter !== "all" && receipt.status.toLowerCase() !== statusFilter)
      return false;

    // Filter by search query
    if (
      searchQuery &&
      !receipt.property.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !receipt.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(receipt.landlord || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;

    return true;
  }).sort((a, b) => {
    // Sort logic
    switch (sortBy) {
      case "recent":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "amount-high":
        return b.amount - a.amount;
      case "amount-low":
        return a.amount - b.amount;
      default:
        return 0;
    }
  });

  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('paid') || lowerStatus.includes('completed') || lowerStatus.includes('successful')) {
      return "bg-green-500/20 text-green-400";
    } else if (lowerStatus.includes('refunded')) {
      return "bg-blue-500/20 text-blue-400";
    } else if (lowerStatus.includes('pending')) {
      return "bg-orange-500/20 text-orange-400";
    } else if (lowerStatus.includes('failed') || lowerStatus.includes('cancelled')) {
      return "bg-red-500/20 text-red-400";
    }
    return "bg-gray-500/20 text-gray-400";
  };

  const getPaymentMethodIcon = (method: string) => {
    const lowerMethod = method.toLowerCase();
    if (lowerMethod.includes('card')) {
      return (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      );
    } else if (lowerMethod.includes('bank') || lowerMethod.includes('transfer')) {
      return (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
          />
        </svg>
      );
    }
    return (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
        />
      </svg>
    );
  };

  const handleSelectReceipt = (receiptId: string) => {
    setSelectedReceipts((prev) =>
      prev.includes(receiptId)
        ? prev.filter((id) => id !== receiptId)
        : [...prev, receiptId]
    );
  };

  const handleSelectAll = () => {
    if (selectedReceipts.length === filteredReceipts.length) {
      setSelectedReceipts([]);
    } else {
      setSelectedReceipts(filteredReceipts.map((r) => r.id));
    }
  };

  const downloadReceipt = (receiptId: string) => {
    // Mock download functionality - replace with actual download logic
    // Downloading receipt
    // You can implement actual PDF generation or download logic here
  };

  const totalAmount = filteredReceipts.reduce(
    (sum, receipt) => sum + receipt.amount,
    0
  );
  const paidAmount = filteredReceipts
    .filter((r) => r.status.toLowerCase().includes('paid') || 
                   r.status.toLowerCase().includes('completed') ||
                   r.status.toLowerCase().includes('successful'))
    .reduce((sum, receipt) => sum + receipt.amount, 0);

  if (!isAuthenticated) {
    return (
      <div className="bg-[#222222] p-6 text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
          <p className="text-gray-400">You need to be logged in to view your receipts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#222222] p-6 text-white min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="flex items-center text-gray-400 hover:text-white mb-4"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-white">Receipts</h1>
            <p className="text-gray-400 mt-1">
              Manage your payment receipts and transaction history
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              className="px-4 py-2 text-gray-400 border border-gray-600 rounded-[15px] hover:bg-[#2a2a2a] hover:text-white"
              onClick={() => {}}
            >
              Export All
            </button>
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-[15px] hover:bg-blue-700"
              disabled={selectedReceipts.length === 0}
              onClick={() => {}}
            >
              Download Selected ({selectedReceipts.length})
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-400">Loading receipts...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-[15px] p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="p-6 border rounded-[15px] shadow-inner bg-[#212121] shadow-white/5 border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Transactions</p>
                  <p className="text-2xl font-bold text-white">
                    {filteredReceipts.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-[15px] flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="p-6 border rounded-[15px] shadow-inner bg-[#212121] shadow-white/5 border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Paid</p>
                  <p className="text-2xl font-bold text-green-400">
                    ₦{paidAmount.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-[15px] flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="p-6 border rounded-[15px] shadow-inner bg-[#212121] shadow-white/5 border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Amount</p>
                  <p className="text-2xl font-bold text-white">
                    ₦{totalAmount.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-[15px] flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by receipt ID, property, or landlord"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#212121] border border-gray-600 rounded-[15px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-4 pr-10 py-2 bg-[#212121] border border-gray-600 rounded-[15px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white appearance-none"
            >
              {filterOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-[#212121] text-white"
                >
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pl-4 pr-10 py-2 bg-[#212121] border border-gray-600 rounded-[15px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white appearance-none"
            >
              {sortOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-[#212121] text-white"
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Receipts Table */}
          <div className="bg-[#212121] rounded-[15px] shadow-inner shadow-white/5 border border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedReceipts.length === filteredReceipts.length &&
                        filteredReceipts.length > 0
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 bg-[#2a2a2a] border-gray-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-400">
                      {selectedReceipts.length > 0
                        ? `${selectedReceipts.length} selected`
                        : "Select all"}
                    </span>
                  </label>
                </div>
                {selectedReceipts.length > 0 && (
                  <div className="flex gap-2">
                    <button 
                      className="px-3 py-1 text-sm text-blue-400 hover:text-blue-300"
                      onClick={() => {}}
                    >
                      Download Selected
                    </button>
                    <button 
                      className="px-3 py-1 text-sm text-red-400 hover:text-red-300"
                      onClick={() => {}}
                    >
                      Delete Selected
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#2a2a2a]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Receipt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-[#212121] divide-y divide-gray-600">
                  {filteredReceipts.map((receipt) => (
                    <tr key={receipt.id} className="hover:bg-[#2a2a2a]">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedReceipts.includes(receipt.id)}
                            onChange={() => handleSelectReceipt(receipt.id)}
                            className="w-4 h-4 text-blue-600 bg-[#2a2a2a] border-gray-600 rounded focus:ring-blue-500 mr-3"
                          />
                          <div>
                            <div className="text-sm font-medium text-white">
                              {receipt.id.length > 12 ? `${receipt.id.substring(0, 12)}...` : receipt.id}
                            </div>
                            <div className="text-sm text-gray-400">
                              {receipt.type}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">{receipt.property}</div>
                        {receipt.landlord && (
                          <div className="text-sm text-gray-400">
                            {receipt.landlord}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          ₦{receipt.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            receipt.status
                          )}`}
                        >
                          {receipt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-white">
                          {getPaymentMethodIcon(receipt.paymentMethod)}
                          <span className="ml-2">{receipt.paymentMethod}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{receipt.date}</div>
                        {receipt.time && (
                          <div className="text-sm text-gray-400">{receipt.time}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => downloadReceipt(receipt.id)}
                          className="text-blue-400 hover:text-blue-300 mr-3"
                        >
                          Download
                        </button>
                        <button className="text-gray-400 hover:text-white">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredReceipts.length === 0 && (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-white">
                  No receipts found
                </h3>
                <p className="mt-1 text-sm text-gray-400">
                  {searchQuery
                    ? "Try adjusting your search criteria"
                    : "You don't have any receipts yet"}
                </p>
                <div className="mt-6">
                  <Link
                    href="/"
                    className="px-4 py-2 bg-blue-600 text-white rounded-[15px] hover:bg-blue-700"
                  >
                    Make a Booking
                  </Link>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}