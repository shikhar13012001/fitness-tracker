import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { PWAProvider } from "@/context/PWAContext";

const geist = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "FitTrack",
  description: "Your personal fitness trainer",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FitTrack",
  },
  icons: {
    apple: "/icons/icon-192.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable}>
      <head>
        {/* Synchronous theme init — prevents flash on cold load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('fittrack-theme')||'dark';var dark=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',dark);})();`,
          }}
        />
      </head>
      <body className="antialiased bg-background text-foreground">
        <PWAProvider>{children}</PWAProvider>
      </body>
    </html>
  );
}
