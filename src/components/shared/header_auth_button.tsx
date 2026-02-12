'use client';

import { useState } from 'react';
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuthWindow } from "./auth_window";
import { LogoutWindow } from "./logout_window";

export const HeaderAuthButton = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showAuthWindow, setShowAuthWindow] = useState(false);
  const [showLogoutWindow, setShowLogoutWindow] = useState(false);

  const handleLogout = async () => {
    await signOut({ 
      redirect: false,
    });
    router.refresh();
  };

  if (status === "loading") {
    return (
      <Button variant="outline" disabled>
        Загрузка...
      </Button>
    );
  }

  if (!session) {
    return (
      <>
        <Button 
          variant="outline"
          onClick={() => setShowAuthWindow(true)}
          className="flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          Авторизоваться
        </Button>
        
        {showAuthWindow && (
          <AuthWindow onClose={() => setShowAuthWindow(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <Button 
        variant="outline"
        onClick={() => setShowLogoutWindow(true)}
        className="flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Выйти ({session.user?.user_login})
      </Button>
      
      {showLogoutWindow && (
        <LogoutWindow 
          onClose={() => setShowLogoutWindow(false)}
          onConfirm={handleLogout}
        />
      )}
    </>
  );
};