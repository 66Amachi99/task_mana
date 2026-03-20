'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-roles';
import { Search, X } from 'lucide-react';
import { DatePicker } from '../ui/date_picker';
import styles from '../styles/PostAddWindow.module.css';
import { AutoResizeTextarea } from '../ui/auto_resize_textarea';
import { useCreatePost } from '@/hooks/usePosts';

interface User {
  user_id: number;
  user_login: string;
  admin_role: boolean;
  SMM_role: boolean;
  designer_role: boolean;
  coordinator_role: boolean;
  photographer_role: boolean;
}

interface Tag {
  tag_id: number;
  name: string;
  color: string;
}

interface PostAddWindowProps {
  onClose: () => void;
  initialDate?: Date;
}

const TASK_ITEMS = [
  { id: 'post_needs_mini_video_smm', label: 'Мини-видео' },
  { id: 'post_needs_video', label: 'Видео' },
  { id: 'post_needs_cover_photo', label: 'Обложка' },
  { id: 'post_needs_photo_cards', label: 'Фотокарточки' },
  { id: 'post_needs_photogallery', label: 'Фотогалерея' },
  { id: 'post_needs_mini_gallery', label: 'Мини-фотогалерея' },
];

export const PostAddWindow = ({ onClose, initialDate }: PostAddWindowProps) => {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    post_title: '',
    post_description: '',
    tz_link: '',
    post_status: 'В работе',
    responsible_person_id: '',
    post_needs_mini_video_smm: false,
    post_needs_video: false,
    post_needs_cover_photo: false,
    post_needs_photo_cards: false,
    post_needs_photogallery: false,
    post_needs_mini_gallery: false,
  });

  const [deadline, setDeadline] = useState<Date | null>(null);

  const [taskStates, setTaskStates] = useState(() => 
    TASK_ITEMS.map(item => formData[item.id as keyof typeof formData] as boolean)
  );

  const createPost = useCreatePost();

  useEffect(() => {
    setTaskStates(TASK_ITEMS.map(item => formData[item.id as keyof typeof formData] as boolean));
  }, [formData]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/tags');
        const data = await response.json();
        setTags(data);
      } catch (error) {
        console.error('Ошибка загрузки тегов:', error);
      }
    };
    fetchTags();
  }, []);

  const getDefaultDate = (): Date => {
    if (initialDate) {
      const date = new Date(initialDate);
      date.setHours(12, 0, 0, 0);
      return date;
    }
    const now = new Date();
    const defaultDate = new Date(now);
    defaultDate.setDate(now.getDate() + 7);
    defaultDate.setHours(12, 0, 0, 0);
    return defaultDate;
  };

  useEffect(() => {
    setDeadline(getDefaultDate());
  }, [initialDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setIsTagDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await fetch('/api/users');
        const data = await response.json();
        setUsers(data);
        
        if (currentUser && data.length > 0) {
          const currentUserInList = data.find((u: User) => u.user_login === currentUser.login);
          if (currentUserInList) {
            setSelectedUser(currentUserInList);
            setFormData(prev => ({
              ...prev,
              responsible_person_id: currentUserInList.user_id.toString()
            }));
            setSearchQuery(currentUserInList.user_login);
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [currentUser]);

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
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTaskToggle = (index: number) => {
    const newStates = [...taskStates];
    newStates[index] = !newStates[index];
    setTaskStates(newStates);
    const taskId = TASK_ITEMS[index].id;
    setFormData(prev => ({ ...prev, [taskId]: newStates[index] }));
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setFormData(prev => ({ ...prev, responsible_person_id: user.user_id.toString() }));
    setSearchQuery(user.user_login);
    setIsDropdownOpen(false);
  };

  const clearSelectedUser = () => {
    setSelectedUser(null);
    setFormData(prev => ({ ...prev, responsible_person_id: '' }));
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsDropdownOpen(true);
    if (!value.trim()) {
      setSelectedUser(null);
      setFormData(prev => ({ ...prev, responsible_person_id: '' }));
    }
  };

  const handleTagSelect = (tag: Tag) => {
    if (!selectedTags.find(t => t.tag_id === tag.tag_id)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setTagSearchQuery('');
    setIsTagDropdownOpen(false);
  };

  const handleTagRemove = (tagId: number) => {
    setSelectedTags(selectedTags.filter(t => t.tag_id !== tagId));
  };

  const handleCreateTag = async () => {
    if (!tagSearchQuery.trim()) return;
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagSearchQuery }),
      });
      if (response.ok) {
        const newTag = await response.json();
        setTags([...tags, newTag]);
        setSelectedTags([...selectedTags, newTag]);
        setTagSearchQuery('');
        setIsTagDropdownOpen(false);
      }
    } catch (error) {
      console.error('Ошибка создания тега:', error);
    }
  };

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()) &&
    !selectedTags.find(t => t.tag_id === tag.tag_id)
  );

  const filteredUsers = users.filter(user =>
    user.user_login.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.post_title.trim() || !deadline) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createPost.mutateAsync({
        ...formData,
        post_deadline: deadline.toISOString(),
        post_description: formData.post_description || null,
        tz_link: formData.tz_link || null,
        responsible_person_id: formData.responsible_person_id || null,
        tag_ids: selectedTags.map(t => t.tag_id),
      });
      onClose();
    } catch (error) {
      console.error('Ошибка при создании поста:', error);
      setError(error instanceof Error ? error.message : 'Произошла неизвестная ошибка');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.header}>
            <h2 className={styles.headerTitle}>Новый пост</h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={styles.closeButton}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className={styles.errorBox}>
              <svg className={styles.errorIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <div className={styles.fieldGroup}>
            <input
              type="text"
              name="post_title"
              value={formData.post_title}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              className={styles.input}
              placeholder="Название поста..."
            />
          </div>

          <div className={styles.fieldGroup}>
            <AutoResizeTextarea
              value={formData.post_description}
              onChange={(e) => setFormData(prev => ({ ...prev, post_description: e.target.value }))}
              placeholder="Описание поста..."
              disabled={isSubmitting}
              className={styles.descriptionTextarea}
            />
          </div>

          <div className={styles.fieldGroup}>
            <input
              type="text"
              name="tz_link"
              value={formData.tz_link}
              onChange={handleChange}
              disabled={isSubmitting}
              className={styles.input}
              placeholder="Ссылка на ТЗ..."
            />
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.tagSelector} ref={tagDropdownRef}>
              <div className={styles.tagSelectorContainer}>
                {selectedTags.map(tag => (
                  <span
                    key={tag.tag_id}
                    className={styles.tagChip}
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag.tag_id)}
                      className={styles.tagRemove}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagSearchQuery}
                  onChange={(e) => { setTagSearchQuery(e.target.value); setIsTagDropdownOpen(true); }}
                  onFocus={() => setIsTagDropdownOpen(true)}
                  placeholder="Поиск или создание тега..."
                  className={styles.tagInput}
                />
              </div>
              {isTagDropdownOpen && (
                <div className={styles.tagDropdown}>
                  {filteredTags.map(tag => (
                    <div
                      key={tag.tag_id}
                      onClick={() => handleTagSelect(tag)}
                      className={styles.tagOption}
                    >
                      <span className={styles.tagColorDot} style={{ backgroundColor: tag.color }} />
                      {tag.name}
                    </div>
                  ))}
                  {tagSearchQuery && filteredTags.length === 0 && (
                    <div onClick={handleCreateTag} className={styles.createTagOption}>
                      + Создать "{tagSearchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div ref={dropdownRef} className={styles.dropdownWrapper}>
            <div className={styles.searchInputWrapper}>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Поиск ответственного..."
                disabled={isSubmitting}
                className={styles.searchInput}
              />
              <Search className={styles.searchIcon} />
              {selectedUser && (
                <button
                  type="button"
                  onClick={clearSelectedUser}
                  className={styles.clearButton}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {loadingUsers && users.length === 0 && (
              <span className={styles.loader}>Загрузка...</span>
            )}
            {isDropdownOpen && filteredUsers.length > 0 && (
              <div className={styles.dropdown}>
                {filteredUsers.map(user => (
                  <div
                    key={user.user_id}
                    onClick={() => handleUserSelect(user)}
                    className={selectedUser?.user_id === user.user_id ? styles.dropdownItemSelected : styles.dropdownItem}
                  >
                    <div className={styles.userName}>{user.user_login}</div>
                    <div className={styles.userRoles}>
                      {[
                        user.admin_role && 'Админ',
                        user.coordinator_role && 'Координатор',
                        user.designer_role && 'Дизайнер',
                        user.SMM_role && 'SMM',
                        user.photographer_role && 'Фотограф'
                      ].filter(Boolean).join(' • ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <DatePicker
              value={deadline}
              onChange={setDeadline}
              showTimeSelect
            />
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.taskButtonsContainer}>
              {TASK_ITEMS.map((task, index) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => handleTaskToggle(index)}
                  className={`${styles.taskButton} ${
                    taskStates[index] ? styles.taskButtonSelected : styles.taskButtonDefault
                  }`}
                >
                  {task.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={`${styles.button} ${styles.buttonCancel}`}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${styles.button} ${styles.buttonSubmit}`}
            >
              {isSubmitting ? 'Создание...' : 'Создать пост'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};