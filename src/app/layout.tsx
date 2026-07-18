import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EventsMeet — Swipe Perth Events",
  description:
    "Tinder-style discovery for events in Perth, WA. Swipe right to save, powered by AI web search.",
  applicationName: "EventsMeet",
  appleWebApp: {
    capable: true,
    title: "EventsMeet",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0714",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // Lets the app paint behind the iPhone notch/home indicator; the layout
  // compensates with env(safe-area-inset-*) padding.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
