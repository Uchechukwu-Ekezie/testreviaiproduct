"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Star,
  DollarSign,
  Users,
  TrendingUp,
  Eye,
  Plus,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

// Dummy data - replace with actual API calls
const dashboardStats = {
  totalProperties: 12,
  totalReviews: 48,
  averageRating: 4.7,
  monthlyRevenue: 125000,
  activeListings: 8,
  viewsThisMonth: 2340,
  inquiriesThisMonth: 56,
  scheduledVisits: 23,
};

const recentActivities = [
  {
    id: 1,
    type: "property_view",
    message: "New inquiry for 3-bedroom apartment in Victoria Island",
    time: "2 hours ago",
    icon: Eye,
    color: "text-blue-500",
  },
  {
    id: 2,
    type: "review",
    message: "New 5-star review from Sarah Johnson",
    time: "4 hours ago",
    icon: Star,
    color: "text-yellow-500",
  },
  {
    id: 3,
    type: "booking",
    message: "Property viewing scheduled for tomorrow",
    time: "6 hours ago",
    icon: Calendar,
    color: "text-green-500",
  },
  {
    id: 4,
    type: "message",
    message: "New message from potential tenant",
    time: "1 day ago",
    icon: MessageSquare,
    color: "text-purple-500",
  },
];

export default function AgentDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState("thisMonth");

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user?.first_name || "Agent"}!
          </h1>
          <p className="text-zinc-400 mt-1">
            Here&apos;s what&apos;s happening with your properties today.
          </p>
        </div>
        <Button
          onClick={() => router.push("/agent/properties/create")}
          className="bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Property
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-[#1a1a1a] border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400 mb-1">Total Properties</p>
                <p className="text-2xl font-bold text-white">
                  {dashboardStats.totalProperties}
                </p>
                <p className="text-xs text-green-500 mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  +2 this month
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400 mb-1">Average Rating</p>
                <p className="text-2xl font-bold text-white">
                  {dashboardStats.averageRating}
                </p>
                <p className="text-xs text-yellow-500 mt-1">
                  {dashboardStats.totalReviews} reviews
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400 mb-1">Monthly Revenue</p>
                <p className="text-2xl font-bold text-white">
                  ₦{dashboardStats.monthlyRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-green-500 mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  +12% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400 mb-1">Active Inquiries</p>
                <p className="text-2xl font-bold text-white">
                  {dashboardStats.inquiriesThisMonth}
                </p>
                <p className="text-xs text-purple-500 mt-1">
                  {dashboardStats.scheduledVisits} scheduled visits
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="bg-[#1a1a1a] border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      activity.type === "property_view" && "bg-blue-500/20",
                      activity.type === "review" && "bg-yellow-500/20",
                      activity.type === "booking" && "bg-green-500/20",
                      activity.type === "message" && "bg-purple-500/20"
                    )}
                  >
                    <activity.icon className={cn("w-4 h-4", activity.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{activity.message}</p>
                    <p className="text-xs text-zinc-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-[#1a1a1a] border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => router.push("/agent/properties/create")}
                variant="outline"
                className="h-20 border-zinc-700 hover:bg-zinc-800 flex flex-col items-center justify-center"
              >
                <Plus className="w-6 h-6 mb-2" />
                <span className="text-sm">Add Property</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 border-zinc-700 hover:bg-zinc-800 flex flex-col items-center justify-center"
              >
                <Calendar className="w-6 h-6 mb-2" />
                <span className="text-sm">Schedule Visit</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 border-zinc-700 hover:bg-zinc-800 flex flex-col items-center justify-center"
              >
                <MessageSquare className="w-6 h-6 mb-2" />
                <span className="text-sm">Send Message</span>
              </Button>
              <Button
                onClick={() => router.push("/agent/reviews")}
                variant="outline"
                className="h-20 border-zinc-700 hover:bg-zinc-800 flex flex-col items-center justify-center"
              >
                <Star className="w-6 h-6 mb-2" />
                <span className="text-sm">View Reviews</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart Placeholder */}
      <Card className="bg-[#1a1a1a] border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Performance Overview</CardTitle>
            <div className="flex space-x-2">
              <Button
                variant={selectedPeriod === "thisWeek" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod("thisWeek")}
                className={
                  selectedPeriod === "thisWeek"
                    ? "bg-gradient-to-r from-[#FFD700] to-[#780991]"
                    : "border-zinc-700"
                }
              >
                This Week
              </Button>
              <Button
                variant={selectedPeriod === "thisMonth" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod("thisMonth")}
                className={
                  selectedPeriod === "thisMonth"
                    ? "bg-gradient-to-r from-[#FFD700] to-[#780991]"
                    : "border-zinc-700"
                }
              >
                This Month
              </Button>
              <Button
                variant={selectedPeriod === "thisYear" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod("thisYear")}
                className={
                  selectedPeriod === "thisYear"
                    ? "bg-gradient-to-r from-[#FFD700] to-[#780991]"
                    : "border-zinc-700"
                }
              >
                This Year
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border border-zinc-700 rounded-lg">
            <div className="text-center">
              <TrendingUp className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">
                Performance chart will be displayed here
              </p>
              <p className="text-sm text-zinc-500 mt-2">
                Showing data for {selectedPeriod}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
