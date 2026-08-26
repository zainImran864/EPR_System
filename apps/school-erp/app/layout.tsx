import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { Toaster } from "@/components/ui/Toast";
import { PWARegister } from "@/components/pwa/PWARegister";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AcademiX — School Management Platform",
  description:
    "Modern, reactive School ERP platform for managing student records, attendance, marks, classes, and teachers.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AcademiX",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D9488",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-[#0F172A]">
        <ConvexClientProvider>
          {children}
          <Toaster />
          <PWARegister />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
