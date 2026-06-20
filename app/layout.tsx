import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Footer } from "@/components/ui/Footer";
import { AuthProviders } from "@/components/auth/AuthProviders";

export const metadata: Metadata = {
  title: "Datag — 2v2 shadow arena",
  description:
    "Соревновательная 2v2 игра с прожекторами и тенями. Tager + Lighter, лучшее из 12.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0d12",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark">
      <body className="min-h-screen flex flex-col">
        <AuthProviders>
          <main className="flex-1 flex flex-col min-h-0">{children}</main>
          <Footer />
        </AuthProviders>
      </body>
    </html>
  );
}
