'use client';

import { useState } from 'react';
import { Button } from "../ui/button";
import { AuthWindow } from "./auth_window";

export const AuthButton = () => {
  const [showAuthWindow, setShowAuthWindow] = useState(false);

  return (
    <>
      <Button 
        variant="outline"
        onClick={() => setShowAuthWindow(true)}
        className="flex items-center gap-2"
      >
        Авторизоваться
      </Button>
      
      {showAuthWindow && (
        <AuthWindow onClose={() => setShowAuthWindow(false)} />
      )}
    </>
  );
};