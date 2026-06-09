import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import InstallBanner from "@/components/InstallBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Shree Mauli Boys Hostel | Premium Student Accommodation",
  description: "Excellent accommodation facility exclusively for college students. Modern facilities, 24/7 security, and study-friendly environment.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mauli Hostel",
  },
};

export const viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark antialiased`}>
      <body className="min-h-full bg-background text-foreground flex flex-col font-sans">
        <InstallBanner />
        {children}
      </body>
    </html>
  );
}
