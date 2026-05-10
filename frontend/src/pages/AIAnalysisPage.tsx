import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card, Input, Button, Space, Typography, Spin, Collapse, Select, Tag,
  Empty, Popconfirm, Table, message, Tooltip, Avatar, Divider, theme, Alert,
} from 'antd';
import {
  RobotOutlined, SendOutlined, DeleteOutlined, SaveOutlined,
  LineChartOutlined, TableOutlined, CodeOutlined, BulbOutlined,
  HistoryOutlined, DatabaseOutlined,
} from '@ant-design/icons';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, RadialLinearScale, Title as ChartTitle, Tooltip as ChartTooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import api from '../lib/api';
import type { ChatMessage, QueryableTable } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, RadialLinearScale, ChartTitle, ChartTooltip, Legend, Filler,
);

const { Title, Text, Paragraph } = Typography;

const PALETTE = [
  'rgba(59,130,246,0.75)', 'rgba(16,185,129,0.75)', 'rgba(245,158,11,0.75)',
  'rgba(239,68,68,0.75)', 'rgba(139,92,246,0.75)', 'rgba(236,72,153,0.75)',
  'rgba(20,184,166,0.75)', 'rgba(249,115,22,0.75)', 'rgba(99,102,241,0.75)',
  'rgba(168,85,247,0.75)', 'rgba(34,197,94,0.75)', 'rgba(234,179,8,0.75)',
];

type MiniChartType = 'bar' | 'line' | 'pie' | 'doughnut';

const MINI_CHART_TYPE_KEYS: { value: MiniChartType; labelKey: string }[] = [
  { value: 'bar', labelKey: 'ai.miniBar' },
  { value: 'line', labelKey: 'ai.miniLine' },
  { value: 'pie', labelKey: 'ai.miniPie' },
  { value: 'doughnut', labelKey: 'ai.miniDoughnut' },
];

const SUGGESTED_QUESTION_KEYS = [
  'ai.suggestedQ1',
  'ai.suggestedQ2',
  'ai.suggestedQ3',
  'ai.suggestedQ4',
  'ai.suggestedQ5',
  'ai.suggestedQ6',
];

function isNumeric(val: unknown): boolean {
  return val !== null && val !== undefined && val !== '' && !isNaN(Number(val));
}

function InlineChart({
  data,
  sql,
  onClose,
}: {
  data: Record<string, unknown>[];
  sql?: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const columns = Object.keys(data[0] || {});
  const numericCols = columns.filter((c) => data.slice(0, 10).every((r) => isNumeric(r[c])));
  const labelCols = columns.filter((c) => !numericCols.includes(c));

  const [chartType, setChartType] = useState<MiniChartType>('bar');
  const [labelCol, setLabelCol] = useState(labelCols[0] || columns[0]);
  const [valueCol, setValueCol] = useState(numericCols[0] || columns[1] || columns[0]);
  const [saveTitle, setSaveTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!saveTitle.trim() || !sql) return;
    setSaving(true);
    try {
      await api.post('/charts', {
        title: saveTitle.trim(),
        chartType,
        config: { sql, labelCol, valueCol },
      });
      setSaved(true);
      message.success(t('ai.chartSaved'));
      setTimeout(() => setSaved(false), 3000);
      setSaveTitle('');
    } catch {
      message.error(t('ai.chartSaveFailed'));
    } finally {
      setSaving(false);
    }
  }

  const labels = data.map((r) => String(r[labelCol] ?? ''));
  const values = data.map((r) => Number(r[valueCol] ?? 0));
  const bgColors = PALETTE.slice(0, labels.length).concat(
    PALETTE.slice(0, Math.max(0, labels.length - PALETTE.length)),
  );
  const borderColors = bgColors.map((c) => c.replace('0.75', '1'));

  const chartData = {
    labels,
    datasets: [{
      label: valueCol,
      data: values,
      backgroundColor: bgColors,
      borderColor: borderColors,
      borderWidth: 1,
      fill: chartType === 'line',
      tension: 0.3,
    }],
  };

  const baseOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: chartType === 'pie' || chartType === 'doughnut', position: 'right' as const },
      tooltip: { mode: 'index' as const },
    },
  };

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Space size={4}>
{MINI_CHART_TYPE_KEYS.map(({ value, labelKey }) => (
        <Tag
          key={value}
          color={chartType === value ? token.colorPrimary : undefined}
          style={{ cursor: 'pointer' }}
          onClick={() => setChartType(value)}
        >
          {t(labelKey)}
        </Tag>
      ))}
        </Space>
        <Select
          value={labelCol}
          onChange={setLabelCol}
          size="small"
          style={{ width: 140 }}
