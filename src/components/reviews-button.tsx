"use client";

import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { reviewsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface ReviewsButtonProps {
  className?: string;
}

const ReviewsButton: React.FC<ReviewsButtonProps> = ({ className = '' }) => {
  const [stats, setStats] = useState<ReviewStats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Fetch review stats
  const fetchStats = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const statsData = await reviewsAPI.getUserReviewStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching review stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load stats when component mounts and user is authenticated
  useEffect(() => {
    fetchStats();
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle navigation to reviews page
  const handleReviewsClick = () => {
    router.push('/reviews');
  };

  // Don't render if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Calculate if there are items that need attention (rejected or pending)
  const needsAttention = stats.rejected > 0 || stats.pending > 0;

  return (
    <button
      onClick={handleReviewsClick}
      className={`relative inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm ${
        needsAttention
          ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400'
      } ${className}`}
      disabled={loading}
      title="View your reviews"
    >
      {/* Icon */}
      <div className="relative">
        <MessageSquare className="w-4 h-4" />
        
        {/* Loading indicator */}
        {loading && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-slate-400 rounded-full animate-pulse" />
        )}
      </div>

      {/* Text - smaller */}
      <span className="font-medium">Reviews</span>
    </button>
  );
};

export default ReviewsButton;