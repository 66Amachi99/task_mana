'use client';

import { Button } from "../ui/button";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export const LogOutButton = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ 
      redirect: false,
      callbackUrl: '/'
    });
    router.refresh();
  };

  return (
    <Button 
      className="w-full" 
      variant="outline"
      onClick={handleLogout}
    >
      Выйти из аккаунта
    </Button>
  );
};