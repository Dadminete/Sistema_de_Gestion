import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../../services/userService';
import type { UserWithRoles } from '../../types/database';

const UserList: React.FC = () => {
  const { data, isLoading, error } = useQuery<UserWithRoles[], Error>({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  if (isLoading) return <div>Loading users...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>User List (React Query)</h3>
      <ul>
        {data?.map((user) => (
          <li key={user.id}>
            {user.username || `${user.nombre} ${user.apellido}`} ({user.email || 'sin email'})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;
