import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bursa Intelligence - Financial Research, Live Quotes & Analysis",
  description: "Institutional and retail financial intelligence for Bursa Malaysia equities with automated filing analysis.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#090a0c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body className="min-h-screen bg-[#090A0C] text-[#F0F3F6] antialiased selection:bg-[#38BDF8]/20 selection:text-[#38BDF8]">
        {children}
      </body>
    </html>
  );
}
