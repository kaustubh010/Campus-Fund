import type { Metadata } from "next";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";
import { WalletProvider } from "@/context/wallet-context";
import { Navbar } from "@/components/navbar";
import Footer from "@/components/footer";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "@/hooks/useAuth";

const syne = Syne({ subsets: ["latin"], variable: "--font-syne" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: "CampusFund -- Crowdfunding for Students",
  description: "The transparent, escrow-backed platform where campus ideas become reality. Launch your campaign, rally the community, and build the future—trustless.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased bg-[#0A0A0F] text-[#F1F5F9]`}>
        <AuthProvider>
            <WalletProvider>
              <Navbar />
              {children}
              <Footer />
              <ToastContainer theme="colored" position="bottom-right" />
            </WalletProvider>
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