options={columns.map((c) => ({ value: c, label: `${t('ai.labelCol')}: ${c}` }))}
      />
      <Select
        value={valueCol}
        onChange={setValueCol}
        size="small"
        style={{ width: 140 }}
        options={columns.map((c) => ({ value: c, label: `${t('ai.valueCol')}: ${c}` }))}
      />
      <Tooltip title={t('ai.closeChart')}>
          <Button icon={<DeleteOutlined />} size="small" type="text" onClick={onClose} style={{ marginLeft: 'auto' }} />
        </Tooltip>
      </div>
      <div style={{
        height: 260,
        backgroundColor: token.colorBgElevated,
        borderRadius: 8,
        padding: 12,
        border: `1px solid ${token.colorBorder}`,
      }}>
        {chartType === 'bar' && <Bar data={chartData} options={baseOpts} />}
        {chartType === 'line' && <Line data={chartData} options={baseOpts} />}
        {chartType === 'pie' && <Pie data={chartData} options={baseOpts} />}
        {chartType === 'doughnut' && <Doughnut data={chartData} options={baseOpts} />}
      </div>
      {sql && (
        <Space.Compact style={{ width: '100%', marginTop: 12 }}>
          <Input
            value={saveTitle}
            onChange={(e) => setSaveTitle(e.target.value)}
            placeholder={t('ai.chartTitlePlaceholder')}
            size="small"
            onPressEnter={handleSave}
          />
          <Button
            type="primary"
            size="small"
            onClick={handleSave}
            disabled={!saveTitle.trim() || saving || saved}
            icon={saved ? <></> : <SaveOutlined />}
            loading={saving}
          >
            {saved ? t('ai.saved') : t('ai.saveChart')}
          </Button>
        </Space.Compact>
      )}
    </div>
  );
}

function DataResultTable({ data }: { data: Record<string, unknown>[] }) {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  if (data.length === 0) return null;
  const columns = Object.keys(data[0]);

  const tableCols = columns.map((c) => ({
    title: c,
    dataIndex: c,
    key: c,
    ellipsis: true as const,
    width: 150,
    render: (v: unknown) => <Text style={{ fontSize: 12 }}>{String(v ?? '')}</Text>,
  }));

  return (
    <Table
      dataSource={data.map((row, i) => ({ ...row, _key: i }))}
      columns={tableCols}
      rowKey="_key"
      size="small"
      pagination={{ pageSize: 10, size: 'small', showSizeChanger: false, showTotal: (total) => `${total} ${t('ai.rows')}` }}
      scroll={{ x: 'max-content', y: 320 }}
      style={{ marginTop: 8 }}
    />
  );
}

