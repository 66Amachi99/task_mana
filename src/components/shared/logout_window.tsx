'use client';

import { Button } from "@/components/ui/button";

interface LogoutWindowProps {
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutWindow = ({ onClose, onConfirm }: LogoutWindowProps) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h2 className="text-2xl font-bold text-gray-800">Выход из аккаунта</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Закрыть"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-700">Вы уверены, что хотите выйти из аккаунта?</p>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-6 py-3"
            >
              Отмена
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-3 bg-red-500 text-white hover:bg-red-600"
            >
              Выйти
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};