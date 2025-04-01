import type { Metadata } from "next";
import { Inter, Public_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { ChatProvider } from "@/contexts/chat-context";
import { SearchHistoryProvider } from "@/contexts/search-history-context";
import { ThemeProvider } from "@/contexts/theme-context";
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
  title: "Revi.ai",
  description: "Your AI Assistant",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${publicSans.variable}`}>
      <body
       className="font-sans transition-colors duration-300 bg-background text-muted-foreground"
       suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            <ChatProvider>
              <SearchHistoryProvider>
                {children}
                <Toaster/>
              </SearchHistoryProvider>
            </ChatProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
