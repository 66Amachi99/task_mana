'use client';

import { useState } from 'react';
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
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
    setShowLogoutWindow(false);
  };

  if (status === "loading") {
    return (
      <div className="flex items-center h-11 px-5 bg-slate-100 rounded-2xl font-bold text-sm text-gray-500">
        Загрузка...
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <button
          onClick={() => setShowAuthWindow(true)}
          className="flex items-center gap-2 h-11 px-5 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors font-bold text-sm cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          Авторизоваться
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
        className="flex items-center gap-2 h-11 px-5 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors font-bold text-sm cursor-pointer"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        {session.user?.user_login}
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