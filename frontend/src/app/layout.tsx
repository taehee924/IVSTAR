import type { Metadata } from "next";
import { Geist, Geist_Mono, Carattere, Urbanist, Playfair_Display, Inknut_Antiqua } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/next";
import WelcomePopup from "@/components/WelcomePopup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const carattere = Carattere({
  variable: "--font-carattere",
  subsets: ["latin"],
  weight: "400",
});

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inknutAntiqua = Inknut_Antiqua({
  variable: "--font-inknut",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// 환경에 따라 URL 결정
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.4fourstar.com";

export const metadata: Metadata = {
  title: "IVSTAR",
  description: "Your personalized Saju & astrology readings",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  openGraph: {
    title: "IVSTAR",
    description: "Your personalized Saju & astrology readings",
    url: baseUrl,
    siteName: "IVSTAR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${carattere.variable} ${urbanist.variable} ${playfairDisplay.variable} ${inknutAntiqua.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <WelcomePopup />
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}