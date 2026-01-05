"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { bookingAPI, followAPI } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import "jspdf-autotable";

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
  const userCacheRef = useRef<Map<string, string>>(new Map()); // Cache user_id -> user_name

  // Fetch user name by user_id
  const fetchUserName = async (userId: string | null | undefined): Promise<string> => {
    if (!userId) return 'Unknown';
    
    // Check cache first
    if (userCacheRef.current.has(userId)) {
      return userCacheRef.current.get(userId) || 'Unknown';
    }

    try {
      const userStats = await followAPI.getUserFollowStats(userId);
      const fullName = `${userStats.first_name || ""} ${userStats.last_name || ""}`.trim();
      const userName = fullName || userStats.username?.split("@")[0] || userStats.email?.split("@")[0] || 'Unknown';
      
      // Cache the result
      userCacheRef.current.set(userId, userName);
      return userName;
    } catch (error) {
      console.error(`Failed to fetch user name for ${userId}:`, error);
      return 'Unknown';
    }
  };

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

        if (!user?.id) {
          setError("User ID not found");
          setLoading(false);
          return;
        }

        // Fetch user transactions from the new endpoint
        const response = await bookingAPI.getUserTransactions(user.id, {
          page: 1,
          page_size: 100,
        }) as any;
        
        // Handle different response formats
        let transactionsData: any[] = [];
        if (Array.isArray(response)) {
          transactionsData = response;
        } else if (response && typeof response === 'object') {
          // Check if response has a transactions property
          if (Array.isArray(response.transactions)) {
            transactionsData = response.transactions;
          } else if (Array.isArray(response.data)) {
            transactionsData = response.data;
          } else if (Array.isArray(response.results)) {
            transactionsData = response.results;
          }
        }
        
        // Extract unique user IDs from transactions
        const userIds = new Set<string>();
        transactionsData.forEach((transaction: any) => {
          // Extract from transaction_metadata if available
          if (transaction.transaction_metadata?.agent?.id) {
            userIds.add(transaction.transaction_metadata.agent.id);
          }
          if (transaction.transaction_metadata?.guest?.id) {
            userIds.add(transaction.transaction_metadata.guest.id);
          }
          // Also check top-level fields
          if (transaction.user_id) userIds.add(transaction.user_id);
          if (transaction.user) {
            const userId = typeof transaction.user === 'string' ? transaction.user : transaction.user.id;
            if (userId) userIds.add(userId);
          }
          if (transaction.agent_id) userIds.add(transaction.agent_id);
          if (transaction.agent?.id) userIds.add(transaction.agent.id);
        });

        // Fetch user names for all unique user IDs
        const userNamesMap = new Map<string, string>();
        await Promise.all(
          Array.from(userIds).map(async (userId) => {
            const userName = await fetchUserName(userId);
            userNamesMap.set(userId, userName);
          })
        );
        
        // Transform transactions to receipts format
        const transformedReceipts = transactionsData.map((transaction: any) => {
          // Extract from transaction_metadata first, then fallback to top-level
          const metadata = transaction.transaction_metadata || {};
          const agentId = metadata.agent?.id || transaction.agent_id || transaction.agent?.id;
          const userId = metadata.guest?.id || transaction.user_id || (typeof transaction.user === 'string' ? transaction.user : transaction.user?.id);
          
          // Get user names from the map we already fetched, or use metadata
          const agentName = metadata.agent?.name || 
            (agentId ? (userNamesMap.get(agentId) || 'Unknown') : 'Unknown') ||
            transaction.agent_name || 
            transaction.agent?.name || 
            'Unknown';
          
          const userName = metadata.guest?.name || 
            (userId ? (userNamesMap.get(userId) || 'Unknown') : 'Unknown');

          // Extract property info from metadata
          const propertyTitle = metadata.property_title || 
            transaction.property_title ||
            transaction.property_id || 
            transaction.property || 
            transaction.booking?.property_id || 
            transaction.booking?.property ||
            'Unknown Property';

          // Parse amount (can be string or number)
          const amount = typeof transaction.amount === 'string' 
            ? parseFloat(transaction.amount) || 0
            : transaction.amount || 0;

          return {
            id: transaction.id || transaction.transaction_id || `TXN-${Date.now()}`,
            bookingId: metadata.booking_id || transaction.booking_id || transaction.booking?.id,
            booking: transaction.booking,
            property: propertyTitle,
            type: transaction.type || transaction.transaction_type || 'payment',
            amount: amount,
            date: transaction.created_at || transaction.date,
            created_at: transaction.created_at || new Date().toISOString(),
            updated_at: transaction.updated_at || transaction.created_at || new Date().toISOString(),
            time: transaction.created_at,
            status: transaction.status || 'completed',
            paymentMethod: transaction.payment_method || 'paystack',
            payment_method: transaction.payment_method || 'paystack',
            landlord: agentName,
            location: metadata.property_title || transaction.location || transaction.property_address || '',
            transactionId: transaction.id || transaction.transaction_id,
            transaction_id: transaction.id || transaction.transaction_id,
            user: transaction.user || transaction.user_id,
          };
        });
        
        // Ensure receiptsData is always an array
        setReceipts(transformedReceipts);

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
  // Ensure receipts is always an array before mapping
  const transformedReceipts = (Array.isArray(receipts) ? receipts : []).map(receipt => ({
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
    // Find the receipt
    const receipt = receipts.find(r => r.id === receiptId);
    if (!receipt) {
      toast.error("Receipt not found");
      return;
    }
    
    try {
      // Create new PDF document
      const doc = new jsPDF();
      
      // Set colors
      const primaryColor: [number, number, number] = [78, 9, 145]; // #4E0991 (purple)
      const secondaryColor: [number, number, number] = [255, 215, 0]; // #FFD700 (gold)
      const darkColor: [number, number, number] = [26, 26, 26]; // #1a1a1a (dark)
      const lightGray: [number, number, number] = [200, 200, 200];
      
      // Header section
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 40, 'F');
      
      // Company/App name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('REVIAI', 105, 20, { align: 'center' });
      
      // Receipt title
      doc.setFontSize(18);
      doc.text('PAYMENT RECEIPT', 105, 35, { align: 'center' });
      
      // Reset text color
      doc.setTextColor(...darkColor);
      
      // Receipt details section
      let yPos = 55;
      
      // Receipt info box
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(10, yPos, 190, 50, 3, 3, 'F');
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      
      yPos += 8;
      doc.text('Receipt ID:', 15, yPos);
      doc.setTextColor(...darkColor);
      doc.setFont('helvetica', 'bold');
      doc.text(receipt.id.slice(0, 20) + (receipt.id.length > 20 ? '...' : ''), 50, yPos);
      
      yPos += 7;
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text('Transaction ID:', 15, yPos);
      doc.setTextColor(...darkColor);
      doc.setFont('helvetica', 'bold');
      doc.text((receipt.transactionId || receipt.id).slice(0, 20), 50, yPos);
      
      yPos += 7;
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text('Date:', 15, yPos);
      doc.setTextColor(...darkColor);
      doc.setFont('helvetica', 'bold');
      doc.text(formatDate(receipt.date || receipt.created_at), 50, yPos);
      
      yPos += 7;
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text('Time:', 15, yPos);
      doc.setTextColor(...darkColor);
      doc.setFont('helvetica', 'bold');
      doc.text(formatTime(receipt.created_at), 50, yPos);
      
      yPos += 7;
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text('Status:', 15, yPos);
      doc.setTextColor(...darkColor);
      doc.setFont('helvetica', 'bold');
      const statusColor: [number, number, number] = receipt.status.toLowerCase().includes('completed') || receipt.status.toLowerCase().includes('paid') 
        ? [34, 197, 94] // green
        : receipt.status.toLowerCase().includes('pending')
        ? [251, 146, 60] // orange
        : [239, 68, 68]; // red
      doc.setTextColor(...statusColor);
      doc.text(receipt.status.toUpperCase(), 50, yPos);
      
      // Property details section
      yPos = 120;
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(10, yPos, 190, 40, 3, 3, 'F');
      
      doc.setFontSize(12);
      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text('Property Details', 15, yPos + 8);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      
      yPos += 15;
      doc.text('Property:', 15, yPos);
      doc.setTextColor(...darkColor);
      doc.setFont('helvetica', 'bold');
      doc.text(receipt.property || 'N/A', 50, yPos);
      
      yPos += 7;
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text('Location:', 15, yPos);
      doc.setTextColor(...darkColor);
      doc.setFont('helvetica', 'bold');
      doc.text(receipt.location || 'N/A', 50, yPos);
      
      if (receipt.landlord) {
        yPos += 7;
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text('Agent/Landlord:', 15, yPos);
        doc.setTextColor(...darkColor);
        doc.setFont('helvetica', 'bold');
        doc.text(receipt.landlord, 50, yPos);
      }
      
      // Payment details section
      yPos = 175;
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(10, yPos, 190, 50, 3, 3, 'F');
      
      doc.setFontSize(12);
      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Details', 15, yPos + 8);
      
      const amount = typeof receipt.amount === 'string' ? parseFloat(receipt.amount) : receipt.amount;
      const formattedAmount = `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      
      yPos += 15;
      doc.text('Amount Paid:', 15, yPos);
      doc.setFontSize(18);
      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text(formattedAmount, 50, yPos);
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text('Payment Method:', 15, yPos);
      doc.setTextColor(...darkColor);
      doc.setFont('helvetica', 'bold');
      doc.text(receipt.paymentMethod || 'Paystack', 50, yPos);
      
      if (receipt.bookingId) {
        yPos += 7;
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text('Booking ID:', 15, yPos);
        doc.setTextColor(...darkColor);
        doc.setFont('helvetica', 'bold');
        doc.text(receipt.bookingId.slice(0, 20), 50, yPos);
      }
      
      // Footer
      yPos = 250;
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'italic');
      doc.text('Thank you for your business!', 105, yPos, { align: 'center' });
      
      yPos += 5;
      doc.setFontSize(8);
      doc.text('This is an automated receipt. Please keep this for your records.', 105, yPos, { align: 'center' });
      
      // Save the PDF
      doc.save(`receipt-${receiptId.slice(0, 8)}.pdf`);
      
      toast.success("Receipt PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF receipt");
    }
  };

  const viewReceipt = (receiptId: string) => {
    // Navigate to receipt detail page or show modal
    const receipt = receipts.find(r => r.id === receiptId);
    if (!receipt) {
      toast.error("Receipt not found");
      return;
    }
    
    // Navigate to bookings page with the booking ID if available
    if (receipt.bookingId) {
      window.location.href = `/user-dashboard/bookings`;
    } else {
      // Show receipt details in a modal or alert
      const receiptDetails = `Receipt Details:\n\nID: ${receipt.id}\nAmount: ₦${typeof receipt.amount === 'string' ? parseFloat(receipt.amount).toLocaleString() : receipt.amount.toLocaleString()}\nStatus: ${receipt.status}\nDate: ${formatDate(receipt.date || receipt.created_at)}\nProperty: ${receipt.property}`;
      alert(receiptDetails);
    }
  };

  const totalAmount = filteredReceipts.reduce(
    (sum, receipt) => {
      const amount = typeof receipt.amount === 'string' ? parseFloat(receipt.amount) || 0 : receipt.amount || 0;
      return sum + amount;
    },
    0
  );
  const paidAmount = filteredReceipts
    .filter((r) => {
      const status = (r.status || '').toLowerCase();
      return status.includes('paid') || 
             status.includes('completed') ||
             status.includes('successful');
    })
    .reduce((sum, receipt) => {
      const amount = typeof receipt.amount === 'string' ? parseFloat(receipt.amount) || 0 : receipt.amount || 0;
      return sum + amount;
    }, 0);

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
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadReceipt(receipt.id);
                          }}
                          className="text-blue-400 hover:text-blue-300 mr-3 transition-colors"
                        >
                          Download
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            viewReceipt(receipt.id);
                          }}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
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