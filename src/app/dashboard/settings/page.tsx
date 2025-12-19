"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

import { authAPI, settingsAPI, userAPI } from "@/lib/api";

interface AgentInfo {
  phone?: string;
  status?: string;
  request_date?: string;
  verification_document?: string;
}

import {
  User,
  Building,
  Shield,
  Lock,
  Camera,
  Mail,
  Phone,
  Upload,
  Check,
  X,
  Loader2,
  Monitor,
  Calendar,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { Header } from "@/components/dashboard/header";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);

  // Profile settings
  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    phone: "",
    type: "",
    subscription_type: "",
    subscription_status: "",
    avatar: "",
    email_verified: false,
    agent_info: null as AgentInfo | null,
  });

  // Security settings
  const [securityData, setSecurityData] = useState({
    lastLogin: "",
    ipAddress: "",
    location: "",
    device: "",
    loginHistory: [] as Array<{
      date: string;
      time: string;
      location: string;
      device: string;
      status: string;
    }>,
  });

  // Password change

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    marketing_emails: false,
    review_notifications: true,
    booking_notifications: true,
  });

  // ID Verification
  const [idVerification, setIdVerification] = useState({
    status: "pending", // pending, verified, rejected
    documents: [] as Array<{ name: string; type: string; uploadDate: string }>,
  });

  const tabs = [
    { id: "personal", label: "Personal Information", icon: User },
    // { id: "business", label: "Business Information", icon: Building },
    { id: "verification", label: "ID Verification", icon: Shield },
    // { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security Settings", icon: Lock },
  ];

  // Load user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const profile = await userAPI.getProfile();
        console.log("Profile response:", profile);

        if (profile) {
          setProfileData({
            first_name: profile.first_name || "",
            last_name: profile.last_name || "",
            email: profile.email || "",
            username: profile.username || "",
            phone: profile.agent_info?.phone || "",
            type: profile.type || "",
            subscription_type: profile.subscription_type || "",
            subscription_status: profile.subscription_status || "",
            avatar: profile.avatar || "",
            email_verified: profile.email_verified || false,
            agent_info: profile.agent_info || null,
          });

          // Set ID verification status based on agent_info
          if (profile.agent_info) {
            setIdVerification({
              status: profile.agent_info.status || "pending",
              documents: profile.agent_info.verification_document
                ? [
                    {
                      name: profile.agent_info.verification_document,
                      type: "document",
                      uploadDate:
                        profile.agent_info.request_date ||
                        new Date().toISOString(),
                    },
                  ]
                : [],
            });
          }

          // Mock security data (you'd get this from your API)
          setSecurityData({
            lastLogin: "July 26, 2025 - 06:45 AM",
            ipAddress: "197.210.45.103",
            location: "Lagos, Nigeria (auto-detected via IP)",
            device: "Chrome on Windows 10",
            loginHistory: [
              {
                date: "July 26, 2025",
                time: "06:45 AM",
                location: "Lagos, Nigeria",
                device: "Chrome",
                status: "success",
              },
              {
                date: "July 25, 2025",
                time: "14:22 PM",
                location: "Lagos, Nigeria",
                device: "Mobile Safari",
                status: "success",
              },
              {
                date: "July 24, 2025",
                time: "09:15 AM",
                location: "Lagos, Nigeria",
                device: "Chrome",
                status: "success",
              },
            ],
          });
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      // Only send the editable fields
      const updateData = {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
      };
      await settingsAPI.updateProfile(updateData);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleIdUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingId(true);
      // Mock file upload - you'd implement actual file upload here
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setIdVerification((prev) => ({
        ...prev,
        status: "pending",
        documents: [
          ...prev.documents,
          {
            name: file.name,
            type: file.type,
            uploadDate: new Date().toISOString(),
          },
        ],
      }));

      alert("ID document uploaded successfully!");
    } catch (error) {
      console.error("Failed to upload ID:", error);
      alert("Failed to upload ID. Please try again.");
    } finally {
      setUploadingId(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#212121] text-white">
        <div className="p-6">
          <Header title="Settings" />
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            <span className="ml-2 text-gray-400">Loading settings...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#212121] text-white">
      <div className="p-6">
        {/* Header */}
        <Header title="Settings" />

        {/* Settings Container */}
        <div className="bg-[#2121212] rounded-lg">
          {/* Tab Navigation */}
          <div className="border-b border-gray-600">
            <nav className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-blue-500 text-white"
                        : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Personal Information Tab */}
            {activeTab === "personal" && (
              <div className="max-w-2xl">
                {/* Profile Picture Section */}
                <div className="mb-8">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-transparent border-[#363636] rounded-full flex items-center justify-center border-2 overflow-hidden">
                        {profileData.avatar ? (
                          <Image
                            src={profileData.avatar}
                            alt="Profile"
                            width={80}
                            height={80}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <User className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <button className="absolute bottom-0 right-0 flex items-center justify-center w-6 h-6 transition-colors bg-gray-500 rounded-full hover:bg-gray-400">
                        <Camera className="w-3 h-3 text-white" />
                      </button>
                    </div>
                    <div>
                      <h3 className="mb-1 text-lg font-medium">
                        Profile Picture
                      </h3>
                      <p className="text-sm text-gray-400">
                        Upload a photo to personalize your profile
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-300">
                        First Name
                      </label>
                      <div className="relative">
                        <User className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                        <input
                          type="text"
                          placeholder="Enter first name"
                          value={profileData.first_name}
                          onChange={(e) =>
                            setProfileData((prev) => ({
                              ...prev,
                              first_name: e.target.value,
                            }))
                          }
                          className="w-full pl-10 pr-4 py-3 bg-transparent border border-[#3d3d3d] rounded-[15px] text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-300">
                        Last Name
                      </label>
                      <div className="relative">
                        <User className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                        <input
                          type="text"
                          placeholder="Enter last name"
                          value={profileData.last_name}
                          onChange={(e) =>
                            setProfileData((prev) => ({
                              ...prev,
                              last_name: e.target.value,
                            }))
                          }
                          className="w-full pl-10 pr-4 py-3 bg-transparent border border-[#3d3d3d] rounded-[15px] text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Read-only fields */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-300">
                      Username
                    </label>
                    <div className="relative">
                      <User className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                      <div className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-[#3d3d3d] rounded-[15px] text-gray-400">
                        {profileData.username || "Not set"}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Username cannot be changed
                    </p>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-300">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                      <div className="w-full pl-10 pr-10 py-3 bg-[#1a1a1a] border border-[#3d3d3d] rounded-[15px] text-gray-400 flex items-center">
                        {profileData.email || "Not set"}
                      </div>
                      {profileData.email_verified ? (
                        <div className="absolute transform -translate-y-1/2 right-3 top-1/2">
                          <Check className="w-4 h-4 text-green-500" />
                        </div>
                      ) : (
                        <div className="absolute transform -translate-y-1/2 right-3 top-1/2">
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {profileData.email_verified
                        ? "Email verified"
                        : "Email not verified - Contact support to change email"}
                    </p>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-300">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                      <div className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-[#3d3d3d] rounded-[15px] text-gray-400">
                        {profileData.phone || "Not set"}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Phone number is managed through agent verification
                    </p>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-300">
                      Account Type
                    </label>
                    <div className="relative">
                      <Building className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                      <div className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-[#3d3d3d] rounded-[15px] text-gray-400 capitalize">
                        {profileData.type || "Not set"}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Account type cannot be changed after registration
                    </p>
                  </div>

                  {/* Subscription Info */}
                  <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3d3d3d]">
                    <h4 className="mb-3 font-medium">
                      Subscription Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Plan Type</p>
                        <p className="text-white capitalize">
                          {profileData.subscription_type || "Free"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Status</p>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              profileData.subscription_status === "active"
                                ? "bg-green-500"
                                : "bg-gray-500"
                            }`}
                          ></div>
                          <p className="text-white capitalize">
                            {profileData.subscription_status || "Inactive"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Agent Info */}
                  {profileData.agent_info && (
                    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3d3d3d]">
                      <h4 className="mb-3 font-medium">Agent Information</h4>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <p className="text-sm text-gray-400">Agent Status</p>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                profileData.agent_info.status === "approved"
                                  ? "bg-green-500"
                                  : profileData.agent_info.status === "pending"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                            ></div>
                            <p className="text-white capitalize">
                              {profileData.agent_info.status}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Request Date</p>
                          <p className="text-white">
                            {profileData.agent_info.request_date
                              ? new Date(
                                  profileData.agent_info.request_date
                                ).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-8">
                  <button
                    onClick={handleCancel}
                    className="px-6 py-2 text-gray-400 border-[#373737] border rounded-[15px] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-6 py-2 bg-[#373737] text-white rounded-[15px] hover:bg-[#3d3d3d] transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="inline w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Business Information Tab */}
            {activeTab === "business" && (
              <div className="max-w-2xl">
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-4 text-lg font-medium">
                      Business Information
                    </h3>
                    <p className="mb-6 text-gray-400">
                      Add your business details to build trust with potential
                      tenants.
                    </p>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-300">
                      Business Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your business name"
                      className="w-full px-4 py-3 bg-transparent border border-[#3d3d3d] rounded-[15px] text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-300">
                      Business Registration Number
                    </label>
                    <input
                      type="text"
                      placeholder="Enter registration number"
                      className="w-full px-4 py-3 bg-transparent border border-[#3d3d3d] rounded-[15px] text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-300">
                      Business Address
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Enter your business address"
                      className="w-full px-4 py-3 bg-transparent border border-[#3d3d3d] rounded-[15px] text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 mt-8">
                    <button className="px-6 py-2 text-gray-400 border-[#373737] border rounded-[15px] hover:text-white transition-colors">
                      Cancel
                    </button>
                    <button className="px-6 py-2 bg-[#373737] text-white rounded-[15px] hover:bg-[#3d3d3d] transition-colors">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ID Verification Tab */}
            {activeTab === "verification" && (
              <div className="max-w-2xl">
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 text-lg font-medium">
                      ID Verification
                    </h3>
                    <p className="text-gray-400">
                      Verify your identity to unlock additional features and
                      build trust.
                    </p>
                  </div>

                  {/* Current Status */}
                  <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#3d3d3d]">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Current Status</h4>
                      <div
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                          idVerification.status === "approved"
                            ? "bg-green-500/20 text-green-400"
                            : idVerification.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {idVerification.status === "approved" && (
                          <Check className="w-4 h-4" />
                        )}
                        {idVerification.status === "pending" && (
                          <Loader2 className="w-4 h-4" />
                        )}
                        {idVerification.status === "rejected" && (
                          <X className="w-4 h-4" />
                        )}
                        {idVerification.status.charAt(0).toUpperCase() +
                          idVerification.status.slice(1)}
                      </div>
                    </div>

                    {profileData.agent_info && (
                      <div className="text-sm text-gray-400">
                        <p>
                          Request submitted on:{" "}
                          {profileData.agent_info.request_date
                            ? new Date(
                                profileData.agent_info.request_date
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>
                        {profileData.agent_info.verification_document && (
                          <Image
                            src={profileData.agent_info.verification_document}
                            alt="Verification Document"
                            width={200}
                            height={100}
                            className="mt-2 rounded-lg"
                          />
                          // <p className="mt-2">Document: {profileData.agent_info.verification_document}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Upload Section */}
                  <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#3d3d3d]">
                    <h4 className="mb-4 font-medium">Upload Your ID Card</h4>

                    <div className="border-2 border-dashed border-[#3d3d3d] rounded-lg p-8 text-center">
                      <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="mb-2 text-gray-300">Click to upload</p>
                      <p className="mb-4 text-sm text-gray-400">
                        PNG, JPG, PDF (max 10MB)
                      </p>

                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.pdf"
                        onChange={handleIdUpload}
                        className="hidden"
                        id="id-upload"
                      />
                      <label
                        htmlFor="id-upload"
                        className="inline-flex items-center px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg cursor-pointer hover:bg-blue-700"
                      >
                        {uploadingId ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          "Choose File"
                        )}
                      </label>
                    </div>

                    <button className="w-full mt-4 py-2 bg-[#373737] text-white rounded-lg hover:bg-[#3d3d3d] transition-colors">
                      Submit for Review
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Preferences Tab */}
            {activeTab === "notifications" && (
              <div className="max-w-2xl">
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 text-lg font-medium">
                      Notification Preferences
                    </h3>
                    <p className="text-gray-400">
                      Choose how you want to receive notifications and updates.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        key: "email_notifications",
                        label: "Email Notifications",
                        desc: "Receive updates via email",
                      },
                      {
                        key: "sms_notifications",
                        label: "SMS Notifications",
                        desc: "Receive updates via text message",
                      },
                      {
                        key: "push_notifications",
                        label: "Push Notifications",
                        desc: "Receive browser push notifications",
                      },
                      {
                        key: "marketing_emails",
                        label: "Marketing Emails",
                        desc: "Receive promotional emails and offers",
                      },
                      {
                        key: "review_notifications",
                        label: "Review Notifications",
                        desc: "Get notified about new reviews",
                      },
                      {
                        key: "booking_notifications",
                        label: "Booking Notifications",
                        desc: "Get notified about new bookings",
                      },
                    ].map((setting) => (
                      <div
                        key={setting.key}
                        className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg border border-[#3d3d3d]"
                      >
                        <div>
                          <h4 className="font-medium">{setting.label}</h4>
                          <p className="text-sm text-gray-400">
                            {setting.desc}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={
                              notificationSettings[
                                setting.key as keyof typeof notificationSettings
                              ]
                            }
                            onChange={(e) =>
                              setNotificationSettings((prev) => ({
                                ...prev,
                                [setting.key]: e.target.checked,
                              }))
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 mt-8">
                    <button className="px-6 py-2 text-gray-400 border-[#373737] border rounded-[15px] hover:text-white transition-colors">
                      Cancel
                    </button>
                    <button className="px-6 py-2 bg-[#373737] text-white rounded-[15px] hover:bg-[#3d3d3d] transition-colors">
                      Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings Tab */}
            {activeTab === "security" && (
              <div className="max-w-2xl">
                <div className="space-y-8">
                  {/* Last Login Info */}
                  <div>
                    <h3 className="mb-4 text-lg font-medium">Last Login</h3>
                    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#3d3d3d]">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-400">
                              Date & Time:
                            </p>
                            <p className="text-white">
                              {securityData.lastLogin}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                          <div>
                            <p className="text-sm text-gray-400">IP Address:</p>
                            <p className="text-white">
                              {securityData.ipAddress}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-blue-400" />
                          <div>
                            <p className="text-sm text-gray-400">Location:</p>
                            <p className="text-white">
                              {securityData.location}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Monitor className="w-5 h-5 text-green-400" />
                          <div>
                            <p className="text-sm text-gray-400">Device:</p>
                            <p className="text-white">{securityData.device}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Password Change - Read Only */}
                  <div>
                    <h3 className="mb-4 text-lg font-medium">
                      Password Management
                    </h3>
                    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#3d3d3d]">
                      <div className="flex items-center gap-3 mb-4">
                        <Lock className="w-5 h-5 text-gray-400" />
                        <div>
                          <h4 className="font-medium text-white">
                            Password Security
                          </h4>
                          <p className="text-sm text-gray-400">
                            Your password is securely encrypted
                          </p>
                        </div>
                      </div>
                      <div className="bg-[#2a2a2a] rounded-lg p-4 border border-[#3d3d3d]">
                        <p className="mb-2 text-sm text-gray-300">
                          <strong>Password Management:</strong> For security
                          reasons, password changes must be requested through
                          our support team.
                        </p>
                        <p className="text-xs text-gray-400">
                          Contact support to initiate a password reset or change
                          request.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Login History */}
                  <div>
                    <h3 className="mb-4 text-lg font-medium">
                      Recent Login Activity
                    </h3>
                    <div className="space-y-3">
                      {securityData.loginHistory.map((login, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg border border-[#3d3d3d]"
                        >
                          <div className="flex items-center gap-3">
                            <Monitor className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-white">{login.device}</p>
                              <p className="text-sm text-gray-400">
                                {login.location}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-white">{login.date}</p>
                            <p className="text-sm text-gray-400">
                              {login.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
