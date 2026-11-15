import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YouTube thumbnail generator",
  description:
    "Self-hosted YouTube thumbnail compare — channel + niche by views, local AI suggest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} min-h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
