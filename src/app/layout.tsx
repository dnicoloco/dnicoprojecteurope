import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { platform } from "./fonts";
import { AppShell } from "@/components/app-shell";
import { PersonaProvider } from "@/lib/persona";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Preply, practice between lessons",
  description: "Find a learning buddy and practice between your Preply lessons.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${platform.variable} ${inter.variable} antialiased`}>
      <body>
        <PersonaProvider>
          <AppShell>{children}</AppShell>
        </PersonaProvider>
      </body>
    </html>
  );
}
