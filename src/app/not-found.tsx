"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Search, RefreshCw } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* 404 Animation/Icon */}
        <div className="mb-8">
          <div className="relative">
            {/* Large 404 Text */}
            <div className="text-8xl sm:text-9xl lg:text-[12rem] font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500 leading-none">
              404
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce"></div>
            <div className="absolute -bottom-2 -left-6 w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse"></div>
            <div className="absolute top-1/2 -right-8 w-4 h-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-ping"></div>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Oops! Page Not Found
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            The page you're looking for seems to have wandered off into the digital void. 
            Don't worry, even the best explorers sometimes take a wrong turn!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8">
          <Button
            onClick={() => router.push('/')}
            className="w-full sm:w-auto bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 text-white border-0 px-6 py-3 text-sm sm:text-base font-medium"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
          
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="w-full sm:w-auto px-6 py-3 text-sm sm:text-base font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="border-t border-border pt-8">
          <p className="text-sm text-muted-foreground mb-4">
            Maybe you were looking for one of these?
          </p>
          
           <div className="flex justify-center">
             <Button
               variant="ghost"
               onClick={() => router.push('/reviews')}
               className="flex items-center justify-center space-x-2 p-3 text-sm hover:bg-accent"
             >
               <Search className="w-4 h-4" />
               <span>Reviews</span>
             </Button>
           </div>
        </div>

        {/* Fun Fact */}
        <div className="mt-8 p-4 bg-gradient-to-r from-card/50 to-card/30 rounded-xl border border-border">
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Fun fact: HTTP 404 errors are named after room 404 at CERN where the original web servers were located!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
