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

import { Slider } from "@/components/ui/slider";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Card, CardHeader } from "@/components/ui/card";
import logo from "../../../../public/Image/logo reviai.png";
import Testimonial from "@/components/testimonial";
import PPTU from "@/components/pptu";
import ProgressSteps from "@/components/progressbar";

export default function LandlordPreferencesPage() {
  const [priceRange, setPriceRange] = useState([500000, 10500000]);
  const [propertiesCount, setPropertiesCount] = useState("1");
  const [tenantType, setTenantType] = useState("");
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const router = useRouter();

  const handleContinue = () => {
    router.push("/signin");
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="flex items-center justify-center w-full min-h-screen p-4 mx-auto bg-[#212121] ">
      <div className="flex flex-col items-center w-full gap-8 mx-auto lg:flex-row max-w-1440 ">
        {/* Logo */}
        <Card className="w-full max-w-[503px] mx-auto lg:min-h-[96vh]  pt-6 px-4 md:px-6 ">
          <CardHeader className="mb-5 space-y-3 lg:mb-14">
            <div className="flex items-center justify-center">
              <Image src={logo} alt="Revi AI Logo" width={46} height={34} />
              <span className="ml-2 text-xl font-semibold text-white">
                Revi AI
              </span>
            </div>
          </CardHeader>

          {/* Progress Steps */}
          <div className="flex-grow ">
            <ProgressSteps
              currentStep={3}
              steps={[
                { label: "Step 1", title: "Basic Profile" },
                { label: "Step 2", title: "Profile" },
                { label: "Step 3", title: "Preferences" },
              ]}
            />

            {/* Form */}
            <div className="flex-grow w-full  space-y-8 text-[#979797]">
              {/* Property Price Range */}
              <div className="space-y-4">
                <label className="text-sm text-zinc-400">
                  Property Price Range
                </label>
                <div className="space-y-6">
                  <div className="flex justify-between text-xl font-medium ">
                    <span className="border-zinc-700 border-2 p-2 rounded-[15px] bg-[#262626] ">
                      {formatPrice(priceRange[0])}
                    </span>
                    <span className="border-zinc-700 border-2 p-2 rounded-[15px] bg-[#262626]">
                      {formatPrice(priceRange[1])}
                    </span>
                  </div>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    min={100000}
                    max={20000000}
                    step={100000}
                    className="[&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-yellow-500 [&_[role=slider]]:to-pink-500 border-zinc-800 border-2 py-1 rounded-[15px]"
                  />
                </div>
              </div>

              {/* Number of Properties */}
              <div className="space-y-2">
                <label className="text-[18px] ">
                  Number of Properties Owned/Listed
                </label>
                <Input
                  type="number"
                  value={propertiesCount}
                  onChange={(e) => setPropertiesCount(e.target.value)}
                  min="1"
                  placeholder="e.g 1"
                  className="h-12 bg-[#262626] border-zinc-800 rounded-[15px] !text-[16px]"
                />
              </div>

              {/* Preferred Tenant Type */}
              <div className="space-y-2">
                <label className="text-[18px] text-zinc-400">
                  Preferred Tenant Type
                </label>
                <Select value={tenantType} onValueChange={setTenantType}>
                  <SelectTrigger className="h-12 border-zinc-800 bg-[#262626] rounded-[15px] w-full text-[18px]">
                    <SelectValue placeholder="Select e.g Singles, families" />
                  </SelectTrigger>
                  <SelectContent className=" bg-[#262626] text-[#979797] text-[18px] ">
                    <SelectItem value="singles">Singles</SelectItem>
                    <SelectItem value="families">Families</SelectItem>
                    <SelectItem value="students">Students</SelectItem>
                    <SelectItem value="professionals">Professionals</SelectItem>
                    <SelectItem value="any">Any</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-full max-w-md gap-3 ">
                <Button
                  onClick={handleContinue}
                  className="flex h-12 text-white bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 rounded-[15px] hover:to-pink-600 w-2/3"
                >
                  Save
                </Button>
                <Button
                  onClick={() => router.push("/home")}
                  variant="outline"
                  className="flex-1 h-12 bg-[#262626] border-zinc-800 hover:bg-zinc-800/50 text-zinc-400 lg:w-1/3 rounded-[15px]"
                >
                  Skip
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}

          {/* Footer */}
          <PPTU />
        </Card>

        {!isMobile && (
          <div className="w-full max-w-[720px] space-y-6 bg-[#262626] h-[800px] pt-[30px]">
            <Testimonial />
          </div>
        )}
      </div>
    </div>
  );
}
