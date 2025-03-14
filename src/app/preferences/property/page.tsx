"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { useRouter } from "next/navigation";

import Testimonial from "@/components/testimonial";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Card, CardHeader } from "@/components/ui/card";
import logo from "../../../../public/Image/logo reviai.png";
import ProgressSteps from "@/components/progressbar";
import PPTU from "@/components/pptu";

type WorkSituation = "remote" | "hybrid" | "office";

export default function PropertyPreferencesPage() {
  const [budget, setBudget] = useState("500000");
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [workSituation, setWorkSituation] = useState<WorkSituation>("hybrid");
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 1024px)");

  const handleContinue = () => {
    // Handle form submission
    router.push("/signin");
  };



  const formatBudget = (value: string) => {
    // Remove non-numeric characters
    const numbers = value.replace(/\D/g, "");
    // Format with commas
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="flex items-center justify-center w-full min-h-screen p-4 mx-auto bg-[#212121] ">
      <div className="flex flex-col items-center w-full gap-8 mx-auto lg:flex-row max-w-1440 ">
        {/* Logo */}
        <Card className="w-full max-w-[503px] mx-auto   pt-[30px]  ">
          <CardHeader className="mb-5 space-y-3 ">
            <div className="flex items-center justify-center">
              <Image src={logo} alt="Revi AI Logo" width={46} height={34} />
              <span className="ml-2 text-xl font-semibold text-white">
                Revi AI
              </span>
            </div>
          </CardHeader>

          {/* Progress Steps */}
          <div className="flex-grow ml">
            <ProgressSteps
              currentStep={3}
              steps={[
                { label: "Step 1", title: "Basic Profile" },
                { label: "Step 2", title: "Profile" },
                { label: "Step 3", title: "Preferences" },
              ]}
            />

            {/* Form */}
            <div className="space-y-6">
              {/* Budget Amount */}
              <div className="space-y-2">
                <label className="text-[18px] text-[#979797]">
                  Budget Amount
                </label>
                <div className="relative">
                  <span className="absolute -translate-y-1/2 left-3 top-1/2 text-zinc-400">
                    ₦
                  </span>
                  <Input
                    value={formatBudget(budget)}
                    onChange={(e) =>
                      setBudget(e.target.value.replace(/\D/g, ""))
                    }
                    className="pl-7 bg-[#262626] border-zinc-700 h-11 text-zinc-400 text-[16px]"
                  />
                </div>
              </div>

              {/* Preferred Location */}
              <div className="space-y-2">
                <label className="text-[18px] text-[#979797]">
                  Preferred Location
                </label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g Leeds, Altroa"
                  className="bg-[#262626] border-zinc-700  !text-[16px] text-[#979797] placeholder:text-[16px]"
                />
              </div>

              {/* Property Type */}
              <div className="space-y-2">
                <label className="text-[18px] text-[#979797]">
                  Property Type
                </label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="bg-[#262626] border-zinc-700 h-11 text-zinc-400 text-[15px] w-full">
                    <SelectValue placeholder="Select Property type" />
                  </SelectTrigger>
                  <SelectContent className="text-zinc-400 bg-[#262626]">
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Work Situation */}
              <div className="space-y-2">
                <label className="text-[18px] text-[#979797]">
                  Work Situation
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["remote", "hybrid", "office"] as const).map((option) => (
                    <div
                      key={option}
                      className={`relative p-[2px] rounded-lg ${
                        workSituation === option
                          ? "bg-gradient-to-r from-[#FFD700] to-[#780991]"
                          : "bg-[#262626] border border-zinc-700"
                      }`}
                    >
                      <button
                        onClick={() => setWorkSituation(option)}
                        className={`relative w-full h-full px-4 py-2 rounded-lg text-[18px] flex items-center justify-center
            ${
              workSituation === option
                ? "bg-gradient-to-r from-[#FFD700]/10 to-[#780991]/10 text-white"
                : "bg-[#262626] text-zinc-400 hover:bg-zinc-800"
            }`}
                      >
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleContinue}
              className="flex text-[18px] text-white h-11 bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 w-2/3"
            >
              Save
            </Button>
            <Button
              onClick={() => router.push("/home")}
              variant="outline"
              className="flex-1 bg-transparent h-11 border-zinc-700 hover:bg-zinc-800/50 text-zinc-400"
            >
              Skip
            </Button>
          </div>

          {/* Footer */}
          <PPTU />
        </Card>

        {!isMobile && (
          <div className="w-full max-w-[720px] space-y-6 bg-[#262626] h-[800px]">
            <Testimonial />
          </div>
        )}
      </div>
    </div>
  );
}
