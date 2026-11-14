import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Outfit, Urbanist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Linkdot | Your world of connections",
    template: "%s | Linkdot",
  },
  description: "Connect your work, ideas, and favorite places with Linkdot.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf2e6",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} ${urbanist.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
