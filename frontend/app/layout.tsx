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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="color-scheme" content="light dark" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem("theme") || localStorage.getItem("color-scheme");
                if (stored === "light") {
                  document.documentElement.classList.remove("dark");
                  document.documentElement.classList.add("light");
                } else if (stored === "dark") {
                  document.documentElement.classList.add("dark");
                  document.documentElement.classList.remove("light");
                } else {
                  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  if (!prefersDark) {
                    document.documentElement.classList.remove("dark");
                    document.documentElement.classList.add("light");
                  }
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-[#090A0C] text-slate-900 dark:text-[#F0F3F6] antialiased selection:bg-[#38BDF8]/20 selection:text-[#38BDF8] transition-colors duration-150">
        {children}
      </body>
    </html>
  );
}
