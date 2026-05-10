import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card, Row, Col, Space, Typography, Tag, Spin, Empty,
  message, theme, Grid, Avatar, Divider, List, Modal, Button,
} from 'antd';
import {
  AppstoreOutlined, FileTextOutlined, RobotOutlined,
  GlobalOutlined, EyeOutlined,
  BarChartOutlined, UserOutlined,
} from '@ant-design/icons';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { Report, Dashboard } from '../lib/types';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export default function ClientDashboardPage() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const { user } = useAuth();

  const clientId = user?.userType === 'client' ? user.id : undefined;
  const clientType = user?.userType === 'client' ? user.role : undefined;
  const clientName = user?.userType === 'client' ? (user.fullName || user.full_name) : undefined;
  const clientCin = user?.userType === 'client' ? user.cin : undefined;

  const [publicDashboards, setPublicDashboards] = useState<Dashboard[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, repRes] = await Promise.all([
        api.get('/public/dashboards'),
        clientId
          ? api.get('/client/reports').then((r) => r.data.data || [])
          : api.get('/public/reports').then((r) => r.data.data || []),
      ]);
      setPublicDashboards(dashRes.data.data || []);
      setReports(repRes as Report[]);
    } catch {
      message.error(t('portal.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleViewReport = useCallback(async (reportId: number) => {
    try {
      const endpoint = clientId ? `/client/reports/${reportId}` : `/public/reports/${reportId}`;
      const res = await api.get(endpoint);
      setViewReport(res.data.data);
      setReportModalOpen(true);
    } catch {
      message.error(t('portal.fetchFailed'));
    }
  }, [clientId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
        <Spin size="large" />
      </div>
    );
  }

  const typeLabel = clientType === 'alumni' ? 'Alumni' : clientType === 'teacher' ? 'Teacher' : 'Student';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={16}>
          <Space size="middle">
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorInfo})`,
            }}>
              <UserOutlined style={{ color: '#fff', fontSize: 24 }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0 }}>Client Portal</Title>
              <Space size={8}>
                <Text type="secondary">Welcome, {clientName || 'Client'}</Text>
                {clientCin && <Tag style={{ margin: 0 }}><Text code style={{ fontSize: 11 }}>{clientCin}</Text></Tag>}
                {clientType && <Tag color={clientType === 'student' ? 'blue' : clientType === 'alumni' ? 'green' : 'orange'}>{typeLabel}</Tag>}
              </Space>
            </div>
          </Space>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8}>
          <Card size="small" style={{ borderColor: token.colorPrimary, background: token.colorPrimaryBg, textAlign: 'center' }} styles={{ body: { padding: '16px' } }}>
            <AppstoreOutlined style={{ fontSize: 24, color: token.colorPrimary, marginBottom: 8 }} />
            <div style={{ fontSize: 24, fontWeight: 700, color: token.colorPrimary }}>{publicDashboards.length}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>Dashboards</Text>
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small" style={{ borderColor: token.colorSuccess, background: token.colorSuccessBg, textAlign: 'center' }} styles={{ body: { padding: '16px' } }}>
            <FileTextOutlined style={{ fontSize: 24, color: token.colorSuccess, marginBottom: 8 }} />
            <div style={{ fontSize: 24, fontWeight: 700, color: token.colorSuccess }}>{reports.length}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>Reports</Text>
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small" style={{ borderColor: token.colorInfo, background: token.colorInfoBg, textAlign: 'center' }} styles={{ body: { padding: '16px' } }}>
            <RobotOutlined style={{ fontSize: 24, color: token.colorInfo, marginBottom: 8 }} />
            <div style={{ fontSize: 24, fontWeight: 700, color: token.colorInfo }}>
              {reports.filter((r) => r.report_type === 'performance').length}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>AI Reports</Text>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: token.colorPrimary }} />
            <Text strong>My Performance Reports</Text>
            <Tag>{reports.length}</Tag>
          </Space>
        }
      >
        {reports.length === 0 ? (
          <Empty
            description="No reports available yet. Your reports will appear here once generated by staff."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={reports}
            renderItem={(report) => (
              <List.Item
                actions={[
                  <Button
                    type="primary"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewReport(report.id)}
                  >
                    View
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      size={40}
                      style={{
                        background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorInfo})`,
                        borderRadius: 10,
                      }}
                    >
                      <FileTextOutlined style={{ fontSize: 16 }} />
                    </Avatar>
                  }
                  title={
                    <Space>
                      <Text strong>{report.title}</Text>
                      <Tag color={report.report_type === 'performance' ? 'blue' : 'default'} style={{ fontSize: 10 }}>
                        {report.report_type}
                      </Tag>
                      {report.is_public && <Tag color="green" icon={<GlobalOutlined />} style={{ fontSize: 10 }}>Public</Tag>}
                    </Space>
                  }
                  description={
                    <Space size={8}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(report.created_at).toLocaleDateString()}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Card
        title={
          <Space>
            <AppstoreOutlined style={{ color: token.colorPrimary }} />
            <Text strong>Published Dashboards</Text>
            <Tag>{publicDashboards.length}</Tag>
          </Space>
        }
      >
        {publicDashboards.length === 0 ? (
          <Empty
            description="No published dashboards available yet."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Row gutter={[16, 16]}>
            {publicDashboards.map((db) => {
              const chartCount = Array.isArray(db.layout) ? db.layout.length : 0;
              return (
                <Col xs={24} sm={12} lg={8} key={db.id}>
                  <Card
                    hoverable
                    style={{ height: '100%' }}
                    styles={{ body: { display: 'flex', flexDirection: 'column', height: '100%' } }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <Avatar
                        size={36}
                        style={{
                          background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorInfo})`,
                          borderRadius: 8,
                          flexShrink: 0,
                        }}
                      >
                        <BarChartOutlined style={{ fontSize: 16 }} />
                      </Avatar>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Text strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {db.title}
                        </Text>
                        <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>{chartCount} chart{chartCount !== 1 ? 's' : ''}</Tag>
                      </div>
                    </div>
                    {db.description && (
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
                        {db.description}
                      </Text>
                    )}
                    <div style={{ marginTop: 'auto', borderTop: `1px solid ${token.colorBorderSecondary}`, paddingTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(db.created_at).toLocaleDateString()}
                        {db.created_by_name && ` · by ${db.created_by_name}`}
                      </Text>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Card>

      <Modal
        title={
          <Space>
            <FileTextOutlined style={{ color: token.colorPrimary }} />
            <span>{viewReport?.title}</span>
          </Space>
        }
        open={reportModalOpen}
        onCancel={() => { setReportModalOpen(false); setViewReport(null); }}
        footer={<Button onClick={() => { setReportModalOpen(false); setViewReport(null); }}>Close</Button>}
        width={720}
      >
        {viewReport && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Space wrap>
              <Tag color="blue">{viewReport.report_type}</Tag>
              {viewReport.client_name && <Tag>Client: {viewReport.client_name}</Tag>}
              <Text type="secondary" style={{ fontSize: 12 }}>
                {new Date(viewReport.created_at).toLocaleDateString()}
              </Text>
            </Space>
            <Divider style={{ margin: 0 }} />
            <div style={{ maxHeight: 500, overflow: 'auto', padding: '8px 4px', lineHeight: 1.7, fontSize: 14 }}>
              {viewReport.content.split('\n').map((line, i) => {
                if (line.startsWith('# ')) return <Title key={i} level={3} style={{ marginTop: 16 }}>{line.replace('# ', '')}</Title>;
                if (line.startsWith('## ')) return <Title key={i} level={4} style={{ marginTop: 12 }}>{line.replace('## ', '')}</Title>;
                if (line.startsWith('### ')) return <Title key={i} level={5} style={{ marginTop: 8 }}>{line.replace('### ', '')}</Title>;
                if (line.startsWith('- ') || line.startsWith('* ')) return <div key={i} style={{ paddingLeft: 16 }}>&bull; {line.replace(/^[-*] /, '')}</div>;
                if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
                return <div key={i}>{line}</div>;
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