function renderInsights(text: string): React.ReactNode {
  const paragraphs = text.split(/\n{2,}/);
  return paragraphs.map((para, pi) => {
    const lines = para.split('\n');
    return (
      <div key={pi} style={{ marginBottom: pi < paragraphs.length - 1 ? 12 : 0 }}>
        {lines.map((line, li) => {
          const rendered = renderInlineMarkdown(line);
          if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
            return <div key={li} style={{ marginLeft: 12, marginBottom: 2 }}>{rendered}</div>;
          }
          if (/^\d+\.\s/.test(line)) {
            return <div key={li} style={{ marginLeft: 12, marginBottom: 2 }}>{rendered}</div>;
          }
          return <div key={li} style={{ marginBottom: 2 }}>{rendered}</div>;
        })}
      </div>
    );
  });
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} style={{
          backgroundColor: 'rgba(148,163,184,0.15)',
          padding: '1px 5px',
          borderRadius: 4,
          fontSize: '0.9em',
        }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const [showSql, setShowSql] = useState(false);
  const [showData, setShowData] = useState(true);
  const [showChart, setShowChart] = useState(false);

  if (message.role === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <div style={{
          maxWidth: '75%',
          backgroundColor: token.colorPrimary,
          color: token.colorWhite,
          borderRadius: '18px 18px 4px 18px',
          padding: '10px 16px',
          boxShadow: `0 1px 4px ${token.colorPrimary}33`,
        }}>
          <Text style={{ color: token.colorWhite, whiteSpace: 'pre-wrap' }}>{message.content}</Text>
        </div>
        <Avatar
          size={36}
          style={{ backgroundColor: token.colorPrimary, flexShrink: 0, marginTop: 2 }}
          icon={<SendOutlined />}
        />
      </div>
    );
  }

  const hasResults = message.data && message.data.length > 0;
  const hasInsights = !!message.insights;

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 8 }}>
      <Avatar
        size={36}
        style={{ backgroundColor: token.colorBgContainer, border: `1.5px solid ${token.colorPrimary}`, flexShrink: 0, marginTop: 2 }}
        icon={<RobotOutlined style={{ color: token.colorPrimary }} />}
      />
      <div style={{
        maxWidth: '88%',
        backgroundColor: token.colorBgElevated,
        borderRadius: '18px 18px 18px 4px',
        padding: '12px 16px',
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: `0 1px 3px rgba(0,0,0,0.06)`,
      }}>
        {hasInsights ? (
          <div style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <BulbOutlined style={{ color: token.colorWarning }} />
              <Text strong>{t('ai.insights')}</Text>
            </div>
            <div style={{ lineHeight: 1.6 }}>
              {renderInsights(message.insights!)}
            </div>
          </div>
        ) : (
          <Text style={{ whiteSpace: 'pre-wrap' }}>{message.content}</Text>
        )}

        {message.sql && (
          <>
            <Divider style={{ margin: '12px 0 8px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {message.rowCount !== undefined && (
                <Tag
                  color={message.rowCount > 0 ? 'success' : 'warning'}
                  icon={<TableOutlined />}
                  style={{ margin: 0 }}
                >
                  {message.rowCount} {message.rowCount === 1 ? t('ai.row') : t('ai.rows')}
                </Tag>
              )}
              {hasResults && (
<Tooltip title={t('ai.visualize')}>
        <Button
          size="small"
          type={showChart ? 'primary' : 'text'}
          icon={<LineChartOutlined />}
          onClick={() => {
            setShowChart(!showChart);
            if (!showChart) setShowData(false);
          }}
        >
          {showChart ? t('ai.hideChart') : t('ai.visualize')}
        </Button>
      </Tooltip>
              )}
              {hasResults && !showChart && (
<Tooltip title={showData ? t('ai.hideData') : t('ai.showData')}>
        <Button
          size="small"
          type="text"
          icon={<TableOutlined />}
          onClick={() => setShowData(!showData)}
        >
          {showData ? t('ai.hideData') : t('ai.showData')}
        </Button>
      </Tooltip>
              )}
<Tooltip title={showSql ? t('ai.hideSQL') : t('ai.viewSQL')}>
        <Button
          size="small"
          type="text"
          icon={<CodeOutlined />}
          onClick={() => setShowSql(!showSql)}
          style={{ marginLeft: 'auto' }}
        >
          {showSql ? t('ai.hideSQL') : t('ai.viewSQL')}
        </Button>
      </Tooltip>
            </div>
          </>
        )}

        {showSql && message.sql && (
          <pre style={{
            marginTop: 8,
            padding: 12,
            fontSize: 12,
            backgroundColor: '#1e293b',
            color: '#a5f3fc',
            borderRadius: 8,
            overflowX: 'auto',
            fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
            border: `1px solid ${token.colorBorder}`,
          }}>
            {message.sql}
          </pre>
        )}

        {message.sql && message.data && message.data.length === 0 && (
          <div style={{
            marginTop: 8,
            padding: '8px 12px',
            backgroundColor: token.colorWarningBg,
            borderRadius: 8,
            border: `1px solid ${token.colorWarningBorder}`,
          }}>
            <Text type="warning" style={{ fontSize: 13 }}>{t('ai.noResults')}</Text>
          </div>
        )}

        {hasResults && showData && !showChart && (
          <div style={{ marginTop: 8 }}>
            <DataResultTable data={message.data!} />
          </div>
        )}

        {hasResults && showChart && (
          <InlineChart
            data={message.data!}
            sql={message.sql}
            onClose={() => { setShowChart(false); setShowData(true); }}
          />
        )}
      </div>
    </div>
  );
}

