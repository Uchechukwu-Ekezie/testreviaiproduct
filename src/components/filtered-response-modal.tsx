"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

interface FilteredResponseModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (role: string, preferences: any) => void
}

interface RoleOption {
  id: string
  title: string
  description: string
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
]

export function FilteredResponseModal({ isOpen, onClose, onSelect }: FilteredResponseModalProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [showPreferences, setShowPreferences] = useState(false)

  // Tenant/Buyer preferences
  const [budget, setBudget] = useState(500000)
  const [location, setLocation] = useState("")
  const [propertyType, setPropertyType] = useState("")
  const [workSituation, setWorkSituation] = useState<"remote" | "hybrid" | "office">("hybrid")

  // Landlord/Agent preferences
  const [priceRange, setPriceRange] = useState([500000, 10500000])
  const [propertiesCount, setPropertiesCount] = useState("1")
  const [tenantType, setTenantType] = useState("")

  const handleRoleSelect = () => {
    if (selectedRole) {
      setShowPreferences(true)
    }
  }

  const handleContinue = () => {
    if (!selectedRole) return

    let preferences = {}

    if (selectedRole === "tenant" || selectedRole === "buyer") {
      preferences = {
        budget,
        location,
        propertyType,
        workSituation,
      }
    } else {
      preferences = {
        priceRange,
        propertiesCount,
        tenantType,
      }
    }

    onSelect(selectedRole, preferences)
    onClose()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const isTenantOrBuyer = selectedRole === "tenant" || selectedRole === "buyer"
  const isLandlordOrAgent = selectedRole === "landlord" || selectedRole === "agent"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Filtered Response</DialogTitle>
        </DialogHeader>

        {!showPreferences ? (
          // Role selection screen
          <div className="space-y-4">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  selectedRole === role.id
                    ? "border-yellow-500 bg-zinc-800/50"
                    : "border-zinc-800 bg-transparent hover:bg-zinc-800/30"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    selectedRole === role.id ? "bg-gradient-to-r from-yellow-500 to-pink-500" : "bg-zinc-800"
                  }`}
                >
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-white">{role.title}</div>
                  <div className="text-xs text-zinc-400">{role.description}</div>
                </div>
              </button>
            ))}

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleRoleSelect}
                disabled={!selectedRole}
                className="flex-1 text-white bg-gradient-to-r from-yellow-500 to-pink-500 hover:from-yellow-600 hover:to-pink-600"
              >
                Continue
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          // Preferences screen based on role
          <div className="space-y-6">
            {isTenantOrBuyer && (
              <>
                {/* Budget Amount */}
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Budget Amount</label>
                  <div className="text-lg text-white">{formatCurrency(budget)}</div>
                  <Slider
                    value={[budget]}
                    onValueChange={([value]) => setBudget(value)}
                    max={2000000}
                    step={50000}
                    className="[&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-yellow-500 [&_[role=slider]]:to-pink-500"
                  />
                </div>

                {/* Preferred Location */}
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Preferred Location</label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger className="bg-zinc-900/50 border-zinc-800">
                      <SelectValue placeholder="e.g Lekki, Abuja" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lekki">Lekki</SelectItem>
                      <SelectItem value="abuja">Abuja</SelectItem>
                      <SelectItem value="ikeja">Ikeja</SelectItem>
                      <SelectItem value="victoria-island">Victoria Island</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Property Type */}
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Property Type</label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger className="bg-zinc-900/50 border-zinc-800">
                      <SelectValue placeholder="Select Property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="duplex">Duplex</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Work Situation */}
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Work Situation</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["remote", "hybrid", "office"] as const).map((option) => (
                      <button
                        key={option}
                        onClick={() => setWorkSituation(option)}
                        className={`px-4 py-2 rounded-lg text-sm ${
                          workSituation === option
                            ? "bg-gradient-to-r from-yellow-500 to-pink-500 text-white"
                            : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                        }`}
                      >
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {isLandlordOrAgent && (
              <>
                {/* Property Price Range */}
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Property Price Range</label>
                  <div className="flex justify-between text-white">
                    <span>{formatCurrency(priceRange[0])}</span>
                    <span>{formatCurrency(priceRange[1])}</span>
                  </div>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    min={100000}
                    max={20000000}
                    step={100000}
                    className="[&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-yellow-500 [&_[role=slider]]:to-pink-500"
                  />
                </div>

                {/* Number of Properties */}
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Number of Properties Owned/Listed</label>
                  <Input
                    type="number"
                    value={propertiesCount}
                    onChange={(e) => setPropertiesCount(e.target.value)}
                    min="1"
                    placeholder="e.g 1"
                    className="bg-zinc-900/50 border-zinc-800"
                  />
                </div>

                {/* Preferred Tenant Type */}
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Preferred Tenant Type</label>
                  <Select value={tenantType} onValueChange={setTenantType}>
                    <SelectTrigger className="bg-zinc-900/50 border-zinc-800">
                      <SelectValue placeholder="Select e.g Singles, families" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="singles">Singles</SelectItem>
                      <SelectItem value="families">Families</SelectItem>
                      <SelectItem value="students">Students</SelectItem>
                      <SelectItem value="professionals">Professionals</SelectItem>
                      <SelectItem value="any">Any</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleContinue}
                className="flex-1 text-white bg-gradient-to-r from-yellow-500 to-pink-500 hover:from-yellow-600 hover:to-pink-600"
              >
                Continue
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

