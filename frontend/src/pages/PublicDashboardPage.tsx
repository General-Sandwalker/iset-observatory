import { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Space, Typography, Tag, Spin, Empty,
  Button, theme, Grid, Avatar, Divider, Modal, List,
} from 'antd';
import {
  AppstoreOutlined, FileTextOutlined, BarChartOutlined,
  ThunderboltOutlined, EyeOutlined, LoginOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import type { Report } from '../lib/types';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

export default function PublicDashboardPage() {
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const navigate = useNavigate();

  const [dashboards, setDashboards] = useState<any[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    async function fetchPublic() {
      setLoading(true);
      try {
        const [dashRes, repRes] = await Promise.all([
          api.get('/public/dashboards'),
          api.get('/public/reports'),
        ]);
        setDashboards(dashRes.data.data || []);
        setReports(repRes.data.data || []);
      } catch {
        // silently fail — public endpoints
      } finally {
        setLoading(false);
      }
    }
    fetchPublic();
  }, []);

  const handleViewReport = useCallback(async (reportId: number) => {
    try {
      const res = await api.get(`/public/reports/${reportId}`);
      setViewReport(res.data.data);
      setReportModalOpen(true);
    } catch {
      // ignore
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: token.colorBgLayout,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorInfo} 100%)`,
        padding: isMobile ? '32px 16px' : '48px 24px',
        color: '#fff',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-40px', left: '-40px',
          width: 140, height: 140, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64, borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.15)',
            border: '2px solid rgba(255,255,255,0.3)',
            marginBottom: 16,
          }}>
            <ThunderboltOutlined style={{ fontSize: 32, color: '#fff' }} />
          </div>
          <Title level={2} style={{ color: '#fff', margin: 0, marginBottom: 8 }}>
            ISET Observatory
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, marginBottom: 20 }}>
            Public Dashboards & Reports
          </Paragraph>
          <Button
            ghost
            icon={<LoginOutlined />}
            onClick={() => navigate('/login')}
            style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff' }}
          >
            Sign in to access more
          </Button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, width: '100%', margin: '0 auto', padding: isMobile ? '24px 16px' : '32px 24px', flex: 1 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
            <Spin size="large" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* Published Dashboards */}
            <div>
              <Space style={{ marginBottom: 16 }}>
                <AppstoreOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
                <Title level={4} style={{ margin: 0 }}>Published Dashboards</Title>
                <Tag color="blue">{dashboards.length}</Tag>
              </Space>
              {dashboards.length === 0 ? (
                <Card>
                  <Empty
                    description="No dashboards have been published yet."
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </Card>
              ) : (
                <Row gutter={[16, 16]}>
                  {dashboards.map((db) => {
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
                              <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>
                                {chartCount} chart{chartCount !== 1 ? 's' : ''}
                              </Tag>
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
            </div>

            {/* Published Reports */}
            <div>
              <Space style={{ marginBottom: 16 }}>
                <FileTextOutlined style={{ fontSize: 20, color: token.colorSuccess }} />
                <Title level={4} style={{ margin: 0 }}>Published Reports</Title>
                <Tag color="green">{reports.length}</Tag>
              </Space>
              {reports.length === 0 ? (
                <Card>
                  <Empty
                    description="No reports have been published yet."
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </Card>
              ) : (
                <List
                  dataSource={reports}
                  renderItem={(report) => (
                    <List.Item
                      style={{
                        padding: '12px 16px',
                        borderRadius: token.borderRadius,
                        border: `1px solid ${token.colorBorderSecondary}`,
                        marginBottom: 8,
                      }}
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
                            size={36}
                            style={{
                              background: `linear-gradient(135deg, ${token.colorSuccess}, ${token.colorSuccessActive})`,
                              borderRadius: 8,
                            }}
                          >
                            <FileTextOutlined style={{ fontSize: 16 }} />
                          </Avatar>
                        }
                        title={
                          <Space>
                            <Text strong>{report.title}</Text>
                            <Tag style={{ fontSize: 10 }}>{report.report_type}</Tag>
                          </Space>
                        }
                        description={
                          <Space size={8}>
                            {report.client_name && <Text type="secondary" style={{ fontSize: 12 }}>Client: {report.client_name}</Text>}
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
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '20px 24px',
        textAlign: 'center',
        borderTop: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgContainer,
      }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          ISET Tozeur — Adaptive Digital Observatory
        </Text>
      </div>

      {/* View Report Modal */}
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
