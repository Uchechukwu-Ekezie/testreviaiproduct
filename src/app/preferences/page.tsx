"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

import Image from "next/image";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useRouter } from "next/navigation";

import Testimonial from "@/components/testimonial";
import PPTU from "@/components/pptu";
import ProgressSteps from "@/components/progressbar";
import { Card, CardHeader } from "@/components/ui/card";

import profile from "../../../public/Image/profile.png";
import Logo from "@/components/logo";

type Role = "tenant" | "buyer" | "landlord" | "agent";

interface RoleOption {
  id: Role;
  title: string;
  description: string;
}

const roles: RoleOption[] = [
  {
    id: "tenant",
    title: "Tenant",
    description: "Looking for a rental",
  },
  {
    id: "buyer",
    title: "Buyer",
    description: "Searching for properties",
  },
  {
    id: "landlord",
    title: "Landlord",
    description: "Listing and managing properties",
  },
  {
    id: "agent",
    title: "Real Estate Agent",
    description: "Connecting buyers and sellers",
  },
];

export default function PreferencesPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const router = useRouter();

  const handleContinue = () => {
    if (selectedRole) {
      if (selectedRole === "tenant" || selectedRole === "buyer") {
        router.push("/preferences/property");
      } else if (selectedRole === "landlord" || selectedRole === "agent") {
        router.push("/preferences/agents");
      } else {
        router.push("/signin");
      }
    }
  };

  return (
    <div className="flex items-center justify-center w-full min-h-screen p-4 mx-auto bg-[#212121] font-sf-pro ">
      <div className="flex flex-col items-center w-full gap-8 mx-auto lg:flex-row max-w-1440 ">
        {/* Logo */}
        <Card className="w-full max-w-[503px] mx-auto lg:min-h-[96px]   ">
          <CardHeader className="mb-4 space-y-3 ">
          <Logo/>
          </CardHeader>

          {/* Progress Steps */}
          
          <ProgressSteps
            currentStep={2}
            steps={[
              { label: "Step 1", title: "Basic Profile" },
              { label: "Step 2", title: "Profile" },
              { label: "Step 3", title: "Preferences" },
            ]}
          />

          {/* Role Selection */}
          <div className="flex-grow space-y-2">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`relative w-full p-[2px] rounded-lg transition-all duration-300 ${
                  selectedRole === role.id
                    ? "bg-gradient-to-r from-[#FFD700]/10 to-[#780991]/10"
                    : "bg-zinc-800"
                }`}
              >
                <div
                  className={`w-full p-4 rounded-lg ${
                    selectedRole === role.id ? "bg-transparent" : "bg-[#212121]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Profile Image Instead of Alphabet */}
                    <div
                      className={`relative w-[44px] h-[44px] rounded-[10px] flex items-center justify-center overflow-hidden ${
                        selectedRole === role.id
                          ? "bg-transparent"
                          : "bg-zinc-800"
                      }`}
                    >
                      {selectedRole === role.id && (
                        <div className="absolute inset-0 rounded-[10px] p-[2px] bg-gradient-to-r from-[#FFD700] to-[#780991]">
                          <div className="w-full h-full bg-[#212121] rounded-[8px] flex items-center justify-center overflow-hidden">
                            <Image
                              src={profile}
                              alt="Profile"
                              width={24}
                              height={24}
                              className="rounded-[8px] object-cover"
                            />
                          </div>
                        </div>
                      )}
                      {selectedRole !== role.id && (
                        <Image
                          src={profile}
                          alt="Profile"
                          width={24}
                          height={24}
                          className="rounded-[10px] object-cover"
                        />
                      )}
                    </div>

                    {/* Role Details */}
                    <div>
                      <h3 className="text-[20px] text-left font-medium text-white">
                        {role.title}
                      </h3>
                      <p className="text-[18px] text-zinc-400">
                        {role.description}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))}

            <div className="flex gap-3 pt-6">
              <Button
                onClick={handleContinue}
                disabled={!selectedRole}
                className="flex text-white h-11 bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 w-2/3"
              >
                Continue
              </Button>
              <Button
                onClick={() => router.push("/home")}
                variant="outline"
                className="flex-1 bg-transparent h-11 border-white/15 hover:bg-zinc-800/50 text-zinc-400"
              >
                Skip
              </Button>
            </div>
          </div>

          {/* Action Buttons */}

          {/* Footer */}
          <PPTU />
        </Card>


      {/* Right Side Testimonials */}
      {!isMobile && (
        <div className="w-full max-w-[720px] space-y-6 bg-[#262626] h-[800px] ">
          <Testimonial />
        </div>
      )}
    </div>
    </div>
  );
}
