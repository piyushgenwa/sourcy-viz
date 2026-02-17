import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sourcy - Product Request Flow",
  description: "Product request visualization and customization intelligence platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
