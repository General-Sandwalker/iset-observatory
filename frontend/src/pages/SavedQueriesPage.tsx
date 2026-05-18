import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card, Row, Col, Button, Space, Typography, Table, Input,
  Tag, Spin, Empty, Popconfirm, message, theme, Tooltip, Badge,
  Modal, Form, Switch, Tabs, Grid,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import {
  CodeOutlined, PlusOutlined, DeleteOutlined,
  PlayCircleOutlined, EditOutlined, SaveOutlined,
  RobotOutlined, GlobalOutlined, LockOutlined,
  ReloadOutlined, ThunderboltOutlined, TableOutlined,
  FileTextOutlined, BarChartOutlined,
  ClockCircleOutlined, SendOutlined,
} from '@ant-design/icons';
import api from '../lib/api';
import type { SavedQuery } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

function useModalWidth(maxWidth: number): number {
  const screens = useBreakpoint();
  if (!screens.md) return Math.min(maxWidth, window.innerWidth - 32);
  if (!screens.lg) return Math.min(maxWidth, window.innerWidth - 48);
  return Math.min(maxWidth, window.innerWidth - 64);
}

export default function SavedQueriesPage() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryModalWidth = useModalWidth(700);
  const resultsModalWidth = useModalWidth(1100);
  const aiModalWidth = useModalWidth(650);

  const [queries, setQueries] = useState<SavedQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mine');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuery, setEditingQuery] = useState<SavedQuery | null>(null);
  const [formIsPublic, setFormIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [queryForm] = Form.useForm();

  const [quickSql, setQuickSql] = useState('');
  const [quickExecuting, setQuickExecuting] = useState(false);
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [resultRows, setResultRows] = useState<Record<string, unknown>[]>([]);
  const [resultRowCount, setResultRowCount] = useState(0);
  const [resultExecutionTime, setResultExecutionTime] = useState<number | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsTitle, setResultsTitle] = useState('');

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGeneratedSql, setAiGeneratedSql] = useState('');

  const fetchQueries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/saved-queries');
      setQueries(res.data.data || []);
    } catch {
      message.error(t('queries.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQueries(); }, [fetchQueries]);

  const myQueries = useMemo(
    () => queries.filter((q) => q.created_by === user?.id),
    [queries, user],
  );
  const publicQueries = useMemo(
    () => queries.filter((q) => q.is_public && q.created_by !== user?.id),
    [queries, user],
  );

  const openCreateModal = useCallback(() => {
    setEditingQuery(null);
    queryForm.resetFields();
    setFormIsPublic(false);
    setModalOpen(true);
  }, [queryForm]);

  const openEditModal = useCallback((query: SavedQuery) => {
    setEditingQuery(query);
    queryForm.setFieldsValue({
      title: query.title,
      sql: query.sql,
      description: query.description || '',
    });
    setFormIsPublic(query.is_public);
    setModalOpen(true);
  }, [queryForm]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingQuery(null);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await queryForm.validateFields();
    } catch { return; }
    const values = queryForm.getFieldsValue();
    const formTitle = values.title?.trim();
    const formSql = values.sql?.trim();
    const formDescription = values.description?.trim();
    setSaving(true);
    try {
      if (editingQuery) {
        const res = await api.put(`/saved-queries/${editingQuery.id}`, {
          title: formTitle,
          sql: formSql,
          description: formDescription || undefined,
          isPublic: formIsPublic,
        });
        setQueries((prev) => prev.map((q) => (q.id === editingQuery.id ? res.data.data : q)));
        message.success(t('queries.updateSuccess'));
      } else {
        const res = await api.post('/saved-queries', {
          title: formTitle,
          sql: formSql,
          description: formDescription || undefined,
          isPublic: formIsPublic,
        });
        setQueries((prev) => [res.data.data, ...prev]);
        message.success(t('queries.saveSuccess'));
      }
      closeModal();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || t('queries.saveFailed');
      message.error(msg);
    } finally {
      setSaving(false);
    }
  }, [editingQuery, formIsPublic, closeModal, queryForm]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await api.delete(`/saved-queries/${id}`);
      setQueries((prev) => prev.filter((q) => q.id !== id));
      message.success(t('queries.deleteSuccess'));
    } catch {
      message.error(t('queries.deleteFailed'));
    }
  }, []);

  const executeQuery = useCallback(async (query: SavedQuery) => {
    setResultsLoading(true);
    setResultsModalOpen(true);
    setResultsTitle(query.title);
    setResultRows([]);
    setResultRowCount(0);
    setResultExecutionTime(null);
    try {
      const start = Date.now();
      const res = await api.post(`/saved-queries/${query.id}/execute`);
      const elapsed = Date.now() - start;
      setResultRows(res.data.data || []);
      setResultRowCount(res.data.rowCount ?? (res.data.data || []).length);
      setResultExecutionTime(elapsed);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || t('queries.executeFailed');
      message.error(msg);
      setResultsModalOpen(false);
    } finally {
      setResultsLoading(false);
    }
  }, []);

  const handleQuickExecute = useCallback(async () => {
    const sql = quickSql.trim();
    if (!sql) {
      message.warning(t('queries.enterSQL'));
      return;
    }
    setQuickExecuting(true);
    setResultsLoading(true);
    setResultsModalOpen(true);
    setResultsTitle(t('queries.adHocTitle'));
    setResultRows([]);
    setResultRowCount(0);
    setResultExecutionTime(null);
    try {
      const start = Date.now();
      const res = await api.post('/saved-queries/0/execute', { sql });
      const elapsed = Date.now() - start;
      setResultRows(res.data.data || []);
      setResultRowCount(res.data.rowCount ?? (res.data.data || []).length);
      setResultExecutionTime(elapsed);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || t('queries.executeFailed');
      message.error(msg);
      setResultsModalOpen(false);
    } finally {
      setQuickExecuting(false);
      setResultsLoading(false);
    }
  }, [quickSql]);

  const handleAiGenerate = useCallback(async () => {
    if (!aiQuestion.trim()) {
      message.warning(t('queries.enterQuestion'));
      return;
    }
    setAiLoading(true);
    setAiGeneratedSql('');
    try {
      const res = await api.post('/ai/query', { question: aiQuestion.trim() });
      const result = res.data.data;
      if (result?.sql) {
        setAiGeneratedSql(result.sql);
        message.success(t('queries.sqlGenerated'));
      } else {
        message.info(t('queries.noSQL'));
      }
    } catch {
      message.error(t('queries.aiFailed'));
    } finally {
      setAiLoading(false);
    }
  }, [aiQuestion]);

  const handleAiSaveAsQuery = useCallback(() => {
    if (!aiGeneratedSql.trim()) return;
    setEditingQuery(null);
    queryForm.resetFields();
    queryForm.setFieldsValue({ sql: aiGeneratedSql });
    setFormIsPublic(false);
    setAiModalOpen(false);
    setAiQuestion('');
    setAiGeneratedSql('');
    setModalOpen(true);
  }, [aiGeneratedSql, queryForm]);

  const resultColumns = useMemo(() => {
    if (resultRows.length === 0) return [];
    return Object.keys(resultRows[0]).map((key) => ({
      title: key,
      dataIndex: key,
      key,
      ellipsis: true as const,
      width: 150,
      render: (v: unknown) => <Text style={{ fontSize: 12 }}>{String(v ?? '')}</Text>,
    }));
  }, [resultRows]);

  const queryTableColumns: ColumnsType<SavedQuery> = [
    {
title: t('queries.queryTitle'),
    dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      sorter: (a, b) => a.title.localeCompare(b.title),
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
title: t('queries.querySQL'),
    dataIndex: 'sql',
      key: 'sql',
      ellipsis: true,
      responsive: ['md' as const],
      render: (v: string) => (
        <Text code style={{ fontSize: 11 }}>
          {v.length > 60 ? v.slice(0, 60) + '…' : v}
        </Text>
      ),
    },
    {
title: t('common.description'),
    dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      responsive: ['lg' as const],
      render: (v: string | null) => v ? <Text type="secondary">{v}</Text> : <Text type="secondary">—</Text>,
    },
    {
title: t('queries.visibility'),
    dataIndex: 'is_public',
      key: 'is_public',
      width: 100,
      render: (v: boolean) => v
        ? <Tag color="green" icon={<GlobalOutlined />}>Public</Tag>
        : <Tag icon={<LockOutlined />}>Private</Tag>,
    },
    {
title: t('queries.createdBy'),
    dataIndex: 'created_by_name',
      key: 'created_by_name',
      responsive: ['lg' as const],
      ellipsis: true,
      render: (v: string, record: SavedQuery) =>
        v || (record.created_by === user?.id ? 'You' : `User ${record.created_by}`),
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      responsive: ['sm' as const],
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
title: t('common.actions'),
    key: 'actions',
      width: 160,
      align: 'right' as const,
    render: (_: unknown, record: SavedQuery) => (
      <Space size={4}>
        <Tooltip title="Execute">
          <Button
            type="text"
            size="small"
            icon={<PlayCircleOutlined />}
            style={{ color: token.colorSuccess }}
            onClick={() => executeQuery(record)}
            aria-label="Execute query"
          />
        </Tooltip>
        {record.created_by === user?.id && (
          <>
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                style={{ color: token.colorPrimary }}
                onClick={() => openEditModal(record)}
                aria-label="Edit query"
              />
            </Tooltip>
<Popconfirm
      title={t('queries.deleteConfirm')}
      description={t('common.cannotUndo')}
      onConfirm={() => handleDelete(record.id)}
      okText={t('common.delete')}
      cancelText={t('common.cancel')}
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Delete">
                <Button type="text" size="small" danger icon={<DeleteOutlined />} aria-label="Delete query" />
              </Tooltip>
            </Popconfirm>
          </>
        )}
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
        <Col xs={24} sm={16}>
          <Space size="middle">
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorInfo})`,
            }}>
              <CodeOutlined style={{ color: '#fff', fontSize: 22 }} />
            </div>
            <div>
<Title level={4} style={{ margin: 0 }}>{t('queries.title')}</Title>
          <Text type="secondary">{t('queries.subtitle')}</Text>
            </div>
          </Space>
        </Col>
        <Col xs={24} sm={8} style={{ textAlign: 'right' }}>
          <Space wrap>
            <Button
              icon={<RobotOutlined />}
              onClick={() => setAiModalOpen(true)}
>
        {t('queries.aiBuilder')}
      </Button>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={openCreateModal}
      >
        {t('queries.newQuery')}
            </Button>
            <Tooltip title="Refresh">
              <Button
                icon={<ReloadOutlined spin={loading} />}
                onClick={fetchQueries}
              />
            </Tooltip>
          </Space>
        </Col>
      </Row>

      <Card
        style={{
          borderColor: token.colorInfo,
          background: `linear-gradient(135deg, ${token.colorInfoBg}, ${token.colorBgContainer})`,
        }}
        styles={{ body: { padding: '16px 20px' } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <ThunderboltOutlined style={{ fontSize: 20, color: token.colorInfo }} />
<Text strong>{t('queries.quickExecute')}</Text>
      <Text type="secondary" style={{ fontSize: 12 }}>{t('queries.quickExecuteDesc')}</Text>
        </div>
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            value={quickSql}
            onChange={(e) => setQuickSql(e.target.value)}
            placeholder={t('queries.sqlPlaceholder')}
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleQuickExecute();
              }
            }}
          />
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleQuickExecute}
            loading={quickExecuting}
            disabled={!quickSql.trim()}
            style={{ height: 'auto', minHeight: 40 }}
>
        {t('queries.run')}
      </Button>
        </Space.Compact>
      </Card>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'mine',
              label: (
                <Space size={4}>
<LockOutlined />
            {t('queries.myQueries')}
                  <Badge count={myQueries.length} showZero size="small" style={{ backgroundColor: token.colorPrimary }} />
                </Space>
              ),
              children: myQueries.length === 0 ? (
                <Empty
                  description={t('queries.noMyQueries')}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
<Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              {t('queries.createFirst')}
                  </Button>
                </Empty>
              ) : (
                <Table
                  dataSource={myQueries}
                  columns={queryTableColumns}
                  rowKey="id"
                  pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} queries` }}
                  scroll={{ x: 700 }}
                  size="middle"
                />
              ),
            },
            {
              key: 'public',
              label: (
                <Space size={4}>
<GlobalOutlined />
            {t('queries.publicQueries')}
                  <Badge count={publicQueries.length} showZero size="small" style={{ backgroundColor: token.colorSuccess }} />
                </Space>
              ),
              children: publicQueries.length === 0 ? (
                <Empty
                  description={t('queries.noPublic')}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <Table
                  dataSource={publicQueries}
                  columns={queryTableColumns}
                  rowKey="id"
                  pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} queries` }}
                  scroll={{ x: 700 }}
                  size="middle"
                />
              ),
            },
          ]}
        />
      </Card>

    <Modal
      title={editingQuery ? t('queries.editQuery') : t('queries.createQuery')}
      open={modalOpen}
      onCancel={closeModal}
      onOk={handleSave}
      okText={t('common.save')}
      okButtonProps={{ loading: saving, icon: <SaveOutlined /> }}
      confirmLoading={saving}
      width={queryModalWidth}
      destroyOnClose
    >
      <Form form={queryForm} layout="vertical" style={{ marginTop: 8 }}>
        <Form.Item label={t('queries.queryTitle')} name="title" rules={[{ required: true, message: t('queries.titleRequired') }]}>
          <Input placeholder="e.g. Top students by department" />
        </Form.Item>
        <Form.Item label={t('queries.querySQL')} name="sql" rules={[{ required: true, message: t('queries.sqlRequired') }]}>
          <TextArea
            placeholder="SELECT * FROM table_name WHERE condition = value"
            autoSize={{ minRows: 4, maxRows: 12 }}
            style={{ fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace", fontSize: 13 }}
          />
        </Form.Item>
        <Form.Item label={<span>{t('queries.descriptionOptional')}</span>} name="description">
          <Input placeholder={t('queries.descriptionPlaceholder')} />
        </Form.Item>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Switch
            checked={formIsPublic}
            onChange={setFormIsPublic}
          />
          <Text>{formIsPublic ? 'Public' : 'Private'}</Text>
          {formIsPublic ? (
            <GlobalOutlined style={{ color: token.colorSuccess }} />
          ) : (
            <LockOutlined style={{ color: token.colorTextQuaternary }} />
          )}
        </div>
      </Form>
    </Modal>

      <Modal
        title={null}
        open={resultsModalOpen}
        onCancel={() => { setResultsModalOpen(false); setResultRows([]); }}
        width={resultsModalWidth}
        footer={null}
        destroyOnClose
        style={{ top: 20 }}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <Title level={4} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <TableOutlined style={{ color: token.colorPrimary }} />
                {resultsTitle}
              </Title>
              <Space style={{ marginTop: 4 }}>
                <Tag icon={<TableOutlined />} color="blue">
                  {resultRowCount} {resultRowCount === 1 ? 'row' : 'rows'}
                </Tag>
                {resultExecutionTime !== null && (
                  <Tag icon={<ClockCircleOutlined />} color="default">
                    {resultExecutionTime < 1000 ? `${resultExecutionTime}ms` : `${(resultExecutionTime / 1000).toFixed(2)}s`}
                  </Tag>
                )}
              </Space>
            </div>
              <Space>
                <Tooltip title="Create a chart from this query's data">
                  <Button
                    icon={<BarChartOutlined />}
                    onClick={() => navigate('/charts')}
>
        {t('queries.saveAsChart')}
      </Button>
                </Tooltip>
              </Space>
          </div>

          {resultsLoading ? (
            <div style={{ textAlign: 'center', padding: 64 }}>
              <Spin size="large" />
              <Paragraph type="secondary" style={{ marginTop: 16 }}>Executing query…</Paragraph>
            </div>
          ) : resultRows.length === 0 ? (
            <Empty description={t('queries.noResults')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Table
              dataSource={resultRows.map((row, i) => ({ _key: i, ...row }))}
              columns={resultColumns}
              rowKey="_key"
              size="small"
              pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `${total} rows` }}
              scroll={{ x: 'max-content', y: 400 }}
            />
          )}
        </div>
      </Modal>

      <Modal
        title={
          <Space>
<RobotOutlined style={{ color: token.colorPrimary }} />
        {t('queries.aiBuilder')}
          </Space>
        }
        open={aiModalOpen}
        onCancel={() => {
          setAiModalOpen(false);
          setAiQuestion('');
          setAiGeneratedSql('');
        }}
        footer={null}
        width={aiModalWidth}
        destroyOnClose
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
          <Paragraph type="secondary">
            Describe what you want to query in plain language. The AI will generate SQL for you.
          </Paragraph>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>{t('queries.aiQuestion')}</Text>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder={t('queries.aiPlaceholder')}
                onPressEnter={handleAiGenerate}
                disabled={aiLoading}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleAiGenerate}
                loading={aiLoading}
                disabled={!aiQuestion.trim()}
>
        {t('queries.generate')}
      </Button>
            </Space.Compact>
          </div>

          {aiGeneratedSql && (
            <>
              <div>
                <Text strong style={{ display: 'block', marginBottom: 6 }}>Generated SQL</Text>
                <pre style={{
                  padding: 12,
                  fontSize: 13,
                  backgroundColor: '#1e293b',
                  color: '#a5f3fc',
                  borderRadius: 8,
                  overflowX: 'auto',
                  fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
                  border: `1px solid ${token.colorBorder}`,
                  margin: 0,
                }}>
                  {aiGeneratedSql}
                </pre>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(aiGeneratedSql);
                    message.success(t('queries.sqlCopied'));
                  }}
                  icon={<FileTextOutlined />}
>
        {t('queries.copySQL')}
      </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleAiSaveAsQuery}
>
        {t('queries.saveAsQuery')}
      </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
