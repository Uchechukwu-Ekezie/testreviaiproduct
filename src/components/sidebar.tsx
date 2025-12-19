"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import one from "../../public/Image/dashboard.svg";
import two from "../../public/Image/book.svg";
import three from "../../public/Image/receipt-svgrepo-com (1).svg";
import four from "../../public/Image/star.svg";

// Utility function for class names
function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

import logo from "../../public/Image/logo.png";

const sidebarItems = [
  {
    title: "Main Menu",
    items: [
      {
        title: "Dashboard",
        icon: one, // Replace with actual dashboard icon
        href: "/user-dashboard",
      },
      {
        title: "Bookings",
        icon: two, // Replace with actual bookings icon
        href: "/user-dashboard/bookings",
      },
      {
        title: "Receipts",
        icon: three, // Replace with actual receipts icon
        href: "/user-dashboard/receipts",
      },
      {
        title: "My Reviews",
        icon: four, // Replace with actual reviews icon
        href: "/user-dashboard/reviews",
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="flex flex-col w-[250px] h-full text-white bg-[#212121]">
      {/* Header */}
      <div className="flex items-center h-16 px-4 border-gray-700">
        <Link href="/user-dashboard" className="flex items-center gap-2">
          <Image src={logo} alt="Revi AI" width={34} height={26} />
          <span className="text-lg font-semibold">Revi AI</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 overflow-auto">
        {sidebarItems.map((section, i) => (
          <div key={i} className="px-3">
            <h3 className="px-4 mb-4 text-sm font-medium text-gray-400">
              {section.title}
            </h3>
            <nav className="space-y-2">
              {section.items.map((item, j) => {
                const isActive =
                  pathname === item.href ||
                  (item.href === "/user-dashboard" &&
                    pathname === "/user-dashboard") ||
                  (item.href === "/user-dashboard/bookings" &&
                    pathname.startsWith("/user-dashboard/bookings")) ||
                  (item.href === "/user-dashboard/receipts" &&
                    pathname.startsWith("/user-dashboard/receipts")) ||
                  (item.href === "/user-dashboard/reviews" &&
                    pathname.startsWith("/user-dashboard/reviews"));

                return (
                  <Link
                    key={j}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3  px-4 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[#373737] text-white border-[#444444] border-2 rounded-[15px]"
                        : "text-gray-300 hover:bg-[#2a2a2a] hover:text-white "
                    )}
                  >
                    <Image
                      src={item.icon}
                      alt={item.title}
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* User Section (Optional) */}
      <div className="border-t border-gray-700 p-4">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full rounded-lg px-4 py-3 text-sm font-medium text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-colors"
        >
          <Image
            src="/Image/logout-icon.png"
            alt="Logout"
            width={20}
            height={20}
            className="w-5 h-5"
          />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