export default function AIAnalysisPage() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState<QueryableTable[]>([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const [historyError, setHistoryError] = useState(false);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    setHistoryError(false);
    api.get('/ai/history')
      .then((r) => setMessages(r.data.data || []))
      .catch(() => { setHistoryError(true); });
    setTablesLoading(true);
    api.get('/ai/tables')
      .then((r) => setTables(r.data.data || []))
      .catch(() => { message.error(t('ai.tablesFailed')); })
      .finally(() => setTablesLoading(false));
  }, []);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const q = question.trim();
    if (!q || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await api.post('/ai/query', { question: q });
      const result = res.data.data;
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: result.explanation || '',
          sql: result.sql,
          data: result.data,
          rowCount: result.rowCount,
          insights: result.insights,
        },
      ]);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || t('ai.queryFailed');
      message.error(errMsg);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: errMsg },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  async function clearHistory() {
    try {
      await api.delete('/ai/history');
      setMessages([]);
message.success(t('ai.clearSuccess'));
  } catch {
    message.error(t('ai.clearFailed'));
    }
  }

  function handleSuggestedQuestion(q: string) {
    setQuestion(q);
    setTimeout(() => {
      const nativeEvent = new Event('submit', { cancelable: true }) as any;
      const form = document.getElementById('ai-chat-form') as HTMLFormElement;
      if (form) {
        setQuestion(q);
      }
    }, 0);
    setQuestion(q);
  }

  const chatEmpty = messages.length === 0 && !loading;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 4rem)',
      maxHeight: 'calc(100vh - 4rem)',
      padding: '0 0 0 0',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px 12px',
        flexShrink: 0,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        backgroundColor: token.colorBgContainer,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            size={40}
            style={{ backgroundColor: token.colorPrimaryBg }}
            icon={<RobotOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />}
          />
          <div>
<Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          {t('ai.title')}
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {t('ai.subtitle')}
        </Text>
          </div>
        </div>
        <Space>
