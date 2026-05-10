import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Spin, theme, Typography } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

interface Props {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const { token } = theme.useToken();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: token.colorBgLayout,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          className="obs-pulse"
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${token.colorPrimaryBg} 0%, transparent 70%)`,
          }}
        />
        <div
          className="obs-pulse"
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '-80px',
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${token.colorInfoBg || token.colorPrimaryBg} 0%, transparent 70%)`,
            animationDelay: '1s',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            className="obs-float"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorInfo} 100%)`,
              marginBottom: 20,
              boxShadow: `0 8px 32px ${token.colorPrimaryBg}`,
            }}
          >
            <ThunderboltOutlined style={{ fontSize: 34, color: '#fff' }} />
          </div>

          <Title
            level={4}
            style={{
              margin: 0,
              marginBottom: 4,
              color: token.colorText,
            }}
          >
            ISET Observatory
          </Title>
          <Text
            type="secondary"
            style={{
              marginBottom: 28,
              fontSize: 13,
            }}
          >
            {t('common.loading')}
          </Text>

          <Spin size="large" />

          <div
            className="obs-shimmer-bar"
            style={{
              marginTop: 32,
              width: 160,
              height: 3,
              borderRadius: 2,
              background: `linear-gradient(90deg, transparent, ${token.colorPrimary}, transparent)`,
              backgroundSize: '200% 100%',
              animation: 'obs-shimmer 2s linear infinite',
            }}
          />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
