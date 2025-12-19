"use client"
import { useState, useEffect } from "react"
// import { useRouter } from "next/navigation"
import { Bell, Search,  User } from "lucide-react"

interface HeaderProps {
  title: string
}

export function Header({ title}: HeaderProps) {
  const [userType, setUserType] = useState<string>("")
  const [userEmail, setUserEmail] = useState<string>("")
  // const router = useRouter()

  useEffect(() => {
    // Get user data from localStorage
    if (typeof window !== 'undefined') {
      const type = localStorage.getItem("userType") || ""
      const email = localStorage.getItem("userEmail") || ""
      setUserType(type)
      setUserEmail(email)
    }
  }, [])

  // const handleLogout = () => {
  //   localStorage.removeItem("userType")
  //   localStorage.removeItem("userEmail")
  //   router.push("/login")
  // }

  return (
    <header className=" bg-[#212121] px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
         
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-64 rounded-[15px] border border-[#2A2A2A] bg-transparent py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#780991]"
            />
          </div>

          {/* Notifications */}
          <button className="relative rounded-[15px] border border-[#2A2A2A] bg-transparent  p-2 text-gray-400 hover:text-white">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500"></span>
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-white capitalize">{userType}</p>
              <p className="text-xs text-gray-400">{userEmail}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#FFD700] to-[#780991] flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              {/* <button
                onClick={handleLogout}
                className="rounded-lg bg-[#2A2A2A] p-2 text-gray-400 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </button> */}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
