'use client';

import { Header } from "@/components/header/header";
import { HeaderProvider } from "@/contexts/HeaderContext";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HeaderProvider>
      <div className="min-h-full">
        {children}
      </div>
      <Header />
    </HeaderProvider>
  );
}