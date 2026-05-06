import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card, Row, Col, Button, Space, Typography, Table, Select, Input,
  Tag, Spin, Empty, Popconfirm, message, theme, Tooltip, Badge,
  Modal, Form, Switch, Tabs,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CodeOutlined, PlusOutlined, DeleteOutlined,
  PlayCircleOutlined, EditOutlined, SaveOutlined,
  RobotOutlined, GlobalOutlined, LockOutlined,
  ReloadOutlined, ThunderboltOutlined, TableOutlined,
  SearchOutlined, FileTextOutlined, BarChartOutlined,
  ClockCircleOutlined, SendOutlined,
} from '@ant-design/icons';
import api from '../lib/api';
import type { SavedQuery } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function SavedQueriesPage() {
  const { token } = theme.useToken();
  const { user } = useAuth();

  const [queries, setQueries] = useState<SavedQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mine');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuery, setEditingQuery] = useState<SavedQuery | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formSql, setFormSql] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsPublic, setFormIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

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
      message.error('Failed to load saved queries.');
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
  const allQueries = useMemo(
    () => activeTab === 'public' ? publicQueries : myQueries,
    [activeTab, myQueries, publicQueries],
  );

  const openCreateModal = useCallback(() => {
    setEditingQuery(null);
    setFormTitle('');
    setFormSql('');
    setFormDescription('');
    setFormIsPublic(false);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((query: SavedQuery) => {
    setEditingQuery(query);
    setFormTitle(query.title);
    setFormSql(query.sql);
    setFormDescription(query.description || '');
    setFormIsPublic(query.is_public);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingQuery(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formTitle.trim() || !formSql.trim()) {
      message.warning('Title and SQL are required.');
      return;
    }
    setSaving(true);
    try {
      if (editingQuery) {
        const res = await api.put(`/saved-queries/${editingQuery.id}`, {
          title: formTitle.trim(),
          sql: formSql.trim(),
          description: formDescription.trim() || undefined,
          isPublic: formIsPublic,
        });
        setQueries((prev) => prev.map((q) => (q.id === editingQuery.id ? res.data.data : q)));
        message.success('Query updated.');
      } else {
        const res = await api.post('/saved-queries', {
          title: formTitle.trim(),
          sql: formSql.trim(),
          description: formDescription.trim() || undefined,
          isPublic: formIsPublic,
        });
        setQueries((prev) => [res.data.data, ...prev]);
        message.success('Query saved.');
      }
      closeModal();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save query.';
      message.error(msg);
    } finally {
      setSaving(false);
    }
  }, [editingQuery, formTitle, formSql, formDescription, formIsPublic, closeModal]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await api.delete(`/saved-queries/${id}`);
      setQueries((prev) => prev.filter((q) => q.id !== id));
      message.success('Query deleted.');
    } catch {
      message.error('Failed to delete query.');
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
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Query execution failed.';
      message.error(msg);
      setResultsModalOpen(false);
    } finally {
      setResultsLoading(false);
    }
  }, []);

  const handleQuickExecute = useCallback(async () => {
    const sql = quickSql.trim();
    if (!sql) {
      message.warning('Enter a SQL query.');
      return;
    }
    setQuickExecuting(true);
    setResultsLoading(true);
    setResultsModalOpen(true);
    setResultsTitle('Ad-hoc Query');
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
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Query execution failed.';
      message.error(msg);
      setResultsModalOpen(false);
    } finally {
      setQuickExecuting(false);
      setResultsLoading(false);
    }
  }, [quickSql]);

  const handleAiGenerate = useCallback(async () => {
    if (!aiQuestion.trim()) {
      message.warning('Enter a question.');
      return;
    }
    setAiLoading(true);
    setAiGeneratedSql('');
    try {
      const res = await api.post('/ai/query', { question: aiQuestion.trim() });
      const result = res.data.data;
      if (result?.sql) {
        setAiGeneratedSql(result.sql);
        message.success('SQL generated.');
      } else {
        message.info('AI did not generate SQL for this question.');
      }
    } catch {
      message.error('AI query generation failed.');
    } finally {
      setAiLoading(false);
    }
  }, [aiQuestion]);

  const handleAiSaveAsQuery = useCallback(() => {
    if (!aiGeneratedSql.trim()) return;
    setEditingQuery(null);
    setFormTitle('');
    setFormSql(aiGeneratedSql);
    setFormDescription('');
    setFormIsPublic(false);
    setAiModalOpen(false);
    setAiQuestion('');
    setAiGeneratedSql('');
    setModalOpen(true);
  }, [aiGeneratedSql]);

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
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      sorter: (a, b) => a.title.localeCompare(b.title),
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: 'SQL',
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
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      responsive: ['lg' as const],
      render: (v: string | null) => v ? <Text type="secondary">{v}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Visibility',
      dataIndex: 'is_public',
      key: 'is_public',
      width: 100,
      render: (v: boolean) => v
        ? <Tag color="green" icon={<GlobalOutlined />}>Public</Tag>
        : <Tag icon={<LockOutlined />}>Private</Tag>,
    },
    {
      title: 'Created By',
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
      title: 'Actions',
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
                />
              </Tooltip>
              <Popconfirm
                title="Delete this query?"
                description="This action cannot be undone."
                onConfirm={() => handleDelete(record.id)}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Delete">
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} />
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
              <Title level={4} style={{ margin: 0 }}>Saved Queries</Title>
              <Text type="secondary">Manage and execute SQL queries on your data</Text>
            </div>
          </Space>
        </Col>
        <Col xs={24} sm={8} style={{ textAlign: 'right' }}>
          <Space wrap>
            <Button
              icon={<RobotOutlined />}
              onClick={() => setAiModalOpen(true)}
            >
              AI Query Builder
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              New Query
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
          <Text strong>Quick Execute</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>(ad-hoc SQL, not saved)</Text>
        </div>
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            value={quickSql}
            onChange={(e) => setQuickSql(e.target.value)}
            placeholder="SELECT * FROM table_name LIMIT 10"
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
            Run
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
                  My Queries
                  <Badge count={myQueries.length} showZero size="small" style={{ backgroundColor: token.colorPrimary }} />
                </Space>
              ),
              children: myQueries.length === 0 ? (
                <Empty
                  description="You haven't saved any queries yet."
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                    Create First Query
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
                  Public Queries
                  <Badge count={publicQueries.length} showZero size="small" style={{ backgroundColor: token.colorSuccess }} />
                </Space>
              ),
              children: publicQueries.length === 0 ? (
                <Empty
                  description="No public queries from other users yet."
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
        title={editingQuery ? 'Edit Query' : 'Create Query'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSave}
        okText={editingQuery ? 'Update' : 'Save'}
        okButtonProps={{ loading: saving, icon: <SaveOutlined />, disabled: !formTitle.trim() || !formSql.trim() }}
        confirmLoading={saving}
        width={Math.min(700, window.innerWidth - 48)}
        destroyOnClose
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>Title</Text>
            <Input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Top students by department"
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>SQL</Text>
            <TextArea
              value={formSql}
              onChange={(e) => setFormSql(e.target.value)}
              placeholder="SELECT * FROM table_name WHERE condition = value"
              autoSize={{ minRows: 4, maxRows: 12 }}
              style={{ fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace", fontSize: 13 }}
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>Description <Text type="secondary">(optional)</Text></Text>
            <Input
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="What does this query do?"
            />
          </div>
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
        </div>
      </Modal>

      <Modal
        title={null}
        open={resultsModalOpen}
        onCancel={() => { setResultsModalOpen(false); setResultRows([]); }}
        width={Math.min(1100, window.innerWidth - 48)}
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
              <Button
                icon={<BarChartOutlined />}
                onClick={() => message.success('Navigate to Charts page with SQL pre-filled')}
              >
                Save as Chart
              </Button>
            </Space>
          </div>

          {resultsLoading ? (
            <div style={{ textAlign: 'center', padding: 64 }}>
              <Spin size="large" />
              <Paragraph type="secondary" style={{ marginTop: 16 }}>Executing query…</Paragraph>
            </div>
          ) : resultRows.length === 0 ? (
            <Empty description="Query returned no results." image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
            AI Query Builder
          </Space>
        }
        open={aiModalOpen}
        onCancel={() => {
          setAiModalOpen(false);
          setAiQuestion('');
          setAiGeneratedSql('');
        }}
        footer={null}
        width={Math.min(650, window.innerWidth - 48)}
        destroyOnClose
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
          <Paragraph type="secondary">
            Describe what you want to query in plain language. The AI will generate SQL for you.
          </Paragraph>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>Your Question</Text>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="e.g. Show me the top 10 students by GPA"
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
                Generate
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
                    message.success('SQL copied to clipboard.');
                  }}
                  icon={<FileTextOutlined />}
                >
                  Copy SQL
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleAiSaveAsQuery}
                >
                  Save as Query
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
