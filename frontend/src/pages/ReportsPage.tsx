import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card, Row, Col, Button, Space, Typography, Table, Tag, Spin, Empty,
  Modal, Form, Input, Select, Popconfirm, message, theme, Grid, Tooltip,
  Switch, Avatar, Statistic, Divider, Alert,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  FileTextOutlined, RobotOutlined, DeleteOutlined, EditOutlined,
  ReloadOutlined, EyeOutlined, GlobalOutlined,
  LockOutlined, SearchOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import api from '../lib/api';
import type { Report, Client, Dataset } from '../lib/types';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const { TextArea } = Input;

const REPORT_TYPE_COLORS: Record<string, string> = {
  performance: 'blue',
  academic: 'green',
  attendance: 'orange',
  general: 'default',
};

export default function ReportsPage() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [reports, setReports] = useState<Report[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateForm] = Form.useForm();
  const [generating, setGenerating] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewReport, setViewReport] = useState<Report | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [editing, setEditing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reportsRes, clientsRes, datasetsRes] = await Promise.all([
        api.get('/reports'),
        api.get('/clients').catch(() => ({ data: { data: [] } })),
        api.get('/datasets').catch(() => ({ data: { data: [] } })),
      ]);
      setReports(reportsRes.data.data || []);
      setClients(clientsRes.data.data || []);
      setDatasets((datasetsRes.data.data || []).filter((d: Dataset) => d.status === 'imported'));
    } catch {
      message.error(t('reports.fetchFailed'));
    } finally {
    setLoading(false);
  }
}, [t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGenerate = useCallback(async () => {
    try {
      const values = await generateForm.validateFields();
      setGenerating(true);
      await api.post('/reports/generate', {
        title: values.title,
        reportType: values.reportType || 'performance',
        clientId: values.clientId || undefined,
        datasetId: values.datasetId || undefined,
      });
      message.success(t('reports.generateSuccess'));
      setGenerateOpen(false);
      generateForm.resetFields();
      fetchData();
    } catch (err: any) {
      if (err.response?.data?.message) {
        message.error(err.response.data.message);
      } else if (!err.errorFields) {
        message.error(t('reports.generateFailed'));
      }
    } finally {
      setGenerating(false);
    }
  }, [generateForm, fetchData, t]);

  const handleTogglePublic = useCallback(async (report: Report) => {
    try {
      await api.put(`/reports/${report.id}`, { isPublic: !report.is_public });
      message.success(report.is_public ? t('reports.unpublished') : t('reports.published'));
      setReports((prev) => prev.map((r) => r.id === report.id ? { ...r, is_public: !r.is_public } : r));
    } catch {
  message.error('Failed to update report visibility.');
  }
}, [t]);

  const handleEdit = useCallback(async () => {
    if (!editingReport) return;
    try {
      const values = await editForm.validateFields();
      setEditing(true);
      await api.put(`/reports/${editingReport.id}`, {
      title: values.title,
      content: values.content,
      isPublic: values.isPublic,
    });
    message.success('Report updated.');
      setEditOpen(false);
      editForm.resetFields();
      setEditingReport(null);
      fetchData();
    } catch (err: any) {
      if (err.response?.data?.message) {
        message.error(err.response.data.message);
      }
    } finally {
      setEditing(false);
    }
  }, [editingReport, editForm, fetchData]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await api.delete(`/reports/${id}`);
      message.success(t('reports.deleteSuccess'));
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch {
  message.error(t('reports.deleteFailed'));
  }
}, [t]);

  const filteredReports = reports.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.report_type.toLowerCase().includes(q) ||
      (r.client_name || '').toLowerCase().includes(q) ||
      (r.created_by_name || '').toLowerCase().includes(q)
    );
  });

  const stats = {
    total: reports.length,
    public: reports.filter((r) => r.is_public).length,
    performance: reports.filter((r) => r.report_type === 'performance').length,
  };

  const columns: ColumnsType<Report> = [
    {
      title: t('common.title'),
      key: 'report',
      ellipsis: true,
      render: (_: unknown, r: Report) => (
        <Space size={10}>
          <Avatar
            size={32}
            style={{
              background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorInfo})`,
              borderRadius: 8,
              flexShrink: 0,
            }}
          >
            <FileTextOutlined style={{ fontSize: 14 }} />
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <Text strong style={{ display: 'block', fontSize: 13 }}>{r.title}</Text>
            <Space size={4} style={{ marginTop: 2 }}>
              <Tag color={REPORT_TYPE_COLORS[r.report_type] || 'default'} style={{ margin: 0, fontSize: 10 }}>
                {r.report_type}
              </Tag>
              {r.client_name && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {r.client_name}
                </Text>
              )}
            </Space>
          </div>
        </Space>
      ),
    },
    {
    title: t('common.active'),
    key: 'is_public',
    width: 100,
    responsive: ['md' as const],
    render: (_: unknown, r: Report) => (
      <Popconfirm
        title={r.is_public ? t('reports.unpublishConfirm') : t('reports.publishConfirm')}
        description={r.is_public ? t('reports.unpublishDesc') : t('reports.publishDesc')}
        onConfirm={() => handleTogglePublic(r)}
        okText={r.is_public ? 'Unpublish' : 'Publish'}
        cancelText={t('common.cancel')}
      >
        <Tag
          color={r.is_public ? 'green' : 'default'}
          icon={r.is_public ? <GlobalOutlined /> : <LockOutlined />}
          style={{ margin: 0, cursor: 'pointer' }}
        >
          {r.is_public ? t('common.public') : t('common.private')}
        </Tag>
      </Popconfirm>
    ),
    },
    {
      title: 'Created By',
      dataIndex: 'created_by_name',
      key: 'created_by_name',
      width: 130,
      responsive: ['lg' as const],
      render: (v: string) => <Text type="secondary" style={{ fontSize: 12 }}>{v || '—'}</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 110,
      responsive: ['md' as const],
      render: (v: string) => <Text type="secondary" style={{ fontSize: 12 }}>{new Date(v).toLocaleDateString()}</Text>,
    },
    {
      title: '',
      key: 'actions',
      width: 140,
      align: 'right' as const,
      render: (_: unknown, r: Report) => (
        <Space size={4}>
        <Tooltip title={t('reports.viewReport')}>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            aria-label="View report"
            onClick={async () => {
                try {
                  const res = await api.get(`/reports/${r.id}`);
                  setViewReport(res.data.data);
                  setViewOpen(true);
                } catch {
                  message.error('Failed to load report.');
                }
              }}
            />
          </Tooltip>
            <Tooltip title={t('reports.editReport')}>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                aria-label="Edit report"
                onClick={() => {
                setEditingReport(r);
                editForm.setFieldsValue({
                  title: r.title,
                  content: r.content,
                  isPublic: r.is_public,
                });
                setEditOpen(true);
              }}
            />
          </Tooltip>
            <Tooltip title={r.is_public ? t('reports.unpublishConfirm') : t('reports.publishConfirm')}>
              <Popconfirm
        title={r.is_public ? t('reports.unpublishConfirm') : t('reports.publishConfirm')}
        description={r.is_public ? t('reports.unpublishDesc') : 'It will be visible to anyone.'}
        onConfirm={() => handleTogglePublic(r)}
        okText={r.is_public ? 'Unpublish' : 'Publish'}
        cancelText={t('common.cancel')}
              >
                <Button
                  type="text"
                  size="small"
                  icon={r.is_public ? <LockOutlined /> : <GlobalOutlined />}
                />
              </Popconfirm>
            </Tooltip>
          <Popconfirm
      title={t('reports.deleteConfirm')}
      onConfirm={() => handleDelete(r.id)}
      okText={t('common.delete')}
            okButtonProps={{ danger: true }}
          >
              <Tooltip title={t('common.delete')}>
                <Button type="text" size="small" danger icon={<DeleteOutlined />} aria-label="Delete report" />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={12}>
          <Space size="middle">
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorInfo})`,
            }}>
              <FileTextOutlined style={{ color: '#fff', fontSize: 22 }} />
            </div>
            <div>
      <Title level={4} style={{ margin: 0 }}>{t('reports.title')}</Title>
        <Text type="secondary">{t('reports.subtitle')}</Text>
            </div>
          </Space>
        </Col>
        <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
          <Space wrap>
        <Button type="primary" icon={<RobotOutlined />} onClick={() => { generateForm.resetFields(); setGenerateOpen(true); }}>
          {t('reports.generate')}
        </Button>
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined spin={loading} />} onClick={fetchData} />
            </Tooltip>
          </Space>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        <Col xs={8}>
          <Card size="small" style={{ borderColor: token.colorPrimary, background: token.colorPrimaryBg }} styles={{ body: { padding: '12px 16px' } }}>
            <Statistic title={t('common.title')} value={stats.total} valueStyle={{ fontSize: 22, color: token.colorPrimary }} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small" style={{ borderColor: token.colorSuccess, background: token.colorSuccessBg }} styles={{ body: { padding: '12px 16px' } }}>
            <Statistic title={t('reports.published')} value={stats.public} valueStyle={{ fontSize: 22, color: token.colorSuccess }} prefix={<GlobalOutlined />} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small" style={{ borderColor: token.colorInfo, background: token.colorInfoBg }} styles={{ body: { padding: '12px 16px' } }}>
            <Statistic title={t('reports.performance')} value={stats.performance} valueStyle={{ fontSize: 22, color: token.colorInfo }} />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: token.colorPrimary }} />
            <Text strong>{t('reports.title')}</Text>
            <Tag>{reports.length}</Tag>
          </Space>
        }
        extra={
          <Input
            placeholder={t('common.search')}
            prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: isMobile ? '100%' : 220 }}
            size="small"
          />
        }
      >
        {filteredReports.length === 0 ? (
          <Empty
            description={search ? t('common.noData') : t('common.noData')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            dataSource={filteredReports}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (total) => `${total} ${t('reports.title').toLowerCase()}` }}
            scroll={{ x: 600 }}
            size="middle"
          />
        )}
      </Card>

      {/* Generate Report Modal */}
      <Modal
        title={<Space><RobotOutlined style={{ color: token.colorPrimary }} /> {t('reports.generateTitle')}</Space>}
        open={generateOpen}
        onCancel={() => { setGenerateOpen(false); generateForm.resetFields(); }}
        onOk={handleGenerate}
        okText={t('reports.generate')}
        confirmLoading={generating}
        width={560}
      >
        <Alert
          type="info"
          showIcon
          icon={<ThunderboltOutlined />}
          message="AI-Powered Report"
          description="The AI will analyze the selected client and dataset to generate a comprehensive performance report. This may take a few seconds."
          style={{ marginBottom: 16 }}
        />
        <Form form={generateForm} layout="vertical" requiredMark={false} initialValues={{ reportType: 'performance' }}>
    <Form.Item label={t('common.title')} name="title" rules={[{ required: true, message: t('common.required') }]}>
      <Input placeholder="e.g. Academic Performance Report — Spring 2025" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
      <Form.Item label={t('reports.reportType')} name="reportType">
        <Select
          options={[
            { value: 'performance', label: t('reports.performance') },
            { value: 'academic', label: t('reports.summary') },
            { value: 'attendance', label: t('reports.attendance') },
            { value: 'general', label: t('reports.custom') },
          ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
      <Form.Item label={t('reports.selectClient')} name="clientId">
        <Select
          placeholder={t('reports.selectClient')}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={clients.map((c) => ({
                    value: c.id,
                    label: `${c.full_name} (${c.cin})`,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
    <Form.Item label={t('reports.selectDataset')} name="datasetId">
      <Select
        placeholder={t('reports.selectDataset')}
              allowClear
              showSearch
              optionFilterProp="label"
              options={datasets.map((d) => ({
                value: d.id,
                label: `${d.name} (${d.row_count} rows)`,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* View Report Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined style={{ color: token.colorPrimary }} />
            <span>{viewReport?.title}</span>
            {viewReport?.is_public ? <Tag color="green" icon={<GlobalOutlined />}>{t('common.public')}</Tag> : <Tag icon={<LockOutlined />}>{t('common.private')}</Tag>}
          </Space>
        }
        open={viewOpen}
        onCancel={() => { setViewOpen(false); setViewReport(null); }}
        footer={[
          <Button key="close" onClick={() => { setViewOpen(false); setViewReport(null); }}>{t('common.close')}</Button>,
        ]}
        width={720}
      >
        {viewReport && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Space wrap>
              <Tag color={REPORT_TYPE_COLORS[viewReport.report_type] || 'default'}>{viewReport.report_type}</Tag>
              {viewReport.client_name && <Tag><Text style={{ fontSize: 12 }}>Client: {viewReport.client_name}</Text></Tag>}
              {viewReport.client_cin && <Tag><Text code style={{ fontSize: 11 }}>CIN: {viewReport.client_cin}</Text></Tag>}
              <Text type="secondary" style={{ fontSize: 12 }}>
                {new Date(viewReport.created_at).toLocaleDateString()}
              </Text>
            </Space>
            <Divider style={{ margin: 0 }} />
            <div
              style={{
                maxHeight: 500,
                overflow: 'auto',
                padding: '8px 4px',
                lineHeight: 1.7,
                fontSize: 14,
              }}
            >
              {viewReport.content.split('\n').map((line, i) => {
                if (line.startsWith('# ')) return <Title key={i} level={3} style={{ marginTop: 16 }}>{line.replace('# ', '')}</Title>;
                if (line.startsWith('## ')) return <Title key={i} level={4} style={{ marginTop: 12 }}>{line.replace('## ', '')}</Title>;
                if (line.startsWith('### ')) return <Title key={i} level={5} style={{ marginTop: 8 }}>{line.replace('### ', '')}</Title>;
                if (line.startsWith('- ') || line.startsWith('* ')) return <div key={i} style={{ paddingLeft: 16 }}>&bull; {line.replace(/^[-*] /, '')}</div>;
                if (line.startsWith('**') && line.endsWith('**')) return <Text key={i} strong style={{ display: 'block' }}>{line.replace(/\*\*/g, '')}</Text>;
                if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
                return <div key={i}>{line}</div>;
              })}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Report Modal */}
      <Modal
        title={<Space><EditOutlined style={{ color: token.colorPrimary }} /> {t('reports.editReport')}</Space>}
        open={editOpen}
        onCancel={() => { setEditOpen(false); editForm.resetFields(); setEditingReport(null); }}
        onOk={handleEdit}
        okText={t('common.save')}
        confirmLoading={editing}
        width={640}
      >
        <Form form={editForm} layout="vertical" requiredMark={false}>
    <Form.Item label={t('common.title')} name="title" rules={[{ required: true, message: t('common.required') }]}>
      <Input />
    </Form.Item>
    <Form.Item label={t('common.description')} name="content" rules={[{ required: true, message: t('common.required') }]}>
            <TextArea rows={12} style={{ fontFamily: 'monospace', fontSize: 13 }} />
          </Form.Item>
    <Form.Item label={t('reports.published')} name="isPublic" valuePropName="checked">
      <Switch checkedChildren={t('common.public')} unCheckedChildren={t('common.private')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
