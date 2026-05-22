import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { StoreHydration } from "@/components/shared/store-hydration";
import "./globals.css";

export const metadata: Metadata = {
  title: "AC-QMS | Aditya Chemicals Quality Management System",
  description:
    "Digital LIMS for pharmaceutical batch quality release through sequential 4-document approval chain: SPEC → MOA → AWS → COA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className="antialiased"
      >
        <StoreHydration />
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
