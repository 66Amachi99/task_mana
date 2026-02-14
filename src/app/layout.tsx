'use client';

import { useState, useCallback } from "react";
import { Nunito } from "next/font/google";
import "./globals.css";
import { PlusCircle } from "lucide-react";
import { PostAddWindow } from "@/components/shared/post_add_window";
import { Providers } from "./providers";
import { useUser } from "@/hooks/use-roles";

const nunito = Nunito({
  subsets: ['cyrillic'],
  variable: '--font-nunito', 
  weight: ['400', '500', '600', '700', '800', '900']
});

function AddPostButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, isAdminOrCoordinator, isSmm } = useUser();
  
  const canAddPost = user && (isAdminOrCoordinator || isSmm);
  
  const handlePostAdded = useCallback(async () => {
    setIsModalOpen(false);
    window.dispatchEvent(new CustomEvent('postUpdated'));
  }, []);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  if (!canAddPost) return null;
  
  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 rounded-full shadow-xl cursor-pointer hover:text-blue-600 hover:scale-110 transition-all w-16 h-16 flex items-center justify-center bg-white border border-gray-200 hover:border-blue-300"
        aria-label="Добавить пост"
      >
        <PlusCircle size={48} className="text-gray-700" />
      </button>

      {isModalOpen && (
        <PostAddWindow 
          onClose={handleClose}
          onPostAdded={handlePostAdded}
        />
      )}
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} antialiased overflow-x-hidden`}>
        <Providers>
          <AddPostButton />
          {children}
        </Providers>
      </body>
    </html>
  );
}