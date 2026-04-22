import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useAdminUsers() {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => fetch('/api/admin/users').then(res => res.json())
  });

  const createUser = useMutation({
    mutationFn: (newUser: any) => fetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(newUser)
    }).then(res => res.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  });

  const updateUser = useMutation({
    mutationFn: ({ id, ...data }: any) => fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  });

  const deleteUser = useMutation({
    mutationFn: (id: number) => fetch(`/api/admin/users/${id}`, {
      method: 'DELETE'
    }).then(res => res.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  });

  return { users, isLoading, createUser, updateUser, deleteUser };
}