import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card, Row, Col, Space, Typography, Tag, Spin, Empty,
  message, theme, Avatar, Divider, List, Modal, Button, Input, Rate, Checkbox, Radio, Select,
} from 'antd';
import {
  AppstoreOutlined, FileTextOutlined, RobotOutlined,
  GlobalOutlined, EyeOutlined,
  BarChartOutlined, UserOutlined,
  SendOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { Report, Dashboard, SurveyField } from '../lib/types';

const { Title, Text, Paragraph } = Typography;

export default function ClientDashboardPage() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { user } = useAuth();

  const clientId = user?.userType === 'client' ? user.id : undefined;
  const clientType = user?.userType === 'client' ? user.role : undefined;
  const clientName = user?.userType === 'client' ? (user.fullName || user.full_name) : undefined;
  const clientCin = user?.userType === 'client' ? user.cin : undefined;

  const [publicDashboards, setPublicDashboards] = useState<Dashboard[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const [surveyModalOpen, setSurveyModalOpen] = useState(false);
  const [activeSurvey, setActiveSurvey] = useState<any | null>(null);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, any>>({});
  const [surveySubmitting, setSurveySubmitting] = useState(false);
  const [surveySubmitted, setSurveySubmitted] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, repRes, surveyRes] = await Promise.all([
        api.get('/public/dashboards'),
        clientId
          ? api.get('/client/reports').then((r) => r.data.data || [])
          : api.get('/public/reports').then((r) => r.data.data || []),
        clientId
          ? api.get('/client/surveys').then((r) => r.data.data || [])
          : api.get('/public/surveys').then((r) => r.data.data || []),
      ]);
      setPublicDashboards(dashRes.data.data || []);
      setReports(repRes as Report[]);
      setSurveys(surveyRes as any[]);
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

  function openSurveyModal(s: any) {
    setActiveSurvey(s);
    setSurveyAnswers({});
    setSurveySubmitted(false);
    setSurveyModalOpen(true);
  }

  function setSurveyAnswer(fieldId: string, value: any) {
    setSurveyAnswers((prev) => ({ ...prev, [fieldId]: value }));
  }

  async function handleSurveySubmit() {
    if (!activeSurvey || surveySubmitting) return;
    const schema = activeSurvey.schema || activeSurvey;
    const requiredFields = (schema.fields || []).filter((f: SurveyField) => f.required);
    const missing = requiredFields.filter((f: SurveyField) => {
      const val = surveyAnswers[f.id];
      if (val === undefined || val === null || val === '') return true;
      if (Array.isArray(val) && val.length === 0) return true;
      return false;
    });
    if (missing.length > 0) {
      message.error(t('surveys.requiredFieldsMissing'));
      return;
    }
    setSurveySubmitting(true);
    try {
      const endpoint = clientId ? `/client/surveys/${activeSurvey.id}/responses` : `/public/surveys/${activeSurvey.id}/responses`;
      await api.post(endpoint, { answers: surveyAnswers });
      setSurveySubmitted(true);
      message.success(t('surveys.submitSuccess'));
      await fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      message.error(msg || t('surveys.submitFailed'));
    } finally {
      setSurveySubmitting(false);
    }
  }

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
            <Col xs={12} sm={6}>
              <Card size="small" style={{ borderColor: token.colorPrimary, background: token.colorPrimaryBg, textAlign: 'center' }} styles={{ body: { padding: '16px' } }}>
                <AppstoreOutlined style={{ fontSize: 24, color: token.colorPrimary, marginBottom: 8 }} />
                <div style={{ fontSize: 24, fontWeight: 700, color: token.colorPrimary }}>{publicDashboards.length}</div>
                <Text type="secondary" style={{ fontSize: 12 }}>Dashboards</Text>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" style={{ borderColor: token.colorSuccess, background: token.colorSuccessBg, textAlign: 'center' }} styles={{ body: { padding: '16px' } }}>
                <FileTextOutlined style={{ fontSize: 24, color: token.colorSuccess, marginBottom: 8 }} />
                <div style={{ fontSize: 24, fontWeight: 700, color: token.colorSuccess }}>{reports.length}</div>
                <Text type="secondary" style={{ fontSize: 12 }}>Reports</Text>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" style={{ borderColor: token.colorInfo, background: token.colorInfoBg, textAlign: 'center' }} styles={{ body: { padding: '16px' } }}>
                <RobotOutlined style={{ fontSize: 24, color: token.colorInfo, marginBottom: 8 }} />
                <div style={{ fontSize: 24, fontWeight: 700, color: token.colorInfo }}>
                  {reports.filter((r) => r.report_type === 'performance').length}
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>AI Reports</Text>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" style={{ borderColor: token.colorWarning, background: token.colorWarningBg, textAlign: 'center' }} styles={{ body: { padding: '16px' } }}>
                <FileTextOutlined style={{ fontSize: 24, color: token.colorWarning, marginBottom: 8 }} />
                <div style={{ fontSize: 24, fontWeight: 700, color: token.colorWarning }}>{surveys.length}</div>
                <Text type="secondary" style={{ fontSize: 12 }}>Surveys</Text>
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

            <Card
              title={
                <Space>
                  <FileTextOutlined style={{ color: token.colorWarning }} />
                  <Text strong>{t('portal.surveys')}</Text>
                  <Tag color="orange">{surveys.length}</Tag>
                </Space>
              }
            >
              {surveys.length === 0 ? (
                <Empty
                  description={t('portal.noSurveys')}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <List
                  dataSource={surveys}
                  renderItem={(survey: any) => (
                    <List.Item
                      actions={[
                        survey.has_responded ? (
                          <Tag color="green" icon={<CheckCircleOutlined />} key="done">{t('portal.responded')}</Tag>
                        ) : (
                          <Button
                            type="primary"
                            size="small"
                            icon={<SendOutlined />}
                            key="respond"
                            onClick={() => openSurveyModal(survey)}
                          >
                            {t('portal.respond')}
                          </Button>
                        ),
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            size={40}
                            style={{
                              background: `linear-gradient(135deg, ${token.colorWarning}, ${token.colorWarningActive})`,
                              borderRadius: 10,
                            }}
                          >
                            <FileTextOutlined style={{ fontSize: 16 }} />
                          </Avatar>
                        }
                        title={
                          <Space>
                            <Text strong>{survey.title}</Text>
                            {survey.responses_count > 0 && (
                              <Tag style={{ fontSize: 10 }}>{survey.responses_count} {t('surveys.responsesLabel')}</Tag>
                            )}
                          </Space>
                        }
                        description={
                          <Space size={8}>
                            {survey.description && (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {survey.description.length > 80 ? survey.description.slice(0, 80) + '…' : survey.description}
                              </Text>
                            )}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
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

    <Modal
      title={
        <Space>
          <FileTextOutlined style={{ color: token.colorWarning }} />
          <span>{activeSurvey?.title}</span>
        </Space>
      }
      open={surveyModalOpen}
      onCancel={() => { setSurveyModalOpen(false); setActiveSurvey(null); }}
      footer={
        surveySubmitted
          ? [<Button key="close" type="primary" onClick={() => { setSurveyModalOpen(false); setActiveSurvey(null); }}>{t('common.close')}</Button>]
          : [
            <Button key="cancel" onClick={() => { setSurveyModalOpen(false); setActiveSurvey(null); }}>{t('common.cancel')}</Button>,
            <Button key="submit" type="primary" icon={<SendOutlined />} loading={surveySubmitting} onClick={handleSurveySubmit}>
              {t('surveys.submit')}
            </Button>,
          ]
      }
      width={640}
    >
      {activeSurvey && !surveySubmitted && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {activeSurvey.description && <Paragraph type="secondary">{activeSurvey.description}</Paragraph>}
          <Divider style={{ margin: 0 }} />
          {(activeSurvey.schema?.fields || []).map((field: SurveyField) => (
            <ClientSurveyField
              key={field.id}
              field={field}
              value={surveyAnswers[field.id]}
              onChange={(v) => setSurveyAnswer(field.id, v)}
            />
          ))}
        </div>
      )}
      {surveySubmitted && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: token.colorSuccess, marginBottom: 16 }} />
          <Title level={4}>{t('surveys.thankYou')}</Title>
          <Paragraph type="secondary">{t('surveys.thankYouDesc')}</Paragraph>
        </div>
      )}
    </Modal>
    </div>
  );
}

function ClientSurveyField({ field, value, onChange }: { field: SurveyField; value: any; onChange: (v: any) => void }) {
  const { token } = theme.useToken();
  const req = field.required ? <Text type="danger"> *</Text> : null;

  return (
    <div>
      <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6, color: token.colorText }}>
        {field.label} {req}
      </label>
      {(field.type === 'text' || field.type === 'email') && (
        <Input type={field.type} placeholder={field.placeholder} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      )}
      {field.type === 'date' && (
        <Input type="date" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      )}
      {field.type === 'number' && (
        <Input type="number" placeholder={field.placeholder} value={value ?? ''} onChange={(e) => onChange(e.target.value)} min={field.min} max={field.max} />
      )}
      {field.type === 'textarea' && (
        <Input.TextArea placeholder={field.placeholder} rows={3} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      )}
      {field.type === 'select' && (
        <Select style={{ width: '100%' }} placeholder={field.placeholder || 'Select…'} value={value ?? undefined} onChange={(v) => onChange(v)} options={field.options?.map((o) => ({ value: o, label: o }))} />
      )}
      {field.type === 'radio' && (
        <Radio.Group value={value ?? undefined} onChange={(e) => onChange(e.target.value)}>
          <Space direction="vertical">
            {field.options?.map((o) => <Radio key={o} value={o}>{o}</Radio>)}
          </Space>
        </Radio.Group>
      )}
      {field.type === 'checkbox' && (
        <Checkbox.Group value={value ?? []} onChange={(v) => onChange(v)}>
          <Space direction="vertical">
            {field.options?.map((o) => <Checkbox key={o} value={o}>{o}</Checkbox>)}
          </Space>
        </Checkbox.Group>
      )}
      {field.type === 'rating' && (
        <Rate count={field.max ?? 5} value={value ?? 0} onChange={(v) => onChange(v)} />
      )}
    </div>
  );
}
