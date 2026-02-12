'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PostAddWindowProps {
  onClose: () => void;
}

export const PostAddWindow = ({ onClose }: PostAddWindowProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    post_title: '',
    post_description: '',
    post_type: '',
    post_deadline: '',
    post_status: 'Ожидает начала',
    post_needs_video_smm: false,
    post_needs_video_maker: false,
    post_needs_text: false,
    post_needs_photogallery: false,
    post_needs_cover_photo: false,
    post_needs_photo_cards: false,
  });

  // Функция для установки задач по типу поста
  const setTasksByPostType = (postType: string) => {
    const baseState = {
      post_needs_video_smm: false,
      post_needs_video_maker: false,
      post_needs_text: false,
      post_needs_photogallery: false,
      post_needs_cover_photo: false,
      post_needs_photo_cards: false,
    };

    switch (postType) {
      case 'Видео':
        return {
          ...baseState,
          post_needs_video_maker: true
        };
      case 'Фотопост':
        return {
          ...baseState,
          post_needs_photo_cards: true,
          post_needs_photogallery: true,
          post_needs_cover_photo: true
        };
      case 'Афиша':
        return {
          ...baseState,
          post_needs_cover_photo: true,
          post_needs_video_smm: true
        };
      case 'Светлана Юрьевна':
        return {
          ...baseState,
          post_needs_video_smm: true
        };
      case 'Рубрика':
        return {
          ...baseState,
          post_needs_text: true
        };
      case 'ЧЕ':
        return {
          post_needs_video_smm: true,
          post_needs_video_maker: true,
          post_needs_text: true,
          post_needs_photogallery: true,
          post_needs_cover_photo: true,
          post_needs_photo_cards: true
        };
      default:
        return baseState;
    }
  };

  const getDefaultDateTime = () => {
    const now = new Date();
    const defaultDate = new Date(now);
    defaultDate.setDate(now.getDate() + 7);
    
    const year = defaultDate.getFullYear();
    const month = String(defaultDate.getMonth() + 1).padStart(2, '0');
    const day = String(defaultDate.getDate()).padStart(2, '0');
    const hours = String(defaultDate.getHours()).padStart(2, '0');
    const minutes = String(defaultDate.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      post_deadline: getDefaultDateTime()
    }));
  }, []);

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      if (name === 'post_type') {
        // При изменении типа поста устанавливаем нужные задачи и сбрасываем остальные
        const tasks = setTasksByPostType(value);
        setFormData(prev => ({
          ...prev,
          [name]: value,
          ...tasks
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    }
  };

  // Отдельная функция для изменения checkbox'ов (чтобы можно было их включать/выключать вручную)
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.post_title.trim() || !formData.post_description.trim() || 
        !formData.post_type || !formData.post_deadline) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const deadlineDate = new Date(formData.post_deadline);
      
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_title: formData.post_title,
          post_description: formData.post_description,
          post_type: formData.post_type,
          post_status: formData.post_status,
          post_deadline: deadlineDate.toISOString(),
          post_needs_video_smm: formData.post_needs_video_smm,
          post_needs_video_maker: formData.post_needs_video_maker,
          post_needs_text: formData.post_needs_text,
          post_needs_photogallery: formData.post_needs_photogallery,
          post_needs_cover_photo: formData.post_needs_cover_photo,
          post_needs_photo_cards: formData.post_needs_photo_cards,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при создании поста');
      }

      setSuccess(true);
      
      setTimeout(() => {
        router.refresh();
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Ошибка при создании поста:', error);
      setError(error instanceof Error ? error.message : 'Произошла неизвестная ошибка');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTimeDisplay = (dateTimeString: string) => {
    if (!dateTimeString) return 'Не указано';
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateTimeString;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h2 className="text-2xl font-bold text-gray-800">Добавление нового поста</h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Закрыть"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Сообщения об ошибках и успехе */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-700">Пост успешно создан!</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              {/* Название поста */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название поста *
                </label>
                <input
                  type="text"
                  name="post_title"
                  value={formData.post_title}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Введите название поста"
                />
              </div>

              {/* Описание */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание *
                </label>
                <textarea
                  name="post_description"
                  value={formData.post_description}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Опишите детали поста"
                />
              </div>

              {/* Тип поста */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип поста *
                </label>
                <select
                  name="post_type"
                  value={formData.post_type}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Выберите тип</option>
                  <option value="Видео">Видео</option>
                  <option value="Фотопост">Фотопост</option>
                  <option value="Афиша">Афиша</option>
                  <option value="Светлана Юрьевна">Светлана Юрьевна</option>
                  <option value="Рубрика">Рубрика</option>
                  <option value="ЧЕ">ЧЕ</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Статус
                </label>
                <select
                  name="post_status"
                  value={formData.post_status}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="Ожидает начала">Ожидает начала</option>
                  <option value="В процессе">В процессе</option>
                  <option value="Завершен">Завершен</option>
                  <option value="Отложен">Отложен</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              {/* Дедлайн с датой и временем */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дедлайн (дата и время) *
                </label>
                <div className="space-y-4">
                  <input
                    type="datetime-local"
                    name="post_deadline"
                    value={formData.post_deadline}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Выбранный дедлайн:</p>
                    <p className="font-medium text-gray-800">
                      {formatDateTimeDisplay(formData.post_deadline)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Необходимые задачи */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Необходимые задачи
                </label>
                <div className="space-y-3">
                  <label className={`flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
                    <input
                      type="checkbox"
                      name="post_needs_video_smm"
                      checked={formData.post_needs_video_smm}
                      onChange={(e) => handleCheckboxChange(e.target.name, e.target.checked)}
                      disabled={isSubmitting}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                    />
                    <span className="text-gray-700">Видео для SMM</span>
                  </label>

                  <label className={`flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
                    <input
                      type="checkbox"
                      name="post_needs_video_maker"
                      checked={formData.post_needs_video_maker}
                      onChange={(e) => handleCheckboxChange(e.target.name, e.target.checked)}
                      disabled={isSubmitting}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                    />
                    <span className="text-gray-700">Видео для видеомейкера</span>
                  </label>

                  <label className={`flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
                    <input
                      type="checkbox"
                      name="post_needs_text"
                      checked={formData.post_needs_text}
                      onChange={(e) => handleCheckboxChange(e.target.name, e.target.checked)}
                      disabled={isSubmitting}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                    />
                    <span className="text-gray-700">Текст</span>
                  </label>
                  
                  <label className={`flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
                    <input
                      type="checkbox"
                      name="post_needs_photogallery"
                      checked={formData.post_needs_photogallery}
                      onChange={(e) => handleCheckboxChange(e.target.name, e.target.checked)}
                      disabled={isSubmitting}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                    />
                    <span className="text-gray-700">Фотогалерея</span>
                  </label>

                  <label className={`flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
                    <input
                      type="checkbox"
                      name="post_needs_cover_photo"
                      checked={formData.post_needs_cover_photo}
                      onChange={(e) => handleCheckboxChange(e.target.name, e.target.checked)}
                      disabled={isSubmitting}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                    />
                    <span className="text-gray-700">Обложка</span>
                  </label>

                  <label className={`flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
                    <input
                      type="checkbox"
                      name="post_needs_photo_cards"
                      checked={formData.post_needs_photo_cards}
                      onChange={(e) => handleCheckboxChange(e.target.name, e.target.checked)}
                      disabled={isSubmitting}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                    />
                    <span className="text-gray-700">Фотокарточки</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-30"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Создание...
                </>
              ) : (
                'Создать пост'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};