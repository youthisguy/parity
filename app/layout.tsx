import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Parity",
  description: "Real-time dislocation tracking across rToken, perp mark, and perp index on Bitget US Stocks.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="3533cb58-2e7c-4785-86ab-5f8b9ff6db16"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${inter.className} bg-[#080808] text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}