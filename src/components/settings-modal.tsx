"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Settings, User, Lock, Trash2, Eye, EyeOff } from "lucide-react"
import { Switch } from "./ui/switch"
import { toast } from "@/components/ui/use-toast"

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
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
            {/* Password Change Form */}
            {isChangingPassword ? (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Current Password</label>
                  <div className="relative pl-">
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
                      {showCurrentPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
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
                      {showNewPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
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
                      {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    className="flex bg-gradient-to-r from-yellow-500 to-pink-500 hover:from-yellow-600 hover:to-pink-600 text-white rounded-[10px] w-2/3"
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
                    <div className="flex items-center justify-between px-4 py-2 transition rounded-lg bg-zinc-800/50 hover:bg-zinc-700">
                      <span className="text-sm text-zinc-300">Filtered response</span>
                      <Switch
                        checked={true}
                        className="data-[state=unchecked]:bg-gray-600 data-[state=checked]:bg-blue-600"
                      />
                    </div>

                    {/* Memory */}
                    <div className="flex items-center justify-between px-4 py-2 transition rounded-lg bg-zinc-800/50 hover:bg-zinc-700">
                      <span className="text-sm text-zinc-300">Memory</span>
                      <Switch
                        checked={true}
                        className="data-[state=unchecked]:bg-gray-600 data-[state=checked]:bg-blue-600"
                      />
                    </div>

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
                        You can change or clear your memory settings anytime in your settings. Your data is private and
                        secure.
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

                {activeTab === "delete" && <div className="text-sm text-zinc-400">Delete account settings</div>}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

