'use client';

import { useState } from 'react';
import { useUser } from '@/hooks/use-roles';
import { useAdminUsers } from '@/hooks/use-admin-users';
import { useAdminFilter } from '@/hooks/use-admin-filter'; // Импортируем хук
import { SearchInput } from '@/components/ui/search-input/search-input';
import { ActionButton } from '@/components/ui/action-button/action-button';
import { Plus } from 'lucide-react';
import UserTable from '@/components/admin/user-table/user-table';
import UserForm from '@/components/admin/user-form/user-form';
import DeleteModal from '@/components/admin/user-form/delete-modal';
import styles from './AdminPage.module.css';

export default function AdminPage() {
  const { isAdmin, loading: userLoading } = useUser();
  const { users, isLoading, createUser, updateUser, deleteUser } = useAdminUsers();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ПРИМЕНЯЕМ ХУК ФИЛЬТРАЦИИ
  const filteredUsers = useAdminFilter(users, searchQuery);

  if (userLoading || isLoading) return null;
  if (!isAdmin) return <div style={{ color: '#fff', padding: '100px', textAlign: 'center' }}>Нет доступа</div>;

  const handleEdit = (user: any) => {
    setTargetUser(user);
    setModalOpen(true);
  };

  const handleCreateClick = () => {
    setTargetUser(null);
    setModalOpen(true);
  };

  const handleDeleteClick = (user: any) => {
    setTargetUser(user);
    setDeleteModalOpen(true);
  };

  const handleSave = async (data: any) => {
    if (targetUser) {
      await updateUser.mutateAsync({ id: targetUser.user_id, ...data });
    } else {
      await createUser.mutateAsync(data);
    }
    setModalOpen(false);
  };

  const confirmDelete = async () => {
    if (targetUser) {
      await deleteUser.mutateAsync(targetUser.user_id);
      setDeleteModalOpen(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Пользователи</h1>
          <div className={styles.headerActions}>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Поиск по логину..."
              showHistory={false} // ОТКЛЮЧАЕМ ИСТОРИЮ
            />
            <ActionButton variant="base" icon={Plus} className={styles.btnPrimary} onClick={handleCreateClick}>
              Добавить
            </ActionButton>
          </div>
        </div>
        <UserTable users={filteredUsers} onEdit={handleEdit} onDelete={handleDeleteClick} />
      </div>
      {modalOpen && <UserForm user={targetUser} onClose={() => setModalOpen(false)} onSave={handleSave} />}
      {deleteModalOpen && targetUser && <DeleteModal user={targetUser} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} />}
    </div>
  );
}