<Tooltip title={t('ai.availableTables')}>
        <Button
          icon={<DatabaseOutlined />}
          size="middle"
          loading={tablesLoading}
          onClick={() => {}}
          style={{ display: 'none' }}
        >
          {t('ai.tablesCount')} ({tables.length})
        </Button>
      </Tooltip>
          {messages.length > 0 && (
<Popconfirm
        title={t('ai.clearConfirm')}
        description={t('ai.clearDesc')}
        onConfirm={clearHistory}
        okText={t('ai.clear')}
        okButtonProps={{ danger: true }}
      >
        <Button icon={<DeleteOutlined />} danger type="text" size="middle">
          {t('ai.clear')}
        </Button>
      </Popconfirm>
          )}
        </Space>
      </div>

      {tables.length > 0 && (
        <div style={{
          padding: '8px 24px',
          flexShrink: 0,
          backgroundColor: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}>
          <Collapse
            ghost
            size="small"
            items={[{
              key: 'tables',
              label: (
                <Space size={6}>
                  <DatabaseOutlined style={{ color: token.colorPrimary }} />
                  <Text strong style={{ fontSize: 13 }}>{t('ai.availableTables')}</Text>
                  <Tag color="blue" style={{ margin: 0 }}>{tables.length}</Tag>
                </Space>
              ),
              children: (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
{tables.map((tbl) => (
        <Tag
          key={tbl.id}
          icon={<TableOutlined />}
          color="default"
          style={{ padding: '4px 10px', borderRadius: 6 }}
        >
          <Text code style={{ fontSize: 12 }}>{tbl.table_name}</Text>
          <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
            ({tbl.row_count.toLocaleString()} {t('ai.rows')})
                      </Text>
                    </Tag>
                  ))}
                </div>
              ),
            }]}
          />
        </div>
      )}

      <div
        ref={chatContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
          padding: '20px 24px',
          backgroundColor: token.colorBgLayout,
        }}
      >
    {chatEmpty && (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        maxWidth: 640,
        margin: '0 auto',
        textAlign: 'center',
      }}>
        {historyError && (
<Alert
      type="warning"
      message={t('ai.historyError')}
      description={t('ai.historyErrorDesc')}
      showIcon
      style={{ marginBottom: 16, width: '100%' }}
    />
        )}
        <Avatar
              size={64}
              style={{
                backgroundColor: token.colorPrimaryBg,
                marginBottom: 16,
              }}
              icon={<RobotOutlined style={{ color: token.colorPrimary, fontSize: 32 }} />}
            />
<Title level={3} style={{ marginBottom: 8 }}>
        {t('ai.welcome')}
      </Title>
      <Paragraph type="secondary" style={{ fontSize: 15, marginBottom: 24 }}>
        {t('ai.welcomeDesc')}
      </Paragraph>
      <Divider style={{ marginBottom: 24 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          <BulbOutlined /> {t('ai.tryAsking')}
        </Text>
      </Divider>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 10,
              width: '100%',
            }}>
{SUGGESTED_QUESTION_KEYS.map((key) => (
          <Card
            key={key}
            size="small"
            hoverable
            style={{
              borderRadius: 10,
              cursor: 'pointer',
              textAlign: 'left',
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
            onClick={() => {
              setQuestion(t(key));
              inputRef.current?.focus();
            }}
          >
            <Text style={{ fontSize: 13 }}>{t(key)}</Text>
          </Card>
        ))}
            </div>
          </div>
        )}

        {!chatEmpty && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900, margin: '0 auto' }}>
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 8 }}>
                <Avatar
                  size={36}
                  style={{ backgroundColor: token.colorBgContainer, border: `1.5px solid ${token.colorPrimary}`, flexShrink: 0 }}
                  icon={<RobotOutlined style={{ color: token.colorPrimary }} />}
                />
                <div style={{
                  backgroundColor: token.colorBgElevated,
                  borderRadius: '18px 18px 18px 4px',
                  padding: '12px 16px',
                  border: `1px solid ${token.colorBorderSecondary}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <Spin size="small" />
                  <Text type="secondary">{t('ai.analyzing')}</Text>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div style={{
        flexShrink: 0,
        padding: '12px 24px 16px',
        backgroundColor: token.colorBgContainer,
        borderTop: `1px solid ${token.colorBorderSecondary}`,
      }}>
        <form
          id="ai-chat-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          style={{
            display: 'flex',
            gap: 8,
            maxWidth: 900,
            margin: '0 auto',
          }}
        >
          <Input
            ref={inputRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t('ai.placeholder')}
            size="large"
            disabled={loading}
            style={{ borderRadius: 10 }}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button
            type="primary"
            htmlType="submit"
            icon={<SendOutlined />}
            size="large"
            disabled={loading || !question.trim()}
            style={{ borderRadius: 10, minWidth: 48 }}
          />
        </form>
        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {t('ai.disclaimer')}
          </Text>
        </div>
      </div>
    </div>
  );
}
