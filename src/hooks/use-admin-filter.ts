import { useMemo } from 'react';

export function useAdminFilter(users: any[] | undefined, searchQuery: string) {
  return useMemo(() => {
    if (!users || !Array.isArray(users)) return [];
    const q = searchQuery.toLowerCase().trim();
    
    return users.filter((u: any) =>
      u.user_login?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);
}