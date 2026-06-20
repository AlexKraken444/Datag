import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Datag — 2v2 shadow arena",
  description:
    "Соревновательная 2v2 игра с прожекторами и тенями. Tager + Lighter, лучшее из 12.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark">
      <body>{children}</body>
    </html>
  );
}
