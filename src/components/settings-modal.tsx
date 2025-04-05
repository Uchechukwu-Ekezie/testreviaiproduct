"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Settings, User, Lock, Trash2, Eye, EyeOff, Share, Check, Copy } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { DeleteAccountModal } from "./delete-account-modal"
import { FilteredResponseModal } from "./filtered-response-modal"
import { useIsMobile } from "../hooks/use-mobile"
import { authAPI } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type SettingsTab = "general" | "personalization" | "password" | "delete" | "invite"

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState<SettingsTab>("general")
  // const [theme, setTheme] = useState("system")
  // const [language, setLanguage] = useState("auto-english")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    new_password1: "",
    new_password2: "",
  })
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [showFilteredResponse, setShowFilteredResponse] = useState(false)
  const [filteredResponseEnabled, setFilteredResponseEnabled] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [referralCode] = useState("FL3598KJ")
  const [referralPoints] = useState(5)
  const [referralUsers] = useState(5)
  const [copied, setCopied] = useState(false)
  const {  logout } = useAuth()

  // const handleFilteredResponseToggle = (checked: boolean) => {
  //   if (checked) {
  //     setShowFilteredResponse(true)
  //   } else {
  //     setFilteredResponseEnabled(false)
  //     setSelectedRole(null)
  //   }
  // }


  const handleRoleSelect = (role: string) => {
    setSelectedRole(role)
    setFilteredResponseEnabled(true)
  }
  
  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }


  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (passwordForm.new_password1 !== passwordForm.new_password2) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    try {
      await authAPI.passwordChange(
        passwordForm.new_password1,
        passwordForm.new_password2
      );

      toast({
        title: "Success",
        description: "Password has been changed successfully",
      });
      setIsChangingPassword(false);
      setPasswordForm({
        new_password1: "",
        new_password2: "",
      });
    } catch (error: any) {
      console.error("Password change error:", error);
      const errorMessage = error.detail || "Failed to change password";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const tabs = [
    { id: "general" as const, label: "General", icon: Settings },
    { id: "personalization" as const, label: "Personalization", icon: User },
    { id: "invite" as const, label: "Invite & Earn", icon: Share },
    { id: "password" as const, label: "Password", icon: Lock },
    { id: "delete" as const, label: "Delete Account", icon: Trash2 },
  ]

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl gap-0 p-0 bg-[#262626] border-zinc-800 w-[95vw] sm:w-[90vw] md:w-[85vw] lg:max-w-2xl">
          <DialogHeader className="p-3 border-b sm:p-4 border-zinc-800">
            <DialogTitle className="text-base font-normal text-white sm:text-lg">
              {isChangingPassword ? "Password" : "Settings"}
            </DialogTitle>
          </DialogHeader>

          {/* Mobile Tabs - Only show when not changing password */}
          {isMobile && !isChangingPassword && (
            <div className="grid items-center grid-cols-2 px-2 border-b border-zinc-800">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-3 text-xs whitespace-nowrap text-zinc-400 hover:bg-zinc-800/50",
                    activeTab === tab.id && "bg-[#3B3B3B] text-white rounded-[10px]",
                  )}
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-[15px]">{tab.label}</span>
                </button>
                )
              })}
            </div>
          )}

          <div className={cn("flex", isMobile ? "flex-col" : "h-[400px] sm:h-[450px] md:h-[500px]")}>
            {/* Sidebar - Hide on mobile and when changing password */}
            {!isMobile && !isChangingPassword && (
              <div className="border-r w-36 sm:w-40 md:w-48 border-zinc-800">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center gap-2 w-full px-3 sm:px-4 py-2 text-xs sm:text-sm text-zinc-400 hover:bg-zinc-800/50",
                        activeTab === tab.id && "bg-zinc-800/50 text-white",
                      )}
                    >
                      <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto max-h-[70vh] sm:max-h-[500px]">
              {activeTab === "delete" && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="space-y-2 sm:space-y-4">
                    <h3 className="text-base font-medium text-white sm:text-lg">Delete Account</h3>
                    <p className="text-xs sm:text-sm text-zinc-400">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-0">
                      <div>
                        <h4 className="text-xs font-medium text-white sm:text-sm">Delete all chats</h4>
                        <p className="text-xs text-zinc-400">This will permanently delete all your conversations</p>
                      </div>
                      <Button
                        variant="destructive"
                        size={isMobile ? "sm" : "default"}
                        className="self-end sm:self-auto"
                        onClick={() => {
                          toast({
                            title: "Chats deleted",
                            description: "All your chats have been deleted.",
                          })
                        }}
                      >
                        Delete all
                      </Button>
                    </div>

                    <div className="border-t border-zinc-800" />

                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-0">
                      <div>
                        <h4 className="text-xs font-medium text-white sm:text-sm">Delete account</h4>
                        <p className="text-xs text-zinc-400">Permanently delete your account and all associated data</p>
                      </div>
                      <Button
                        variant="destructive"
                        size={isMobile ? "sm" : "default"}
                        className="self-end sm:self-auto"
                        onClick={() => setShowDeleteAccount(true)}
                      >
                        Delete account
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {isChangingPassword ? (
                <form onSubmit={handlePasswordChange} className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm text-zinc-400">New Password</label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.new_password1}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password1: e.target.value }))}
                        className="pr-10 text-xs text-white bg-zinc-800/50 border-zinc-700 sm:text-sm"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute -translate-y-1/2 right-3 top-1/2 text-zinc-400 hover:text-zinc-300"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                        ) : (
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm text-zinc-400">Confirm Password</label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordForm.new_password2}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password2: e.target.value }))}
                        className="pr-10 text-xs text-white bg-zinc-800/50 border-zinc-700 sm:text-sm"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute -translate-y-1/2 right-3 top-1/2 text-zinc-400 hover:text-zinc-300"
                      >
                        {showConfirmPassword ? (
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
                    >
                      Change
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsChangingPassword(false)
                        setPasswordForm({
                          new_password1: "",
                          new_password2: "",
                        })
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
                          <span className="text-xs sm:text-sm text-zinc-400">Delete all chats</span>
                          <Button className="p-1 sm:p-2 rounded-[10px] bg-red-600 text-white/90 text-xs sm:text-sm h-8 sm:h-auto self-end sm:self-auto">
                            Delete all
                          </Button>
                        </div>
                        <div className="border-b-[0.1px]"></div>

                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-0">
                          <span className="text-xs sm:text-sm text-zinc-400">Log out on this device</span>
                          <Button
                          onClick={logout} className="p-1 sm:p-2 rounded-[10px] bg-transparent border border-zinc-600 text-white/90 text-xs sm:text-sm h-8 sm:h-auto self-end sm:self-auto">
                            Log out
                          </Button>
                        </div>
                        <div className="border-b-[0.1px]"></div>
                      </div>
                    </div>
                  )}

                  {activeTab === "personalization" && (
                    <div className="space-y-4 sm:space-y-6">
                      {/* Filtered Response */}
                      <button
                        onClick={() => setShowFilteredResponse(true)}
                        className="flex items-center justify-between w-full px-3 py-2 text-left transition rounded-lg sm:px-4 sm:py-3 bg-zinc-800/50 hover:bg-zinc-700"
                      >
                        <div className="space-y-1">
                          <span className="text-xs sm:text-sm text-zinc-300">Filtered response</span>
                          {selectedRole ? (
                            <p className="text-xs capitalize text-zinc-500">Role: {selectedRole}</p>
                          ) : (
                            <p className="text-xs text-zinc-500">Select your role</p>
                          )}
                        </div>
                        <div
                          className={`px-2 sm:px-3 py-1 rounded-full text-xs ${
                            filteredResponseEnabled
                              ? "bg-gradient-to-r from-yellow-500 to-pink-500 text-white"
                              : "bg-zinc-700 text-zinc-400"
                          }`}
                        >
                          {filteredResponseEnabled ? "On" : "Off"}
                        </div>
                      </button>

                      {/* Memory */}
                      <button
                        onClick={() => {
                          // Toggle memory option
                          toast({
                            title: "Memory setting updated",
                            description: "Your memory preferences have been updated.",
                          })
                        }}
                        className="flex items-center justify-between w-full px-3 py-2 text-left transition rounded-lg sm:px-4 sm:py-3 bg-zinc-800/50 hover:bg-zinc-700"
                      >
                        <div className="space-y-1">
                          <span className="text-xs sm:text-sm text-zinc-300">Memory</span>
                          <p className="text-xs text-zinc-500">Remember preferences and history</p>
                        </div>
                        <div className="px-2 py-1 text-xs rounded-full sm:px-3 bg-zinc-700 text-zinc-400">Off</div>
                      </button>

                      {/* Information Box */}
                      <div className="p-3 border rounded-lg sm:p-4 border-blue-600/30 bg-blue-600/10">
                        <p className="mb-2 text-xs text-blue-400 sm:mb-3">
                          I understand your preferences, typing style, and interests to provide more accurate and
                          personalized insights.
                        </p>
                        <p className="mb-2 text-xs text-blue-400 sm:mb-3">
                          Remember key Preferences, typing style, and what a property means to you. Understand your
                          requirements better.
                        </p>
                        <p className="mb-2 text-xs text-blue-400 sm:mb-3">
                          Understand key factors based on feedback, reviews, and past interactions.
                        </p>
                        <p className="text-xs text-blue-400">
                          You can change or clear your memory settings anytime in your settings. Your data is private
                          and secure.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === "invite" && (
                    <div className="space-y-6">
                      <div className="flex flex-col items-center justify-center mb-6">
                        <div className="mb-1 text-4xl font-bold text-white">
                          {referralPoints.toString().padStart(2, "0")}
                        </div>
                        <div className="text-sm text-zinc-400">Referral Points Earned</div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-zinc-400">Share your referral link</label>
                        <div className="relative">
                          <Input
                            value={referralCode}
                            readOnly
                            className="pr-10 text-white bg-zinc-800/50 border-zinc-700"
                          />
                          <button
                            type="button"
                            onClick={copyReferralCode}
                            className="absolute -translate-y-1/2 right-3 top-1/2 text-zinc-400 hover:text-zinc-300"
                          >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="text-sm text-zinc-400">
                        Invite your friends and earn rewards! For every friend that signs up and purchases tokens using
                        your referral link, you both get 5 free tokens. The more you share, the more you earn!
                      </div>

                      <div className="mt-6 space-y-2">
                        <label className="text-sm text-zinc-400">Number of People Who Used the Link</label>
                        <div className="flex items-center justify-center w-16 h-10 text-white border rounded-md bg-zinc-800/50 border-zinc-700">
                          {referralUsers.toString().padStart(2, "0")}
                        </div>
                      </div>

                      <div className="p-4 mt-6 border rounded-lg border-yellow-600/30 bg-yellow-600/10">
                        <p className="text-xs text-yellow-400">
                          Share your referral link on social media or directly with friends to maximize your rewards.
                          Each successful referral helps both you and your friend!
                        </p>
                      </div>
                    </div>
                  )}
                  

                  {activeTab === "password" && (
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-0">
                      <span className="text-xs sm:text-sm text-zinc-400">Change Password</span>
                      <Button
                        onClick={() => setIsChangingPassword(true)}
                        className="p-1 sm:p-2 rounded-[10px] bg-transparent border border-zinc-600 text-white/90 text-xs sm:text-sm h-8 sm:h-auto self-end sm:self-auto"
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

      <DeleteAccountModal isOpen={showDeleteAccount} onClose={() => setShowDeleteAccount(false)} />
      <FilteredResponseModal
        isOpen={showFilteredResponse}
        onClose={() => setShowFilteredResponse(false)}
        onSelect={handleRoleSelect}
      />
    </>
  )
}

