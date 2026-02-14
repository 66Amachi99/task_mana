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
        className="fixed bottom-6 right-6 z-40 rounded-full shadow-xl cursor-pointer hover:text-blue-600 hover:scale-110 transition-all w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-white border border-gray-200 hover:border-blue-300"
        aria-label="Добавить пост"
      >
        <PlusCircle size={32} className="text-gray-700 md:w-12 md:h-12" />
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
    <html lang="en" className="h-full">
      <body className={`${nunito.variable} antialiased h-full overflow-x-hidden`}>
        <Providers>
          <AddPostButton />
          <div className="min-h-full">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}