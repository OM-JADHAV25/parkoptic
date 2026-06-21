import React from "react";
import type { Metadata } from "next";
import { Outfit, Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-primary",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ParkOptic - Parking Intelligence Platform",
  description: "AI-Powered Parking Violations, Hotspots and Patrol Optimizations for Bengaluru Traffic Police.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn(outfit.className, "font-sans", geist.variable)}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
