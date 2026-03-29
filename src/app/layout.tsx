'use client';

import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/header/header";
import { HeaderProvider } from "@/contexts/HeaderContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="antialiased h-full overflow-x-hidden">
        <Providers>
          <HeaderProvider>
            <div className="min-h-full">
              {children}
            </div>
            <Header />
          </HeaderProvider>
        </Providers>
      </body>
    </html>
  );
}