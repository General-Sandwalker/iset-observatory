import { Navigate } from 'react-router-dom';
import { Result, Button } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  children: ReactNode;
  roles?: string[];
}

export default function RoleRoute({ children, roles }: Props) {
  const { user } = useAuth();
  const { t } = useTranslation();

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
    subTitle={t('auth.unauthorized')}
    extra={
      <Button type="primary" href="/dashboard">
        {t('auth.goBack')}
      </Button>
      }
    />
  );
}
