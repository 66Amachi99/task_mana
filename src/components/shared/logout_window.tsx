'use client';

interface LogoutWindowProps {
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutWindow = ({ onClose, onConfirm }: LogoutWindowProps) => {
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
            <div className="flex-1"></div> {/* Пустой div для баланса */}
            <h2 className="text-2xl font-bold text-gray-800 text-center">Подтверждение</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer flex-1 flex justify-end"
              aria-label="Закрыть"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-gray-700 mb-8 text-center text-lg">
            Вы уверены, что хотите выйти?
          </p>

          <div className="flex justify-center gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium cursor-pointer min-w-30"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium cursor-pointer min-w-30"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};