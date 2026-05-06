import { Navigate } from 'react-router-dom';
import { Result, Button } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  roles?: string[];
}

export default function RoleRoute({ children, roles }: Props) {
  const { user } = useAuth();

  if (!roles || roles.length === 0) {
    return <>{children}</>;
  }

  if (user?.role && roles.includes(user.role)) {
    return <>{children}</>;
  }

  return (
    <Result
      status="403"
      title="403"
      subTitle="You don't have permission to access this page."
      extra={
        <Button type="primary" href="/dashboard">
          Back to Dashboard
        </Button>
      }
    />
  );
}
