import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '../../services/userService';

interface User {
  id: number;
  name: string;
  email: string;
}

const UserList: React.FC = () => {
  const { data, isLoading, error } = useQuery<User[], Error>({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  if (isLoading) return <div>Loading users...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>User List (React Query)</h3>
      <ul>
        {data?.map((user) => (
          <li key={user.id}>
            {user.name} ({user.email})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;
