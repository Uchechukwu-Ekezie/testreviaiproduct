"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Settings, User, Lock, Trash2, Eye, EyeOff } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { DeleteAccountModal } from "./delete-account-modal"
import { FilteredResponseModal } from "./filtered-response-modal"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type SettingsTab = "general" | "personalization" | "password" | "delete"

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general")
  const [theme, setTheme] = useState("system")
  const [language, setLanguage] = useState("auto-english")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [showFilteredResponse, setShowFilteredResponse] = useState(false)
  const [filteredResponseEnabled, setFilteredResponseEnabled] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)


  const handleRoleSelect = (role: string) => {
    setSelectedRole(role)
    setFilteredResponseEnabled(true)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      })
      return
    }

    try {
      // Here you would typically call your API to change the password
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Success",
        description: "Password has been changed successfully",
      })
      setIsChangingPassword(false)
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive",
      })
    }
  }

  const tabs = [
    { id: "general" as const, label: "General", icon: Settings },
    { id: "personalization" as const, label: "Personalization", icon: User },
    { id: "password" as const, label: "Password", icon: Lock },
    { id: "delete" as const, label: "Delete Account", icon: Trash2 },
  ]

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl gap-0 p-0 bg-[#262626] border-zinc-800">
          <DialogHeader className="p-4 border-b border-zinc-800">
            <DialogTitle className="text-lg font-normal text-white">
              {isChangingPassword ? "Password" : "Settings"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex h-[400px]">
            {/* Sidebar - Hide when changing password */}
            {!isChangingPassword && (
              <div className="w-48 border-r border-zinc-800">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center gap-2 w-full px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800/50",
                        activeTab === tab.id && "bg-zinc-800/50 text-white",
                      )}
                    >
                      <Icon className="w-4 h-4 " />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 p-4">
              {activeTab === "delete" && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Delete Account</h3>
                    <p className="text-sm text-zinc-400">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-white">Delete all chats</h4>
                        <p className="text-xs text-zinc-400">This will permanently delete all your conversations</p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
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

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-white">Delete account</h4>
                        <p className="text-xs text-zinc-400">Permanently delete your account and all associated data</p>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => setShowDeleteAccount(true)}>
                        Delete account
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {isChangingPassword ? (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">Current Password</label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                        className="pr-10 text-white bg-zinc-800/50 border-zinc-700"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute -translate-y-1/2 right-3 top-1/2 text-zinc-400 hover:text-zinc-300"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">New Password</label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                        className="pr-10 text-white bg-zinc-800/50 border-zinc-700"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute -translate-y-1/2 right-3 top-1/2 text-zinc-400 hover:text-zinc-300"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">Confirm Password</label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        className="pr-10 text-white bg-zinc-800/50 border-zinc-700"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute -translate-y-1/2 right-3 top-1/2 text-zinc-400 hover:text-zinc-300"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-yellow-500 to-pink-500 hover:from-yellow-600 hover:to-pink-600 text-white rounded-[10px]"
                    >
                      Change
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsChangingPassword(false)
                        setPasswordForm({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        })
                      }}
                      className="flex-1 border-zinc-700 hover:bg-zinc-800 text-zinc-400 rounded-[10px]"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  {activeTab === "general" && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between ">
                        <span className="text-sm text-zinc-400">Theme</span>
                        <Select value={theme} onValueChange={setTheme}>
                          <SelectTrigger className="w-32 border-zinc-700 text-zinc-400">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="text-white/25 bg-zinc-900">
                            <SelectItem value="system">System</SelectItem>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="border-b-[0.1px]"></div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-400">Language</span>
                        <Select value={language} onValueChange={setLanguage}>
                          <SelectTrigger className="w-32 text-zinc-400 border-zinc-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="text-white/25 bg-zinc-900">
                            <SelectItem value="auto-english">Auto-English</SelectItem>
                            <SelectItem value="english">English</SelectItem>
                            <SelectItem value="spanish">Spanish</SelectItem>
                            <SelectItem value="french">French</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="border-b-[0.1px]"></div>

                      <div className="space-y-4 ">
                        <div className="flex items-center justify-between w-full text-sm text-zinc-400">
                          <span>Delete all chats</span>
                          <Button className="p-2 rounded-[10px] bg-red-600 text-white/90">Delete all</Button>
                        </div>
                        <div className="border-b-[0.1px]"></div>

                        <div className="flex items-center justify-between w-full text-zinc-400 border-zinc-800 hover:bg-zinc-800">
                          Log out on this device
                          <Button className="p-2 rounded-[10px] bg-transparent border border-zinc-600 text-white/90">
                            Log out
                          </Button>
                        </div>
                        <div className="border-b-[0.1px]"></div>
                      </div>
                    </div>
                  )}

                  {activeTab === "personalization" && (
                    <div className="space-y-6">
                      {/* Filtered Response */}
                      <button
                        onClick={() => setShowFilteredResponse(true)}
                        className="flex items-center justify-between w-full px-4 py-3 text-left transition rounded-lg bg-zinc-800/50 hover:bg-zinc-700"
                      >
                        <div className="space-y-1">
                          <span className="text-sm text-zinc-300">Filtered response</span>
                          {selectedRole ? (
                            <p className="text-xs capitalize text-zinc-500">Role: {selectedRole}</p>
                          ) : (
                            <p className="text-xs text-zinc-500">Select your role</p>
                          )}
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-xs ${
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
                        className="flex items-center justify-between w-full px-4 py-3 text-left transition rounded-lg bg-zinc-800/50 hover:bg-zinc-700"
                      >
                        <div className="space-y-1">
                          <span className="text-sm text-zinc-300">Memory</span>
                          <p className="text-xs text-zinc-500">Remember preferences and history</p>
                        </div>
                        <div className="px-3 py-1 text-xs rounded-full bg-zinc-700 text-zinc-400">Off</div>
                      </button>

                      {/* Information Box */}
                      <div className="p-4 border rounded-lg border-blue-600/30 bg-blue-600/10">
                        <p className="mb-3 text-xs text-blue-400">
                          I understand your preferences, typing style, and interests to provide more accurate and
                          personalized insights.
                        </p>
                        <p className="mb-3 text-xs text-blue-400">
                          Remember key Preferences, typing style, and what a property means to you. Understand your
                          requirements better.
                        </p>
                        <p className="mb-3 text-xs text-blue-400">
                          Understand key factors based on feedback, reviews, and past interactions.
                        </p>
                        <p className="text-xs text-blue-400">
                          You can change or clear your memory settings anytime in your settings. Your data is private
                          and secure.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === "password" && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">Change Password</span>
                      <Button
                        onClick={() => setIsChangingPassword(true)}
                        className="p-2 rounded-[10px] bg-transparent border border-zinc-600 text-white/90"
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

