'use client';

import { useState } from "react";
import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/shared/header"
import { PlusCircle } from "lucide-react";
import { PostAddWindow } from "@/components/shared/post_add_window";
import { Providers } from "./providers";

const nunito = Nunito({
  subsets: ['cyrillic'],
  variable: '--font-nunito', 
  weight: ['400', '500', '600', '700', '800', '900']
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <html lang="en">
      <body className={`${nunito.variable} antialiased`}>
        <Providers>
            <button 
              onClick={handleOpenModal}
              className="fixed bottom-10 right-10 z-40 rounded-full shadow-xl cursor-pointer hover:text-blue-600 hover:scale-110"
            >
              <PlusCircle size={100} />
            </button>

            {isModalOpen && <PostAddWindow onClose={handleCloseModal} />}
            
            <main className="pt-2">
              {children}
            </main>
          </Providers>
      </body>
    </html>
  );
}