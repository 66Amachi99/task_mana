'use client';
import { ActionButton } from '@/components/ui/action-button/action-button';
import { Pencil, Trash2 } from 'lucide-react';
import styles from './UserTable.module.css';

export default function UserTable({ users, onEdit, onDelete }: any) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Логин</th>
            <th>Роли</th>
            <th style={{ textAlign: 'right' }}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user: any) => (
            <tr key={user.user_id}>
              <td className={styles.userLogin}>{user.user_login}</td>
              <td>
                <div className={styles.rolesList}>
                  {user.admin_role && <span className={`${styles.roleBadge} ${styles.roleBadgeAdmin}`}>Админ</span>}
                  {user.SMM_role && <span className={`${styles.roleBadge} ${styles.roleBadgeSmm}`}>SMM</span>}
                  {user.designer_role && <span className={`${styles.roleBadge} ${styles.roleBadgeDesigner}`}>Дизайнер</span>}
                  {user.coordinator_role && <span className={`${styles.roleBadge} ${styles.roleBadgeCoordinator}`}>Координатор</span>}
                  {user.photographer_role && <span className={`${styles.roleBadge} ${styles.roleBadgePhotographer}`}>Фотограф</span>}
                </div>
              </td>
              <td>
                <div className={styles.actionsCell}>
                  <ActionButton 
                    variant="base" 
                    icon={Pencil}
                    onClick={() => onEdit(user)}
                    className={styles.btnAction}
                  >
                    {""}
                  </ActionButton>
                  
                  <ActionButton 
                    variant="red" 
                    icon={Trash2}
                    onClick={() => onDelete(user)}
                    className={`${styles.btnAction} ${styles.btnDanger}`}
                  >
                    {""}
                  </ActionButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}