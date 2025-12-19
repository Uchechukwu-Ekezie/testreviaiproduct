"use client";

import React, { useState } from 'react';
import { X, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface LoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export default function LoginPopup({ 
  isOpen, 
  onClose, 
  title = "Authentication Required",
  message = "Please log in to access this feature."
}: LoginPopupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    setIsLoading(true);
    router.push('/signin');
    onClose();
  };

  const handleSignup = () => {
    setIsLoading(true);
    router.push('/signup');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{message}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-accent rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Welcome Back!
            </h3>
            <p className="text-muted-foreground text-sm">
              Sign in to your account to continue or create a new account to get started.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
            
            <Button
              onClick={handleSignup}
              disabled={isLoading}
              variant="outline"
              className="w-full h-12 border-border hover:bg-accent text-foreground font-medium rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create Account
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-border">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Why do I need to sign in?
                </p>
                <p className="text-xs text-muted-foreground">
                  This feature requires authentication to ensure your data is secure and personalized to your account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

