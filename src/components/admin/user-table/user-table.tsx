'use client';
import styles from './UserTable.module.css';
import pageStyles from '@/app/(main)/admin/AdminPage.module.css';

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
                  <button className={pageStyles.btn} onClick={() => onEdit(user)}>
                    <svg className={pageStyles.icon} viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button className={`${pageStyles.btn} ${styles.btnDanger}`} onClick={() => onDelete(user)}>
                    <svg className={pageStyles.icon} viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}