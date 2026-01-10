"use client";
import { usePathname } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({
  children,
}: ConditionalLayoutProps) {
  const pathname = usePathname();

  // Hide navbar and footer on these routes:
  // - Main AI chat page (/)
  // - Dashboard routes (/dashboard for admin, /ai-dashboard for AI, /user-dashboard for users)
  // - Login/signup routes under (auth)
  // - Chat routes (/chats)
  // - Social feed route (/social-feed)
  // - Auth routes (verify, forgot-password, welcome, etc.)
  const hideNavAndFooter =
    pathname === "/" ||
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/ai-dashboard") ||
    pathname?.startsWith("/user-dashboard") ||
    pathname?.startsWith("/chats") ||
    pathname?.startsWith("/social-feed") ||
    pathname?.includes("/signin") ||
    pathname?.includes("/signup") ||
    pathname?.includes("/login") ||
    pathname?.includes("/verify") ||
    pathname?.startsWith("/forgot-password") ||
    pathname === "/welcome";

  return (
    <>
      {!hideNavAndFooter && <Navbar />}
      <main className={hideNavAndFooter ? "" : "flex-grow"}>{children}</main>
      {!hideNavAndFooter && <Footer />}
    </>
  );
}
