import type { Metadata } from "next";
import { Inter, Public_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "@/components/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

// Load Public Sans as a SF Pro alternative for non-Apple devices
const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  display: "swap",
})



export const metadata: Metadata = {
  title: 'ReviAi Technologies',
  description: 'Trusted property insights powered by AI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${publicSans.variable}`}>
      <body
       className="bg-[#212121] font-sans"
      >
        <AuthProvider>
        {children}
        <Toaster/>
        </AuthProvider>
      </body>
    </html>
  );
}
