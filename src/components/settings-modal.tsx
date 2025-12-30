"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Settings,
  User,
  Lock,
  Trash2,
  Eye,
  EyeOff,
  Check,
  Copy,
  UserPlus,
  TrendingUp,
  Target,
  BarChart3,
  Calendar,
  DollarSign,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DeleteAccountModal } from "./delete-account-modal";
import { FilteredResponseModal } from "./filtered-response-modal";
import { AgentVerificationModal } from "./agent-verification-modal";
import { useIsMobile } from "../hooks/use-mobile";
import { authAPI, chatAPI, userAPI } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import graph from "../../public/Image/graph.svg";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab =
  | "general"
  | "personalization"

  | "password"
  | "delete"
  | "invite"
  | "Landlord/agent";
export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { logout, user } = useAuth();

  // Consolidated state management
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  
  // Password change state
  const [passwordState, setPasswordState] = useState({
    isChanging: false,
    showOld: false,
    showNew: false,
    showConfirm: false,
    form: { old_password: "", new_password1: "", new_password2: "" }
  });

  // Modal states
  const [modalStates, setModalStates] = useState({
    showDeleteAccount: false,
    showFilteredResponse: false,
    showVerification: false
  });

  // Feature states
  const [featureStates, setFeatureStates] = useState({
    filteredResponseEnabled: false,
    memoryEnabled: false,
    selectedRole: null as string | null
  });

  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    isDeletingAllChats: false,
    isVerificationLoading: false
  });

  // Referral data (memoized for better performance)
  const referralData = useMemo(() => ({
    code: "FL3598KJ",
    points: 5,
    users: 5
  }), []);

  const [copied, setCopied] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "none" | "pending" | "verified" | "rejected"
  >("none");

  // Optimized verification status determination
  const determineVerificationStatus = useCallback((userData: any) => {
    // Check agent_info.status from the backend response (new structure)
    if (userData?.agent_info?.status) {
      const agentStatus = userData.agent_info.status;
      return agentStatus === "pending" ? "pending" :
             agentStatus === "approved" ? "verified" :
             agentStatus === "rejected" ? "rejected" : "none";
    }
    
    // Fallback to legacy agent_request structure
    if (userData?.agent_request?.status) {
      const agentStatus = userData.agent_request.status;
      return agentStatus === "pending" ? "pending" :
             agentStatus === "approved" ? "verified" :
             agentStatus === "rejected" ? "rejected" : "none";
    }
    
    // Fallback to verification_status field
    if (userData?.verification_status) {
      return userData.verification_status;
    }
    
    return "none";
  }, []);

  // Memoized verification status fetch
  const fetchVerificationStatus = useCallback(async () => {
    if (!user?.id) {
      setVerificationStatus("none");
      return;
    }

    // First, try to use local user data to avoid slow API call
    const localStatus = determineVerificationStatus(user);
    setVerificationStatus(localStatus);

    // Only fetch from API if we don't have agent_info or agent_request in local user data
    if (!user.agent_info && !user.agent_request) {
      setLoadingStates(prev => ({ ...prev, isVerificationLoading: true }));

      try {
        const userData = await userAPI.getProfile();
        const status = determineVerificationStatus(userData);
        setVerificationStatus(status);
      } catch (error) {
        console.error("Failed to fetch verification status:", error);
        // Keep using local status on error
      } finally {
        setLoadingStates(prev => ({ ...prev, isVerificationLoading: false }));
      }
    }
  }, [user?.id, user, determineVerificationStatus]);

  // Optimized useEffect for verification status
  useEffect(() => {
    if (isOpen && activeTab === "Landlord/agent" && user?.id) {
      fetchVerificationStatus();
    } else if (user) {
      // Update verification status from local user data when user changes
      const status = determineVerificationStatus(user);
      setVerificationStatus(status);
    }
  }, [isOpen, activeTab, user?.id, user, fetchVerificationStatus, determineVerificationStatus]);

  // Memoized event handlers
  const handleRoleSelect = useCallback((role: string, preferences: unknown) => {
    setFeatureStates(prev => ({
      ...prev,
      selectedRole: role,
      filteredResponseEnabled: true
    }));
  }, []);

  const copyReferralCode = useCallback(() => {
    navigator.clipboard.writeText(referralData.code);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  }, [referralData.code]);

  // Memoized action handlers
  const deleteAllSessions = useCallback(async () => {
    setLoadingStates(prev => ({ ...prev, isDeletingAllChats: true }));
    try {
      await chatAPI.deleteAllChatSessions();
      toast({
        title: "Success",
        description: "All chat sessions have been deleted successfully",
      });
    } catch (error: unknown) {
      console.error("Delete all chat sessions error:", error);
      const errorMessage = (error && typeof error === "object" && "detail" in error) 
        ? (error as { detail?: string }).detail || "Failed to delete all chat sessions"
        : "Failed to delete all chat sessions";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, isDeletingAllChats: false }));
    }
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    onClose();
  }, [logout, onClose]);

  const handleMemoryToggle = useCallback(() => {
    setFeatureStates(prev => {
      const newMemoryEnabled = !prev.memoryEnabled;
      toast({
        title: "Memory setting updated",
        description: `Memory has been turned ${newMemoryEnabled ? "on" : "off"}`,
      });
      return { ...prev, memoryEnabled: newMemoryEnabled };
    });
  }, []);

  const handleRequestVerification = useCallback(() => {
    setModalStates(prev => ({ ...prev, showVerification: true }));
  }, []);

  const handleVerificationSuccess = async (data?: {
    phone?: string;
    verification_document?: File | string;
  }) => {
    try {
      // Import landlordAPI dynamically to avoid circular dependency
      const { landlordAPI } = await import("@/lib/api");

      // Submit the agent request using landlordAPI.postAgentRequest
      const payload = {
        phone: data?.phone || "",
        verification_document: data?.verification_document
          ? typeof data.verification_document === "string"
            ? data.verification_document
            : ""
          : "",
      };

      await landlordAPI.postAgentRequest(payload);

      // Update the local verification status
      setVerificationStatus("pending");

      toast({
        title: "Success",
        description: "Agent verification request submitted successfully",
      });
    } catch (error: unknown) {
      console.error("Failed to submit agent request:", error);
      let errorMessage = "Failed to submit verification request";
      if (error && typeof error === "object" && "response" in error) {
        const responseError = error as {
          response?: { data?: { detail?: string } };
        };
        errorMessage = responseError.response?.data?.detail || errorMessage;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handlePasswordChange = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { old_password, new_password1, new_password2 } = passwordState.form;

    if (!old_password) {
      toast({
        title: "Error",
        description: "Please enter your current password",
        variant: "destructive",
      });
      return;
    }

    if (new_password1 !== new_password2) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (new_password1.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      await authAPI.passwordChange(old_password, new_password1);

      toast({
        title: "Success",
        description: "Password has been changed successfully",
      });
      
      setPasswordState({
        isChanging: false,
        showOld: false,
        showNew: false,
        showConfirm: false,
        form: { old_password: "", new_password1: "", new_password2: "" }
      });
    } catch (error: unknown) {
      console.error("Password change error:", error);
      const errorMessage = (error && typeof error === "object" && "detail" in error)
        ? (error as { detail?: string }).detail || "Failed to change password"
        : "Failed to change password";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [passwordState.form]);

  // Memoized tabs configuration
  const tabs = useMemo(() => [
    { id: "general" as const, label: "General", icon: Settings },
    // { id: "personalization" as const, label: "Personalization", icon: User },
    // { id: "growth" as const, label: "Growth & Sales", icon: UserPlus },
    { id: "Landlord/agent" as const, label: "Landlord/agent", icon: UserPlus },
    { id: "password" as const, label: "Password", icon: Lock },
    { id: "delete" as const, label: "Delete Account", icon: Trash2 },
  ], []);

  return (
    <>
      <Dialog
        open={isOpen}
        modal={!modalStates.showVerification}
        onOpenChange={(open) => {
          if (!open && !modalStates.showVerification) {
            onClose();
          }
        }}
      >
        <DialogContent
          className="max-w-2xl gap-0 p-0 bg-[#262626] border-zinc-800 w-[95vw] sm:w-[90vw] md:w-[85vw] lg:max-w-2xl"
          onPointerDownOutside={(event) => {
            if (modalStates.showVerification) {
              event.preventDefault();
            }
          }}
          onInteractOutside={(event) => {
            if (modalStates.showVerification) {
              event.preventDefault();
            }
          }}
        >
          <DialogHeader className="p-3 border-b sm:p-4 border-zinc-800">
            <DialogTitle className="text-base font-normal text-white sm:text-lg">
              {passwordState.isChanging ? "Password" : "Settings"}
            </DialogTitle>
          </DialogHeader>

          {/* Mobile Tabs - Only show when not changing password */}
          {isMobile && !passwordState.isChanging && (
            <div className="grid items-center grid-cols-2 px-2 border-b border-zinc-800">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-1 px-3 py-3 text-xs whitespace-nowrap text-zinc-400 hover:bg-zinc-800/50",
                      activeTab === tab.id &&
                        "bg-[#3B3B3B] text-white rounded-[10px]"
                    )}
                  >
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-[15px]">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div
            className={cn(
              "flex",
              isMobile ? "flex-col" : "h-[400px] sm:h-[450px] md:h-[500px]"
            )}
          >
            {/* Sidebar - Hide on mobile and when changing password */}
            {!isMobile && !passwordState.isChanging && (
              <div className="border-r w-36 sm:w-40 md:w-48 border-zinc-800">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center gap-2 w-full px-3 sm:px-4 py-2 text-xs sm:text-sm text-zinc-400 hover:bg-zinc-800/50",
                        activeTab === tab.id && "bg-zinc-800/50 text-white"
                      )}
                    >
                      <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto max-h-[70vh] sm:max-h-[500px]">
              {activeTab === "delete" && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="space-y-2 sm:space-y-4">
                    <h3 className="text-base font-medium text-white sm:text-lg">
                      Delete Account
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-400">
                      Once you delete your account, there is no going back.
                      Please be certain.
                    </p>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-0">
                      <div>
                        <h4 className="text-xs font-medium text-white sm:text-sm">
                          Delete all chats
                        </h4>
                        <p className="text-xs text-zinc-400">
                          This will permanently delete all your conversations
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size={isMobile ? "sm" : "default"}
                        className="self-end sm:self-auto"
                        onClick={deleteAllSessions}
                        disabled={loadingStates.isDeletingAllChats}
                      >
                        {loadingStates.isDeletingAllChats ? "Deleting..." : "Delete all"}
                      </Button>
                    </div>

                    <div className="border-t border-zinc-800" />

                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-0">
                      <div className="max-w-[50vw]">
                        <h4 className="text-xs font-medium text-white sm:text-sm">
                          Delete account
                        </h4>
                        <p className="text-xs text-zinc-400 ">
                          Permanently delete your account and all <br />{" "}
                          associated data
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size={isMobile ? "sm" : "default"}
                        className="self-end sm:self-auto"
                        onClick={() => setModalStates(prev => ({ ...prev, showDeleteAccount: true }))}
                      >
                        Delete account
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {passwordState.isChanging ? (
                <form
                  onSubmit={handlePasswordChange}
                  className="space-y-3 sm:space-y-4"
                >
                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm text-zinc-400">
                      Current Password
                    </label>
                    <div className="relative">
                      <Input
                        type={passwordState.showOld ? "text" : "password"}
                        value={passwordState.form.old_password}
                        onChange={(e) =>
                          setPasswordState((prev) => ({
                            ...prev,
                            form: { ...prev.form, old_password: e.target.value }
                          }))
                        }
                        className="pr-10 text-xs text-white bg-zinc-800/50 border-zinc-700 sm:text-sm"
                        placeholder="Enter current password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setPasswordState(prev => ({ ...prev, showOld: !prev.showOld }))}
                        className="absolute -translate-y-1/2 right-3 top-1/2 text-zinc-400 hover:text-zinc-300"
                      >
                        {passwordState.showOld ? (
                          <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                        ) : (
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm text-zinc-400">
                      New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={passwordState.showNew ? "text" : "password"}
                        value={passwordState.form.new_password1}
                        onChange={(e) =>
                          setPasswordState((prev) => ({
                            ...prev,
                            form: { ...prev.form, new_password1: e.target.value }
                          }))
                        }
                        className="pr-10 text-xs text-white bg-zinc-800/50 border-zinc-700 sm:text-sm"
                        placeholder="Enter new password"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setPasswordState(prev => ({ ...prev, showNew: !prev.showNew }))}
                        className="absolute -translate-y-1/2 right-3 top-1/2 text-zinc-400 hover:text-zinc-300"
                      >
                        {passwordState.showNew ? (
                          <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                        ) : (
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Password must be at least 8 characters long
                    </p>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm text-zinc-400">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Input
                        type={passwordState.showConfirm ? "text" : "password"}
                        value={passwordState.form.new_password2}
                        onChange={(e) =>
                          setPasswordState((prev) => ({
                            ...prev,
                            form: { ...prev.form, new_password2: e.target.value }
                          }))
                        }
                        className="pr-10 text-xs text-white bg-zinc-800/50 border-zinc-700 sm:text-sm"
                        placeholder="Confirm new password"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPasswordState(prev => ({ ...prev, showConfirm: !prev.showConfirm }))
                        }
                        className="absolute -translate-y-1/2 right-3 top-1/2 text-zinc-400 hover:text-zinc-300"
                      >
                        {passwordState.showConfirm ? (
                          <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                        ) : (
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 sm:gap-3 sm:pt-4">
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-yellow-500 to-pink-500 hover:from-yellow-600 hover:to-pink-600 text-white rounded-[10px] text-xs sm:text-sm"
                      disabled={
                        !passwordState.form.old_password ||
                        !passwordState.form.new_password1 ||
                        !passwordState.form.new_password2
                      }
                    >
                      Change Password
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setPasswordState({
                          isChanging: false,
                          showOld: false,
                          showNew: false,
                          showConfirm: false,
                          form: { old_password: "", new_password1: "", new_password2: "" }
                        });
                      }}
                      className="flex-1 border-zinc-700 hover:bg-zinc-800 text-zinc-400 rounded-[10px] text-xs sm:text-sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  {activeTab === "general" && (
                    <div className="space-y-4 sm:space-y-6">
                      {/* <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-zinc-400">Theme</span>
                        <Select value={theme} onValueChange={setTheme}>
                          <SelectTrigger className="h-8 text-xs w-28 sm:w-32 border-zinc-700 text-zinc-400 sm:text-sm sm:h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="text-xs text-white/25 bg-zinc-900 sm:text-sm">
                            <SelectItem value="system">System</SelectItem>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                          </SelectContent>
                        </Select>
                      </div> */}
                      {/* <div className="border-b-[0.1px]"></div> */}

                      {/* <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-zinc-400">Language</span>
                        <Select value={language} onValueChange={setLanguage}>
                          <SelectTrigger className="h-8 text-xs w-28 sm:w-32 text-zinc-400 border-zinc-700 sm:text-sm sm:h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="text-xs text-white/25 bg-zinc-900 sm:text-sm">
                            <SelectItem value="auto-english" className="text-xs">Auto-English</SelectItem>
                            <SelectItem value="english">English</SelectItem>
                            <SelectItem value="spanish">Spanish</SelectItem>
                            <SelectItem value="french">French</SelectItem>
                          </SelectContent>
                        </Select>
                      </div> */}
                      <div className="border-b-[0.1px]"></div>

                      <div className="space-y-4">
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-0">
                          <span className="text-xs sm:text-sm text-zinc-400">
                            Delete all chats
                          </span>
                          <Button
                            onClick={deleteAllSessions}
                            disabled={loadingStates.isDeletingAllChats}
                            className="p-1 sm:p-2 rounded-[10px] bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm h-8 sm:h-auto self-end sm:self-auto"
                          >
                            {loadingStates.isDeletingAllChats ? "Deleting..." : "Delete all"}
                          </Button>
                        </div>
                        <div className="border-b-[0.1px]"></div>

                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-0">
                          <span className="text-xs sm:text-sm text-zinc-400">
                            Log out on this device
                          </span>
                          <Button
                            onClick={handleLogout}
                            className="p-1 sm:p-2 rounded-[10px] bg-transparent border border-zinc-600 hover:bg-zinc-800 text-white/90 text-xs sm:text-sm h-8 sm:h-auto self-end sm:self-auto"
                          >
                            Log out
                          </Button>
                        </div>
                        <div className="border-b-[0.1px]"></div>

                        {/* Sales Boost Section */}
                      
                      </div>
                    </div>
                  )}

                  {activeTab === "personalization" && (
                    <div className="space-y-4 sm:space-y-6">
                      {/* Filtered Response */}
                      <button
                        onClick={() => setModalStates(prev => ({ ...prev, showFilteredResponse: true }))}
                        className="flex items-center justify-between w-full px-3 py-2 text-left transition rounded-lg sm:px-4 sm:py-3 bg-zinc-800/50 hover:bg-zinc-700"
                      >
                        <div className="space-y-1">
                          <span className="text-xs sm:text-sm text-zinc-300">
                            Filtered response
                          </span>
                          {featureStates.selectedRole ? (
                            <p className="text-xs capitalize text-zinc-500">
                              Role: {featureStates.selectedRole}
                            </p>
                          ) : (
                            <p className="text-xs text-zinc-500">
                              Select your role
                            </p>
                          )}
                        </div>
                        <div
                          className={`px-2 sm:px-3 py-1 rounded-full text-xs ${
                            featureStates.filteredResponseEnabled
                              ? "bg-gradient-to-r from-yellow-500 to-pink-500 text-white"
                              : "bg-zinc-700 text-zinc-400"
                          }`}
                        >
                          {featureStates.filteredResponseEnabled ? "On" : "Off"}
                        </div>
                      </button>

                      {/* Memory */}
                      <button
                        onClick={handleMemoryToggle}
                        className="flex items-center justify-between w-full px-3 py-2 text-left transition rounded-lg sm:px-4 sm:py-3 bg-zinc-800/50 hover:bg-zinc-700"
                      >
                        <div className="space-y-1">
                          <span className="text-xs sm:text-sm text-zinc-300">
                            Memory
                          </span>
                          <p className="text-xs text-zinc-500">
                            Remember preferences and history
                          </p>
                        </div>
                        <div
                          className={`px-2 py-1 text-xs rounded-full sm:px-3 ${
                            featureStates.memoryEnabled
                              ? "bg-gradient-to-r from-yellow-500 to-pink-500 text-white"
                              : "bg-zinc-700 text-zinc-400"
                          }`}
                        >
                          {featureStates.memoryEnabled ? "On" : "Off"}
                        </div>
                      </button>

                      {/* Information Box */}
                      <div className="p-3 border rounded-lg sm:p-4 border-blue-600/30 bg-blue-600/10">
                        <p className="mb-2 text-xs text-blue-400 sm:mb-3">
                          I understand your preferences, typing style, and
                          interests to provide more accurate and personalized
                          insights.
                        </p>
                        <p className="mb-2 text-xs text-blue-400 sm:mb-3">
                          Remember key Preferences, typing style, and what a
                          property means to you. Understand your requirements
                          better.
                        </p>
                        <p className="mb-2 text-xs text-blue-400 sm:mb-3">
                          Understand key factors based on feedback, reviews, and
                          past interactions.
                        </p>
                        <p className="text-xs text-blue-400">
                          You can change or clear your memory settings anytime
                          in your settings. Your data is private and secure.
                        </p>
                      </div>
                    </div>
                  )}


                  {activeTab === "Landlord/agent" && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-base font-medium text-white sm:text-lg">
                          Landlord/Agent Verification
                        </h3>
                        <p className="text-xs sm:text-sm text-zinc-400">
                          Become a verified landlord or agent to list your
                          properties and gain access to advanced features.
                        </p>

                        {/* Verification Status & Request Button */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[16px] text-white">
                              Verification Status:
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                verificationStatus === "pending"
                                  ? "bg-yellow-600/20 text-yellow-400 border border-yellow-600/30"
                                  : verificationStatus === "verified"
                                  ? "bg-green-600/20 text-green-400 border border-green-600/30"
                                  : verificationStatus === "rejected"
                                  ? "bg-red-600/20 text-red-400 border border-red-600/30"
                                  : "bg-zinc-600/20 text-zinc-400 border border-zinc-600/30"
                              }`}
                            >
                              {verificationStatus === "pending"
                                ? "Pending Review"
                                : verificationStatus === "verified"
                                ? "Verified"
                                : verificationStatus === "rejected"
                                ? "Rejected"
                                : "Not Submitted"}
                            </span>
                          </div>

                          {verificationStatus === "none" && (
                            <button
                              onClick={handleRequestVerification}
                              className="underline text-[16px] text-white hover:text-zinc-300"
                            >
                              Submit Request
                            </button>
                          )}

                          {verificationStatus === "rejected" && (
                            <button
                              onClick={handleRequestVerification}
                              className="underline text-[16px] text-white hover:text-zinc-300"
                            >
                              Submit Again
                            </button>
                          )}
                        </div>

                        {/* Show agent request details if exists */}
                        {(user?.agent_info || user?.agent_request) && (
                          <div className="p-3 border rounded-[10px] sm:p-4 border-[#383838] bg-[#303030]">
                            <h4 className="mb-2 text-sm font-medium text-white">
                              Request Details:
                            </h4>
                            <div className="space-y-1 text-xs text-zinc-300">
                              {user?.agent_info ? (
                                // Use new agent_info structure
                                <>
                                  <p>
                                    <span className="text-zinc-400">
                                      Submitted:
                                    </span>{" "}
                                    {new Date(
                                      user.agent_info.request_date
                                    ).toLocaleDateString()}
                                  </p>
                                  {user.agent_info.phone && (
                                    <p>
                                      <span className="text-zinc-400">
                                        Phone:
                                      </span>{" "}
                                      {user.agent_info.phone}
                                    </p>
                                  )}
                                  <p>
                                    <span className="text-zinc-400">
                                      Status:
                                    </span>{" "}
                                    {user.agent_info.status}
                                  </p>
                                </>
                              ) : (
                                // Fallback to legacy agent_request structure
                                <>
                                  <p>
                                    <span className="text-zinc-400">
                                      Submitted:
                                    </span>{" "}
                                    {new Date(
                                      user.agent_request!.created_at
                                    ).toLocaleDateString()}
                                  </p>
                                  {user.agent_request!.phone && (
                                    <p>
                                      <span className="text-zinc-400">
                                        Phone:
                                      </span>{" "}
                                      {user.agent_request!.phone}
                                    </p>
                                  )}
                                  <p>
                                    <span className="text-zinc-400">
                                      Status:
                                    </span>{" "}
                                    {user.agent_request!.status}
                                  </p>
                                  {user.agent_request!.updated_at !==
                                    user.agent_request!.created_at && (
                                    <p>
                                      <span className="text-zinc-400">
                                        Last Updated:
                                      </span>{" "}
                                      {new Date(
                                        user.agent_request!.updated_at
                                      ).toLocaleDateString()}
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Benefits Section */}
                        <div className="flex flex-col gap-3 p-3 border rounded-[10px] sm:p-4 border-[#383838] bg-[#303030] text-[14px]">
                          <h4 className="mb-2 text-sm font-medium text-white">
                            Verification Benefits:
                          </h4>

                          <div className="flex items-start gap-2">
                            <Image
                              src={graph}
                              alt="Graph"
                              className="w-[16px] h-[16px] mt-0.5"
                            />
                            <p className="text-zinc-300">
                              Priority listing placement
                            </p>
                          </div>

                          <div className="flex items-start gap-2">
                            <Image
                              src={graph}
                              alt="Graph"
                              className="w-[16px] h-[16px] mt-0.5"
                            />
                            <p className="text-zinc-300">
                              Verified badge for trust building
                            </p>
                          </div>

                          <div className="flex items-start gap-2">
                            <Image
                              src={graph}
                              alt="Graph"
                              className="w-[16px] h-[16px] mt-0.5"
                            />
                            <p className="text-zinc-300">
                              Get more bookings & sales
                            </p>
                          </div>

                          <div className="flex items-start gap-2">
                            <Image
                              src={graph}
                              alt="Graph"
                              className="w-[16px] h-[16px] mt-0.5"
                            />
                            <p className="text-zinc-300">
                              Advanced analytics and insights
                            </p>
                          </div>
                        </div>

                        {/* Status Information */}
                        {verificationStatus === "pending" && (
                          <div className="p-3 border rounded-lg sm:p-4 border-yellow-600/30 bg-yellow-600/10">
                            <p className="text-xs text-yellow-400">
                              Your verification request is being reviewed.
                              We&apos;ll notify you within 2-3 business days.
                              You&apos;ll receive an email once the review is
                              complete.
                            </p>
                          </div>
                        )}

                        {verificationStatus === "verified" && (
                          <div className="p-3 border rounded-lg sm:p-4 border-green-600/30 bg-green-600/10">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="mb-2 text-xs text-green-400">
                                  Congratulations! You are now a verified
                                  landlord/agent. You can now list properties
                                  and access all premium features.
                                </p>
                              </div>
                              <Button
                                type="button"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onClose();

                                  // Refresh user data to get latest verification status
                                  try {
                                    await userAPI.getProfile();
                                  } catch (error) {
                                    console.error(
                                      "Failed to refresh user data:",
                                      error
                                    );
                                  }

                                  // Small delay to ensure modal closes and data refreshes before navigation
                                  setTimeout(() => {
                                    try {
                                      router.push("/dashboard");
                                    } catch (error) {
                                      console.error("Navigation error:", error);
                                      // Fallback to window.location
                                      window.location.href = "/dashboard";
                                    }
                                  }, 200);
                                }}
                                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-[10px] text-xs sm:text-sm px-4 py-2 whitespace-nowrap"
                              >
                                Go to Dashboard
                              </Button>
                            </div>
                          </div>
                        )}

                        {verificationStatus === "rejected" && (
                          <div className="p-3 border rounded-lg sm:p-4 border-red-600/30 bg-red-600/10">
                            <p className="text-xs text-red-400">
                              Your verification request was not approved. Please
                              contact support for more information or to submit
                              additional documentation.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "invite" && (
                    <div className="space-y-6">
                      <div className="flex flex-col items-center justify-center mb-6">
                        <div className="mb-1 text-4xl font-bold text-white">
                          {referralData.points.toString().padStart(2, "0")}
                        </div>
                        <div className="text-sm text-zinc-400">
                          Referral Points Earned
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-zinc-400">
                          Share your referral link
                        </label>
                        <div className="relative">
                          <Input
                            value={referralData.code}
                            readOnly
                            className="pr-10 text-white bg-zinc-800/50 border-zinc-700"
                          />
                          <button
                            type="button"
                            onClick={copyReferralCode}
                            className="absolute -translate-y-1/2 right-3 top-1/2 text-zinc-400 hover:text-zinc-300"
                          >
                            {copied ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="text-sm text-zinc-400">
                        Invite your friends and earn rewards! For every friend
                        that signs up and purchases tokens using your referral
                        link, you both get 5 free tokens. The more you share,
                        the more you earn!
                      </div>

                      <div className="mt-6 space-y-2">
                        <label className="text-sm text-zinc-400">
                          Number of People Who Used the Link
                        </label>
                        <div className="flex items-center justify-center w-16 h-10 text-white border rounded-md bg-zinc-800/50 border-zinc-700">
                          {referralData.users.toString().padStart(2, "0")}
                        </div>
                      </div>

                      <div className="p-4 mt-6 border rounded-lg border-yellow-600/30 bg-yellow-600/10">
                        <p className="text-xs text-yellow-400">
                          Share your referral link on social media or directly
                          with friends to maximize your rewards. Each successful
                          referral helps both you and your friend!
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === "password" && (
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-0">
                      <span className="text-xs sm:text-sm text-zinc-400">
                        Change Password
                      </span>
                      <Button
                        onClick={() => setPasswordState(prev => ({ ...prev, isChanging: true }))}
                        className="p-1 sm:p-2 rounded-[10px] bg-transparent border border-zinc-600 hover:bg-zinc-800 text-white/90 text-xs sm:text-sm h-8 sm:h-auto self-end sm:self-auto"
                      >
                        Change
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteAccountModal
        isOpen={modalStates.showDeleteAccount}
        onClose={() => setModalStates(prev => ({ ...prev, showDeleteAccount: false }))}
      />
      <FilteredResponseModal
        isOpen={modalStates.showFilteredResponse}
        onClose={() => setModalStates(prev => ({ ...prev, showFilteredResponse: false }))}
        onSelect={handleRoleSelect}
      />
      <AgentVerificationModal
        isOpen={modalStates.showVerification}
        onClose={() => setModalStates(prev => ({ ...prev, showVerification: false }))}
        onSuccess={handleVerificationSuccess}
      />
    </>
  );
}
