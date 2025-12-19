import { Metadata } from "next";
import Link from "next/link";
import HeroSection from "@/components/hero-section";
import NewsletterSection from "@/components/newletter";
import TestimonialsSection from "@/components/testimoialsSectio";
import WhatWeDo from "@/components/what-we-do";
import Whychooseus from "@/components/whychooseus";
import { siteConfig } from "@/lib/site-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Home, TrendingUp, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "ReviAI - AI-Powered Real Estate Platform & Intelligent Assistant",
  description:
    "Transform your property search with ReviAI's AI technology. Chat with our AI assistant for personalized recommendations, find and book properties, and manage your real estate journey with intelligent insights.",
  keywords: [
    "AI real estate platform",
    "AI assistant real estate",
    "smart property booking",
    "AI apartment search",
    "intelligent housing platform",
    "automated property booking",
    "AI property recommendations",
    "smart home finder",
    "real estate AI technology",
    "property booking app",
    "AI housing marketplace",
    "intelligent property search",
    "automated real estate platform",
    "smart apartment booking",
    "AI-powered property insights",
    "real estate automation",
    "AI chat assistant",
    "property management AI",
  ],
  openGraph: {
    title: "ReviAI - AI-Powered Real Estate Platform & Intelligent Assistant",
    description: "Your intelligent companion for real estate decisions",
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReviAI - AI-Powered Real Estate Platform",
    description: "Your intelligent companion for real estate decisions",
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <HeroSection />

      {/* Features Overview Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powered by AI, Designed for You
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of real estate with our dual-platform approach: 
              intelligent AI assistance and comprehensive property management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* AI Assistant Card */}
            <Card className="p-8 hover:shadow-lg transition-shadow border-2 border-blue-100">
              <CardHeader className="text-center pb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-10 h-10 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  AI Assistant
                </CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  Get personalized property recommendations and instant answers to your real estate questions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Smart property matching based on your preferences
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Real-time market insights and analysis
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    24/7 intelligent support and guidance
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Personalized investment recommendations
                  </li>
                </ul>
                <div className="pt-4">
                  <Link href="/chats">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg">
                      Chat with AI Assistant
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Property Platform Card */}
            <Card className="p-8 hover:shadow-lg transition-shadow border-2 border-green-100">
              <CardHeader className="text-center pb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Home className="w-10 h-10 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Property Platform
                </CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  Browse, book, and manage your property experiences with ease
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Browse verified properties with detailed reviews
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Seamless booking and payment processing
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Track your bookings and experiences
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Share reviews and help the community
                  </li>
                </ul>
                <div className="pt-4">
                  <Link href="/properties">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg">
                      Explore Properties
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Access Dashboard Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/ai-dashboard">
              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border border-blue-200">
                <CardHeader className="text-center">
                  <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                  <CardTitle className="text-lg">AI Dashboard</CardTitle>
                  <CardDescription>Manage your AI conversations and insights</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/user-dashboard">
              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border border-green-200">
                <CardHeader className="text-center">
                  <Users className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <CardTitle className="text-lg">User Dashboard</CardTitle>
                  <CardDescription>Track your bookings and property activities</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/user-dashboard">
              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border border-purple-200">
                <CardHeader className="text-center">
                  <Home className="w-12 h-12 text-purple-600 mx-auto mb-2" />
                  <CardTitle className="text-lg">Property Manager</CardTitle>
                  <CardDescription>Manage your property listings and analytics</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Existing sections from frontend */}
      <WhatWeDo />
      <Whychooseus />
      <TestimonialsSection />
      <NewsletterSection />
    </div>
  );
}