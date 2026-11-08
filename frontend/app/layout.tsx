import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bursa Intelligence - Real-Time Market Quotes, Financial Reports & DCF Valuation",
  description: "Bursa Malaysia equity research, real-time quotes, regulatory disclosures, and financial analytics.",
};

export const viewport: Viewport = {
  themeColor: "#0b0f19",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="color-scheme" content="dark" />
      </head>
      <body className="min-h-screen bg-[#0b0f19] text-slate-100 antialiased selection:bg-blue-600/30 selection:text-blue-200">
        {children}
      </body>
    </html>
  );
}
