import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { SolanaWalletProvider } from "@/components/WalletProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeToggle";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Likable - AI Trading Companion",
  description: "Likable is your AI trading companion for voice conversations, chart scenarios, emotional processing, and risk management. Powered by Solana blockchain.",
  keywords: ["AI companion", "voice companion", "market analysis", "trading", "risk management", "Solana", "crypto"],
  authors: [{ name: "Likable" }],
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: "cover",
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Likable AI",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
  type: "website",
  title: "Likable - AI Trading Companion",
  description: "Likable is your AI trading companion for voice conversations and market analysis",
    images: [
      {
        url: "/companioni.jpg",
        width: 1200,
        height: 630,
        alt: "Likable AI voice companion character",
      },
    ],
  },
  twitter: {
  card: "summary_large_image",
  title: "Likable - AI Trading Companion",
  description: "Likable is your AI trading companion for voice conversations and market analysis",
    images: ["/companioni.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Likable AI" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#000000" id="theme-color-meta" />
      </head>
      <body
        className={`${inter.variable} antialiased page-transition`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <SolanaWalletProvider>
            <AuthProvider>
              <div className="page-transition">
                {children}
              </div>
              <Toaster richColors position="bottom-center" closeButton />
            </AuthProvider>
          </SolanaWalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
