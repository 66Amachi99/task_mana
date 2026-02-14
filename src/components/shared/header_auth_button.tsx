'use client';

import { useState } from 'react';
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AuthWindow } from "./auth_window";
import { LogoutWindow } from "./logout_window";
import { LogIn, LogOut } from 'lucide-react';

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
    setShowLogoutWindow(false);
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center w-11 h-11 bg-slate-100 rounded-2xl">
        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <button
          onClick={() => setShowAuthWindow(true)}
          className="flex items-center justify-center gap-2 h-11 px-3 md:px-5 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors font-bold text-sm cursor-pointer"
          title="Авторизоваться"
        >
          <LogIn className="w-5 h-5" />
          <span className="hidden md:inline">Авторизоваться</span>
        </button>
        
        {showAuthWindow && (
          <AuthWindow onClose={() => setShowAuthWindow(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowLogoutWindow(true)}
        className="flex items-center justify-center gap-2 h-11 px-3 md:px-5 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors font-bold text-sm cursor-pointer"
        title={`Выйти (${session.user?.user_login})`}
      >
        <LogOut className="w-5 h-5" />
        <span className="hidden md:inline">{session.user?.user_login}</span>
      </button>
      
      {showLogoutWindow && (
        <LogoutWindow 
          onClose={() => setShowLogoutWindow(false)}
          onConfirm={handleLogout}
        />
      )}
    </>
  );
};