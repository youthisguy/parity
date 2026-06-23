import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Parity",
  description: "Real-time dislocation tracking across rToken, perp mark, and perp index on Bitget US Stocks.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#080808] text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}